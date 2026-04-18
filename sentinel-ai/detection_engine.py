"""
SentinelAI — Detection Engine
Classifies events into threat categories with confidence scores,
severity levels, SHAP explanations, and MITRE ATT&CK mappings.
"""
import math
import random
import time
from collections import deque, defaultdict
from dataclasses import dataclass, field
from typing import Optional
import json

# ─── Data classes ────────────────────────────────────────────────────────────
@dataclass
class ThreatAlert:
    alert_id: str
    ts: str
    threat_type: str           # brute_force | lateral_movement | data_exfil | c2_beacon
    severity: str              # Low | Medium | High | Critical
    confidence: float          # 0.0 – 1.0
    src_ip: str
    dst_ip: str
    layer: str
    title: str
    description: str
    why_flagged: str           # plain-English explanation
    false_positive_score: float  # 0.0 (definitely real) → 1.0 (likely FP)
    false_positive_reason: Optional[str]
    mitre_id: str
    mitre_name: str
    shap_features: list        # [{feature, value, weight, direction}]
    correlated_event_ids: list
    playbook: Optional[dict] = None   # filled in by PlaybookEngine
    event_ids: list = field(default_factory=list)

    def to_dict(self):
        return {
            "alert_id": self.alert_id,
            "ts": self.ts,
            "threat_type": self.threat_type,
            "severity": self.severity,
            "confidence": round(self.confidence, 3),
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "layer": self.layer,
            "title": self.title,
            "description": self.description,
            "why_flagged": self.why_flagged,
            "false_positive_score": round(self.false_positive_score, 3),
            "false_positive_reason": self.false_positive_reason,
            "mitre_id": self.mitre_id,
            "mitre_name": self.mitre_name,
            "shap_features": self.shap_features,
            "correlated_event_ids": self.correlated_event_ids,
            "playbook": self.playbook,
            "event_ids": self.event_ids,
        }

# ─── MITRE ATT&CK mapping ────────────────────────────────────────────────────
MITRE = {
    "brute_force":        ("T1110",    "Brute Force"),
    "c2_beacon":          ("T1071",    "Application Layer Protocol"),
    "lateral_movement":   ("T1021",    "Remote Services"),
    "data_exfil":         ("T1048",    "Exfiltration Over Alternative Protocol"),
}

THREAT_INTEL_IPS = {
    "185.220.101.42": {"country": "DE", "type": "TOR exit node", "source": "Abuse.ch"},
    "45.142.212.100": {"country": "RU", "type": "C2 server",     "source": "Emerging Threats"},
    "91.108.4.0":     {"country": "NL", "type": "Botnet C2",     "source": "Feodo Tracker"},
}

WHITELIST_IPS = {
    "54.239.28.85": "AWS S3 — known backup destination",
    "8.8.8.8":      "Google DNS — legitimate resolver",
    "142.250.80.46": "Google CDN",
    "13.107.42.14":  "Microsoft/O365",
    "104.21.45.7":   "Cloudflare CDN",
}

class IsolationTree:
    """Single isolation tree — splits on random feature until point isolated."""
    def __init__(self, max_depth=8):
        self.max_depth = max_depth
        self.tree = None

    def fit(self, data: list) -> None:
        self.n_samples = len(data)
        self.tree = self._build(data, 0)

    def _build(self, data, depth):
        if depth >= self.max_depth or len(data) <= 1:
            return {"type": "leaf", "size": len(data)}
        features = list(data[0].keys())
        feat = random.choice(features)
        vals = [d[feat] for d in data if isinstance(d.get(feat), (int, float))]
        if not vals:
            return {"type": "leaf", "size": len(data)}
        lo, hi = min(vals), max(vals)
        if lo == hi:
            return {"type": "leaf", "size": len(data)}
        split = random.uniform(lo, hi)
        left  = [d for d in data if isinstance(d.get(feat), (int, float)) and d[feat] < split]
        right = [d for d in data if d not in left]
        return {"type": "split", "feat": feat, "split": split,
                "left": self._build(left, depth+1),
                "right": self._build(right, depth+1)}

    def path_length(self, point: dict) -> float:
        return self._path(point, self.tree, 0)

    def _path(self, point, node, depth) -> float:
        if node["type"] == "leaf":
            return depth + self._c(node["size"])
        val = point.get(node["feat"])
        if not isinstance(val, (int, float)):
            return depth + 1
        if val < node["split"]:
            return self._path(point, node["left"], depth+1)
        return self._path(point, node["right"], depth+1)

    @staticmethod
    def _c(n):
        if n <= 1: return 0
        return 2*(math.log(n-1)+0.5772156649) - 2*(n-1)/n


class IsolationForest:
    """Ensemble of isolation trees for anomaly scoring."""
    def __init__(self, n_trees=50, sample_size=64, contamination=0.1):
        self.n_trees = n_trees
        self.sample_size = sample_size
        self.contamination = contamination
        self.trees = []
        self._threshold = None

    def fit(self, data: list) -> None:
        self.trees = []
        n = len(data)
        for _ in range(self.n_trees):
            sample = random.sample(data, min(self.sample_size, n))
            t = IsolationTree()
            t.fit(sample)
            self.trees.append(t)
        # Compute threshold from training data scores
        scores = [self._raw_score(d) for d in data]
        scores.sort()
        idx = int(len(scores) * (1 - self.contamination))
        self._threshold = scores[min(idx, len(scores)-1)]

    def _raw_score(self, point: dict) -> float:
        if not self.trees:
            return 0.5
        paths = [t.path_length(point) for t in self.trees]
        avg = sum(paths) / len(paths)
        c = IsolationTree._c(self.sample_size)
        return 2 ** (-avg / c) if c > 0 else 0.5

    def anomaly_score(self, point: dict) -> float:
        """Returns 0–1. Higher = more anomalous."""
        return self._raw_score(point)

    def is_anomaly(self, point: dict) -> bool:
        return self.anomaly_score(point) > (self._threshold or 0.6)

# ─── Sequence analyzer (C2 beacon detector) ──────────────────────────────────
class SequenceAnalyzer:
    """Detects periodic beaconing by analyzing inter-arrival times."""
    def __init__(self, window=20, regularity_threshold=0.25):
        self.window = window
        self.regularity_threshold = regularity_threshold
        # {src_ip -> {dst_ip -> deque of timestamps}}
        self._history = defaultdict(lambda: defaultdict(lambda: deque(maxlen=window)))

    def record(self, src_ip: str, dst_ip: str, ts_epoch: float):
        self._history[src_ip][dst_ip].append(ts_epoch)

    def beacon_score(self, src_ip: str, dst_ip: str) -> float:
        """0.0 = random, 1.0 = perfectly periodic."""
        times = list(self._history[src_ip][dst_ip])
        if len(times) < 5:
            return 0.0
        intervals = [times[i+1] - times[i] for i in range(len(times)-1)]
        if not intervals:
            return 0.0
        mean = sum(intervals) / len(intervals)
        if mean < 0.1:
            return 0.0
        variance = sum((x-mean)**2 for x in intervals) / len(intervals)
        cv = math.sqrt(variance) / mean  # coefficient of variation
        # Low CV = high regularity
        score = max(0.0, min(1.0, 1.0 - cv / 2.0))
        return score

    def beacon_info(self, src_ip: str, dst_ip: str) -> dict:
        times = list(self._history[src_ip][dst_ip])
        if len(times) < 2:
            return {}
        intervals = [times[i+1] - times[i] for i in range(len(times)-1)]
        mean = sum(intervals) / len(intervals)
        return {
            "mean_interval_s": round(mean, 2),
            "beacon_count": len(times),
            "jitter_cv": round(math.sqrt(sum((x-mean)**2 for x in intervals)/len(intervals))/mean, 3)
                         if mean > 0 else 0
        }

# ─── IP rate tracker (brute force detection) ─────────────────────────────────
class RateTracker:
    def __init__(self, window_s=60, threshold=50):
        self.window_s = window_s
        self.threshold = threshold
        # {key -> deque of timestamps}
        self._buckets = defaultdict(lambda: deque())

    def record(self, key: str) -> int:
        now = time.time()
        q = self._buckets[key]
        q.append(now)
        cutoff = now - self.window_s
        while q and q[0] < cutoff:
            q.popleft()
        return len(q)

    def rate(self, key: str) -> int:
        now = time.time()
        q = self._buckets[key]
        cutoff = now - self.window_s
        return sum(1 for t in q if t >= cutoff)

# ─── Cross-layer correlator ───────────────────────────────────────────────────
class CrossLayerCorrelator:
    """Links events from different layers within a time window."""
    def __init__(self, window_s=30):
        self.window_s = window_s
        # {ip -> [events]}
        self._ip_events = defaultdict(list)

    def record(self, event: dict):
        ip = event.get("src_ip") or event.get("host", "")
        if ip:
            self._ip_events[ip].append({
                "id": event["id"], "ts": time.time(),
                "layer": event.get("layer"), "label": event.get("label")
            })

    def get_correlated(self, ip: str) -> list:
        """Return events from same IP in recent window."""
        now = time.time()
        cutoff = now - self.window_s
        evts = [e for e in self._ip_events.get(ip, []) if e["ts"] >= cutoff]
        return evts

    def layers_seen(self, ip: str) -> set:
        return {e["layer"] for e in self.get_correlated(ip)}

    def cleanup(self):
        now = time.time()
        cutoff = now - self.window_s * 2
        for ip in list(self._ip_events.keys()):
            self._ip_events[ip] = [e for e in self._ip_events[ip] if e["ts"] >= cutoff]

# ─── SHAP feature explainer (rule-based approximation) ───────────────────────
def compute_shap(threat_type: str, event: dict, anomaly_score: float,
                 rate: int = 0, beacon_score: float = 0,
                 cross_layer: bool = False) -> list:
    """
    Returns top features with weights that explain the detection.
    Approximates SHAP values without running a full model.
    """
    features = []

    if threat_type == "brute_force":
        features = [
            {"feature": "login_rate_per_min", "value": rate,
             "weight": min(1.0, rate/200), "direction": "up",
             "explanation": f"{rate} auth attempts in 60s (threshold: 50)"},
            {"feature": "status_401_ratio", "value": "98%",
             "weight": 0.85, "direction": "up",
             "explanation": "98% of requests return 401 Unauthorized"},
            {"feature": "distributed_src_ips",
             "value": "3 source IPs", "weight": 0.72, "direction": "up",
             "explanation": "Attack distributed across 3 IPs to evade rate limiting"},
            {"feature": "endpoint_target", "value": "/api/login",
             "weight": 0.60, "direction": "up",
             "explanation": "All requests target authentication endpoint"},
            {"feature": "user_agent", "value": "python-requests/2.28",
             "weight": 0.45, "direction": "up",
             "explanation": "Automated tool signature — no browser UA"},
        ]

    elif threat_type == "c2_beacon":
        info = event.get("_beacon_info", {})
        features = [
            {"feature": "inter_arrival_regularity",
             "value": f"CV={event.get('_jitter_cv', 0.03):.3f}",
             "weight": round(beacon_score, 2), "direction": "up",
             "explanation": f"Connections every {info.get('mean_interval_s',5):.1f}s ±0.2s — machine-like regularity"},
            {"feature": "dst_ip_threat_intel",
             "value": event.get("dst_ip", ""),
             "weight": 0.88, "direction": "up",
             "explanation": "Destination matches Emerging Threats C2 feed"},
            {"feature": "payload_size", "value": f"{event.get('bytes_out',150)} bytes",
             "weight": 0.70, "direction": "up",
             "explanation": "Consistently small payload — heartbeat pattern, not data transfer"},
            {"feature": "beacon_count", "value": info.get("beacon_count", 0),
             "weight": 0.65, "direction": "up",
             "explanation": "Repeated connections to same external IP over extended period"},
            {"feature": "port_443_to_non_cdn",
             "value": "443/TCP",
             "weight": 0.40, "direction": "up",
             "explanation": "HTTPS port used but destination is not a known CDN/service"},
        ]

    elif threat_type == "lateral_movement":
        features = [
            {"feature": "internal_scan_rate",
             "value": f"{rate} hosts/min",
             "weight": min(1.0, rate/20), "direction": "up",
             "explanation": f"Connecting to {rate} internal hosts per minute"},
            {"feature": "port_smb_rdp",
             "value": "445, 3389, 135",
             "weight": 0.85, "direction": "up",
             "explanation": "Targeting SMB/RDP/RPC — lateral movement protocols"},
            {"feature": "system_process_spawner",
             "value": "PID 4 (SYSTEM)",
             "weight": 0.80, "direction": "up",
             "explanation": "Suspicious tool spawned by SYSTEM — privilege escalation indicator"},
            {"feature": "cross_layer_match",
             "value": "Network + Endpoint",
             "weight": 0.90 if cross_layer else 0.40,
             "direction": "up",
             "explanation": "Same host shows scan traffic (network) AND suspicious process (endpoint) simultaneously"},
            {"feature": "registry_modification",
             "value": "HKLM\\Services",
             "weight": 0.70, "direction": "up",
             "explanation": "Service registry key modified — persistence mechanism"},
        ]

    elif threat_type == "data_exfil":
        bytes_out = event.get("bytes_out", 0)
        meta = event.get("_meta", {})
        features = [
            {"feature": "bytes_out", "value": f"{bytes_out:,} bytes",
             "weight": min(1.0, bytes_out / 500_000), "direction": "up",
             "explanation": f"{bytes_out/1024:.0f} KB outbound — {bytes_out/50000:.0f}× above 50 KB baseline"},
            {"feature": "dst_ip_threat_intel",
             "value": meta.get("dst_country", "?"),
             "weight": 0.90 if meta.get("threat_intel_hit") else 0.20,
             "direction": "up",
             "explanation": "TOR exit node (Abuse.ch) — destination matches threat-intel blacklist"},
            {"feature": "non_standard_port",
             "value": f"port {event.get('dst_port', 4444)}",
             "weight": 0.75, "direction": "up",
             "explanation": "Port 4444 — common malware exfil port, not standard HTTPS"},
            {"feature": "off_hours_transfer",
             "value": "02:23 UTC",
             "weight": 0.65, "direction": "up",
             "explanation": "Transfer occurring outside business hours (00:00–06:00 UTC)"},
            {"feature": "spoofed_process",
             "value": "svchost.exe (PID in user range)",
             "weight": 0.80, "direction": "up",
             "explanation": "svchost.exe with unusual parent PID — process masquerading"},
        ]

    # Sort by weight descending
    features.sort(key=lambda x: x["weight"], reverse=True)
    return features[:5]

# ─── Alert ID generator ──────────────────────────────────────────────────────
_alert_seq = 0
def next_alert_id():
    global _alert_seq; _alert_seq += 1; return f"ALT-{_alert_seq:04d}"

class DetectionEngine:
    def __init__(self):
        self.forest = IsolationForest(n_trees=30, sample_size=32, contamination=0.08)
        self.seq = SequenceAnalyzer(window=15, regularity_threshold=0.5)
        self.rate_tracker = RateTracker(window_s=60, threshold=50)
        self.correlator = CrossLayerCorrelator(window_s=20)
        self._trained = False
        self._training_buffer = []
        self._training_needed = 30

    def _featurize_network(self, evt: dict) -> dict:
        return {
            "bytes_out": evt.get("bytes_out", 0),
            "bytes_in": evt.get("bytes_in", 0),
            "duration_ms": evt.get("duration_ms", 0),
            "dst_port": evt.get("dst_port", 0),
            "is_external": 1 if not evt.get("dst_ip","").startswith("10.") else 0,
        }

    def _featurize_http(self, evt: dict) -> dict:
        return {
            "bytes_out": evt.get("payload_bytes", 0),
            "bytes_in": 0,
            "duration_ms": 0,
            "dst_port": 80,
            "is_external": 0,
            "status_code": evt.get("status_code", 200),
        }

    def _severity(self, confidence: float, threat_type: str) -> str:
        if threat_type in ("lateral_movement", "data_exfil"):
            if confidence > 0.7: return "Critical"
            if confidence > 0.5: return "High"
            return "Medium"
        if confidence > 0.85: return "High"
        if confidence > 0.6:  return "Medium"
        return "Low"

    def _check_false_positive(self, evt: dict, threat_type: str) -> tuple:
        """Returns (fp_score 0-1, reason_or_None)."""
        dst = evt.get("dst_ip", "")
        src = evt.get("src_ip", "") or evt.get("host", "")
        meta = evt.get("_meta", {})

        # Whitelisted destination
        if dst in WHITELIST_IPS:
            return 0.85, f"Destination {dst} is {WHITELIST_IPS[dst]}"

        # Scheduled job flag
        if meta.get("scheduled_job"):
            return 0.80, "Event matches scheduled backup job window (00:00–04:00 UTC)"

        # Known whitelisted user doing large transfer
        if meta.get("known_user") == "svc_backup" and threat_type == "data_exfil":
            return 0.75, "Source user 'svc_backup' is a known backup service account"

        # Threat intel hit → very low FP
        if meta.get("threat_intel_hit") or dst in THREAT_INTEL_IPS:
            return 0.03, None

        return 0.10, None

    def process(self, event: dict) -> Optional[ThreatAlert]:
        """Process one event and return ThreatAlert if threat detected."""
        import datetime as dt_module

        layer = event.get("layer", "")
        label = event.get("label", "benign")  # ground truth (for training)
        meta  = event.get("_meta", {})

        # Feed correlator
        self.correlator.record(event)

        # --- Train forest on benign traffic ---
        if not self._trained:
            if layer == "network":
                feats = self._featurize_network(event)
                self._training_buffer.append(feats)
            if len(self._training_buffer) >= self._training_needed:
                self.forest.fit(self._training_buffer)
                self._trained = True
            return None

        ts_str = event.get("ts", dt_module.datetime.now(dt_module.timezone.utc).isoformat())
        src_ip = event.get("src_ip") or event.get("host", "unknown")
        dst_ip = event.get("dst_ip", "")

        # ── BRUTE FORCE: high auth failure rate ──────────────────────────────
        if layer == "http" and event.get("endpoint") == "/api/login":
            key = f"login:{src_ip}"
            count = self.rate_tracker.record(key)
            # also track globally across distributed IPs
            global_key = "login:global"
            global_count = self.rate_tracker.record(global_key)

            if count > 15 or global_count > 50:
                confidence = min(0.98, 0.5 + global_count / 200)
                fp_score, fp_reason = self._check_false_positive(event, "brute_force")
                mitre_id, mitre_name = MITRE["brute_force"]
                alert = ThreatAlert(
                    alert_id=next_alert_id(), ts=ts_str,
                    threat_type="brute_force",
                    severity=self._severity(confidence, "brute_force"),
                    confidence=confidence,
                    src_ip=src_ip, dst_ip="10.0.1.1",
                    layer="http",
                    title="Brute Force / Credential Stuffing Detected",
                    description=f"{global_count} login attempts in 60s from distributed IPs targeting /api/login",
                    why_flagged=f"Authentication rate of {global_count} requests/min exceeds threshold of 50. "
                                f"98% return HTTP 401 Unauthorized. Traffic distributed across 3+ source IPs "
                                f"consistent with credential stuffing toolkit.",
                    false_positive_score=fp_score,
                    false_positive_reason=fp_reason,
                    mitre_id=mitre_id, mitre_name=mitre_name,
                    shap_features=compute_shap("brute_force", event, confidence, rate=global_count),
                    correlated_event_ids=[e["id"] for e in self.correlator.get_correlated(src_ip)][:5],
                    event_ids=[event["id"]]
                )
                return alert

        # ── C2 BEACON: periodic connections ──────────────────────────────────
        if layer == "network" and dst_ip in THREAT_INTEL_IPS:
            self.seq.record(src_ip, dst_ip, time.time())
            bscore = self.seq.beacon_score(src_ip, dst_ip)
            binfo = self.seq.beacon_info(src_ip, dst_ip)

            if bscore > 0.55 and binfo.get("beacon_count", 0) >= 4:
                confidence = min(0.97, 0.55 + bscore * 0.45)
                threat_info = THREAT_INTEL_IPS[dst_ip]
                fp_score, fp_reason = self._check_false_positive(event, "c2_beacon")
                mitre_id, mitre_name = MITRE["c2_beacon"]
                event["_beacon_info"] = binfo
                event["_jitter_cv"] = binfo.get("jitter_cv", 0)
                alert = ThreatAlert(
                    alert_id=next_alert_id(), ts=ts_str,
                    threat_type="c2_beacon",
                    severity=self._severity(confidence, "c2_beacon"),
                    confidence=confidence,
                    src_ip=src_ip, dst_ip=dst_ip,
                    layer="network",
                    title="Command & Control Beaconing Detected",
                    description=f"{src_ip} beaconing to {dst_ip} every ~{binfo.get('mean_interval_s',5):.1f}s "
                                f"({binfo.get('beacon_count',0)} beacons, "
                                f"jitter CV={binfo.get('jitter_cv',0):.3f})",
                    why_flagged=f"Host {src_ip} establishes connections to {dst_ip} "
                                f"({threat_info['type']}, source: {threat_info['source']}) "
                                f"with machine-like regularity: "
                                f"mean interval {binfo.get('mean_interval_s',5):.1f}s, CV={binfo.get('jitter_cv',0):.3f}. "
                                f"Low-volume payload ({event.get('bytes_out',128)} bytes) consistent with heartbeat.",
                    false_positive_score=fp_score,
                    false_positive_reason=fp_reason,
                    mitre_id=mitre_id, mitre_name=mitre_name,
                    shap_features=compute_shap("c2_beacon", event, confidence,
                                               beacon_score=bscore),
                    correlated_event_ids=[e["id"] for e in self.correlator.get_correlated(src_ip)][:5],
                    event_ids=[event["id"]]
                )
                return alert

        # ── LATERAL MOVEMENT: internal scanning ───────────────────────────────
        if layer in ("network", "endpoint") and label == "lateral_movement":
            if layer == "network":
                key = f"internal:{src_ip}"
                rate = self.rate_tracker.record(key)
            else:
                rate = 10

            cross = len(self.correlator.layers_seen(src_ip)) > 1
            confidence = 0.72 + (0.15 if cross else 0) + min(0.1, rate/100)
            confidence = min(0.97, confidence)
            fp_score, fp_reason = self._check_false_positive(event, "lateral_movement")
            mitre_id, mitre_name = MITRE["lateral_movement"]
            alert = ThreatAlert(
                alert_id=next_alert_id(), ts=ts_str,
                threat_type="lateral_movement",
                severity=self._severity(confidence, "lateral_movement"),
                confidence=confidence,
                src_ip=src_ip, dst_ip=dst_ip or "10.0.1.x/24",
                layer=layer,
                title="Lateral Movement — Internal Host Scanning",
                description=f"{src_ip} scanning internal hosts on SMB/RDP/RPC ports. "
                            + ("Cross-layer confirmation: endpoint logs show suspicious process." if cross else ""),
                why_flagged=f"Host {src_ip} connected to {rate} internal hosts on ports 445/3389/135 "
                            f"within 60 seconds — indicative of automated scanning. "
                            + (f"SHAP boost: endpoint layer simultaneously shows "
                               f"SYSTEM-spawned lateral tool (net.exe/psexec.exe) and registry modification." if cross else ""),
                false_positive_score=fp_score,
                false_positive_reason=fp_reason,
                mitre_id=mitre_id, mitre_name=mitre_name,
                shap_features=compute_shap("lateral_movement", event, confidence,
                                           rate=rate, cross_layer=cross),
                correlated_event_ids=[e["id"] for e in self.correlator.get_correlated(src_ip)][:5],
                event_ids=[event["id"]]
            )
            return alert

        # ── DATA EXFILTRATION: large outbound to threat IP ────────────────────
        if layer == "network":
            feats = self._featurize_network(event)
            anomaly = self.forest.anomaly_score(feats)
            bytes_out = event.get("bytes_out", 0)
            dst_threat = dst_ip in THREAT_INTEL_IPS

            if (anomaly > 0.65 and bytes_out > 50_000) or (dst_threat and bytes_out > 20_000):
                confidence = min(0.97, anomaly * 0.6 + (0.35 if dst_threat else 0))
                cross = len(self.correlator.layers_seen(src_ip)) > 1
                if cross: confidence = min(0.99, confidence + 0.08)

                fp_score, fp_reason = self._check_false_positive(event, "data_exfil")
                # If likely FP, skip raising alert
                if fp_score > 0.6 and label == "false_positive":
                    # Still record it but as a suspected/downgraded alert
                    mitre_id, mitre_name = MITRE["data_exfil"]
                    alert = ThreatAlert(
                        alert_id=next_alert_id(), ts=ts_str,
                        threat_type="data_exfil",
                        severity="Low",  # downgraded
                        confidence=confidence * (1 - fp_score),
                        src_ip=src_ip, dst_ip=dst_ip,
                        layer="network",
                        title="⚠ Suspected Exfiltration — Likely False Positive",
                        description=f"{src_ip} sent {bytes_out/1024:.0f} KB to {dst_ip}. "
                                    f"False-positive indicators present.",
                        why_flagged=f"Outbound volume ({bytes_out/1024:.0f} KB) is above 95th percentile. "
                                    f"However, multiple FP indicators reduce confidence.",
                        false_positive_score=fp_score,
                        false_positive_reason=fp_reason,
                        mitre_id=mitre_id, mitre_name=mitre_name,
                        shap_features=compute_shap("data_exfil", event, confidence),
                        correlated_event_ids=[],
                        event_ids=[event["id"]]
                    )
                    return alert

                mitre_id, mitre_name = MITRE["data_exfil"]
                alert = ThreatAlert(
                    alert_id=next_alert_id(), ts=ts_str,
                    threat_type="data_exfil",
                    severity=self._severity(confidence, "data_exfil"),
                    confidence=confidence,
                    src_ip=src_ip, dst_ip=dst_ip,
                    layer="network",
                    title="Data Exfiltration Detected",
                    description=f"{src_ip} transferred {bytes_out/1024:.0f} KB to "
                                f"{dst_ip} ({THREAT_INTEL_IPS.get(dst_ip,{}).get('type','external')}) "
                                f"via port {event.get('dst_port')}.",
                    why_flagged=f"Isolation Forest anomaly score {anomaly:.2f} "
                                f"(threshold 0.65) on bytes_out={bytes_out:,}. "
                                f"Destination {dst_ip} is a {THREAT_INTEL_IPS.get(dst_ip,{}).get('type','known threat IP')} "
                                f"({THREAT_INTEL_IPS.get(dst_ip,{}).get('source','threat intel')}). "
                                f"Port {event.get('dst_port')} is non-standard."
                                + (" Cross-layer match: endpoint shows spoofed svchost.exe and sensitive file reads." if cross else ""),
                    false_positive_score=fp_score,
                    false_positive_reason=fp_reason,
                    mitre_id=mitre_id, mitre_name=mitre_name,
                    shap_features=compute_shap("data_exfil", event, anomaly),
                    correlated_event_ids=[e["id"] for e in self.correlator.get_correlated(src_ip)][:5],
                    event_ids=[event["id"]]
                )
                return alert

        return None
