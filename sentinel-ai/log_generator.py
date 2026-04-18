"""
SentinelAI — Realistic log generator
Produces network + endpoint events with injected attack scenarios.
"""
import random
import time
import json
import math
from datetime import datetime, timezone
from typing import Generator

# ─── Internal IP ranges ───────────────────────────────────────────────────────
INTERNAL_IPS = [f"10.0.{r}.{h}" for r in range(1, 5) for h in range(10, 30)]
EXTERNAL_IPS = [
    "185.220.101.42",  # TOR exit node (threat-intel hit)
    "45.142.212.100",  # known C2 IP
    "91.108.4.0",      # known malicious
    "8.8.8.8",         # Google DNS (benign)
    "142.250.80.46",   # Google (benign)
    "13.107.42.14",    # Microsoft (benign)
    "54.239.28.85",    # AWS (benign)
    "104.21.45.7",     # Cloudflare (benign)
]
THREAT_IPS = EXTERNAL_IPS[:3]
BENIGN_IPS  = EXTERNAL_IPS[3:]

PROCESSES = ["chrome.exe","explorer.exe","svchost.exe","python.exe",
             "cmd.exe","powershell.exe","outlook.exe","teams.exe"]
MALICIOUS_PROCESSES = ["mimikatz.exe","nc.exe","nmap.exe","psexec.exe"]
USERS = ["alice","bob","carol","dave","svc_backup","admin","guest"]
ENDPOINTS = ["/api/login","/api/data","/api/users","/health",
             "/api/admin","/api/export","/api/upload"]
METHODS = ["GET","POST","PUT","DELETE"]

_seq = 0
def _next_id():
    global _seq; _seq += 1; return f"evt_{_seq:06d}"

def _ts():
    return datetime.now(timezone.utc).isoformat()

# ─── Benign traffic generators ────────────────────────────────────────────────
def benign_network_event() -> dict:
    src = random.choice(INTERNAL_IPS)
    dst = random.choice(BENIGN_IPS + INTERNAL_IPS)
    return {
        "id": _next_id(), "ts": _ts(), "layer": "network",
        "src_ip": src, "dst_ip": dst,
        "src_port": random.randint(49152, 65535),
        "dst_port": random.choice([80, 443, 53, 8080]),
        "protocol": random.choice(["TCP","UDP"]),
        "bytes_out": random.randint(100, 5_000),
        "bytes_in": random.randint(500, 50_000),
        "duration_ms": random.randint(50, 2000),
        "flags": random.choice(["SYN","ACK","PSH","FIN"]),
        "label": "benign"
    }

def benign_endpoint_event() -> dict:
    return {
        "id": _next_id(), "ts": _ts(), "layer": "endpoint",
        "host": random.choice(INTERNAL_IPS),
        "process": random.choice(PROCESSES),
        "parent_pid": random.randint(1000, 9999),
        "pid": random.randint(1000, 9999),
        "user": random.choice(USERS),
        "file_access": random.choice([
            "C:\\Users\\alice\\Documents\\report.docx",
            "C:\\Windows\\System32\\ntdll.dll",
            None
        ]),
        "registry_change": None,
        "network_connection": random.choice(BENIGN_IPS + [None, None]),
        "label": "benign"
    }

def benign_http_event() -> dict:
    return {
        "id": _next_id(), "ts": _ts(), "layer": "http",
        "src_ip": random.choice(INTERNAL_IPS),
        "method": random.choices(METHODS, weights=[5,2,1,1])[0],
        "endpoint": random.choice(ENDPOINTS),
        "status_code": random.choices([200,201,400,404,500], weights=[70,10,8,8,4])[0],
        "payload_bytes": random.randint(50, 2000),
        "user_agent": random.choice([
            "Mozilla/5.0 (Windows NT 10.0) Chrome/120",
            "python-requests/2.31",
            "curl/7.81.0"
        ]),
        "label": "benign"
    }

class BruteForceAttack:
    """Scenario: credential stuffing from distributed IPs."""
    def __init__(self):
        self.attacker_ips = [f"192.168.{r}.{h}" for r in (10,11,12) for h in range(1,5)]
        self.attempt = 0

    def next_event(self) -> dict:
        self.attempt += 1
        success = self.attempt > 480  # eventually succeeds
        return {
            "id": _next_id(), "ts": _ts(), "layer": "http",
            "src_ip": random.choice(self.attacker_ips),
            "method": "POST",
            "endpoint": "/api/login",
            "status_code": 200 if success else 401,
            "payload_bytes": random.randint(40, 80),
            "user_agent": "python-requests/2.28",
            "label": "brute_force",
            "_meta": {
                "attempt": self.attempt,
                "distributed": True,
                "target_user": "admin"
            }
        }


class C2BeaconAttack:
    """Scenario: infected host beaconing to C2 at regular intervals."""
    def __init__(self):
        self.infected_host = "10.0.2.17"
        self.c2_ip = "45.142.212.100"
        self.interval_s = 5  # demo speed (real = 300s)
        self.last_beacon = 0
        self.beacon_count = 0

    def should_fire(self) -> bool:
        now = time.time()
        jitter = random.uniform(-0.2, 0.2)
        if now - self.last_beacon >= self.interval_s + jitter:
            self.last_beacon = now
            return True
        return False

    def next_event(self) -> dict:
        self.beacon_count += 1
        return {
            "id": _next_id(), "ts": _ts(), "layer": "network",
            "src_ip": self.infected_host,
            "dst_ip": self.c2_ip,
            "src_port": random.randint(49152, 65535),
            "dst_port": 443,
            "protocol": "TCP",
            "bytes_out": random.randint(64, 256),    # small, low-volume
            "bytes_in": random.randint(64, 256),
            "duration_ms": random.randint(80, 200),
            "flags": "ACK",
            "label": "c2_beacon",
            "_meta": {
                "beacon_count": self.beacon_count,
                "interval_s": self.interval_s,
                "infected_host": self.infected_host
            }
        }


class LateralMovementAttack:
    """Scenario: post-compromise host scanning internal subnet."""
    def __init__(self):
        self.pivot_host = "10.0.1.15"
        self.targets = [f"10.0.1.{h}" for h in range(10, 25)]
        self.scan_idx = 0

    def next_event(self) -> list:
        events = []
        # Network scan burst
        for _ in range(random.randint(3, 6)):
            if self.scan_idx >= len(self.targets):
                self.scan_idx = 0
            target = self.targets[self.scan_idx]
            self.scan_idx += 1
            events.append({
                "id": _next_id(), "ts": _ts(), "layer": "network",
                "src_ip": self.pivot_host,
                "dst_ip": target,
                "src_port": random.randint(49152, 65535),
                "dst_port": random.choice([445, 135, 139, 3389]),  # SMB, RPC, RDP
                "protocol": "TCP",
                "bytes_out": random.randint(40, 120),
                "bytes_in": random.randint(0, 80),
                "duration_ms": random.randint(10, 50),
                "flags": "SYN",
                "label": "lateral_movement",
                "_meta": {"pivot": self.pivot_host, "scan": True}
            })
        # Endpoint: suspicious process on pivot host
        events.append({
            "id": _next_id(), "ts": _ts(), "layer": "endpoint",
            "host": self.pivot_host,
            "process": random.choice(["nmap.exe","net.exe","psexec.exe"]),
            "parent_pid": 4,  # SYSTEM
            "pid": random.randint(1000, 9999),
            "user": "SYSTEM",
            "file_access": "C:\\Windows\\System32\\net.exe",
            "registry_change": "HKLM\\System\\CurrentControlSet\\Services",
            "network_connection": random.choice(self.targets),
            "label": "lateral_movement",
            "_meta": {"pivot": self.pivot_host}
        })
        return events


class DataExfilAttack:
    """Scenario: large outbound transfer to TOR exit node."""
    def __init__(self):
        self.exfil_host = "10.0.1.47"
        self.dst = "185.220.101.42"  # TOR exit node
        self.chunk = 0

    def next_event(self) -> list:
        self.chunk += 1
        events = []
        # Network: large outbound chunk
        events.append({
            "id": _next_id(), "ts": _ts(), "layer": "network",
            "src_ip": self.exfil_host,
            "dst_ip": self.dst,
            "src_port": random.randint(49152, 65535),
            "dst_port": 4444,            # non-standard port (red flag)
            "protocol": "TCP",
            "bytes_out": random.randint(400_000, 900_000),  # 400–900 KB per chunk
            "bytes_in": random.randint(100, 500),
            "duration_ms": random.randint(800, 3000),
            "flags": "PSH",
            "label": "data_exfil",
            "_meta": {
                "chunk": self.chunk,
                "dst_country": "RU",
                "threat_intel_hit": True
            }
        })
        # Endpoint: spoofed svchost reading sensitive files
        events.append({
            "id": _next_id(), "ts": _ts(), "layer": "endpoint",
            "host": self.exfil_host,
            "process": "svchost.exe",    # spoofed
            "parent_pid": 4,             # suspicious parent
            "pid": random.randint(3000, 5000),
            "user": "NT AUTHORITY\\SYSTEM",
            "file_access": random.choice([
                "C:\\Users\\dave\\Documents\\contracts.zip",
                "C:\\shares\\finance\\q3_report.xlsx",
                "C:\\ProgramData\\secrets.db"
            ]),
            "registry_change": "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            "network_connection": self.dst,
            "label": "data_exfil",
            "_meta": {"spoofed_process": True, "threat_intel_hit": True}
        })
        return events


class FalsePositiveScenario:
    """Scenario: IT admin doing legit bulk backup (looks like exfil)."""
    def __init__(self):
        self.admin_host = "10.0.3.5"
        self.dst = "54.239.28.85"  # AWS S3 (benign)
        self.chunk = 0

    def next_event(self) -> dict:
        self.chunk += 1
        return {
            "id": _next_id(), "ts": _ts(), "layer": "network",
            "src_ip": self.admin_host,
            "dst_ip": self.dst,
            "src_port": random.randint(49152, 65535),
            "dst_port": 443,
            "protocol": "TCP",
            "bytes_out": random.randint(200_000, 600_000),
            "bytes_in": random.randint(1000, 5000),
            "duration_ms": random.randint(1000, 4000),
            "flags": "PSH",
            "label": "false_positive",  # will be detected as suspected exfil initially
            "_meta": {
                "known_user": "svc_backup",
                "dst_country": "US",
                "threat_intel_hit": False,
                "whitelisted_dst": True,
                "scheduled_job": True
            }
        }

class LogGenerator:
    def __init__(self, events_per_second: float = 20.0):
        self.eps = events_per_second
        self.brute = BruteForceAttack()
        self.c2 = C2BeaconAttack()
        self.lateral = LateralMovementAttack()
        self.exfil = DataExfilAttack()
        self.fp = FalsePositiveScenario()
        self._attack_schedule = self._build_schedule()

    def _build_schedule(self):
        """Returns a dict of {scenario: next_fire_time}"""
        now = time.time()
        return {
            "brute":   now + 2,      # starts quickly
            "c2":      now + 0,      # immediate (interval-controlled)
            "lateral": now + 8,      # lateral movement
            "exfil":   now + 15,     # data exfiltration
            "fp":      now + 20,     # false positive
        }

    def generate(self) -> Generator[list, None, None]:
        """Yields batches of events continuously."""
        delay = 1.0 / self.eps
        while True:
            batch = []
            now = time.time()

            # Always include benign traffic
            layer_fn = random.choice([benign_network_event,
                                       benign_endpoint_event,
                                       benign_http_event])
            batch.append(layer_fn())

            # Attack injections based on schedule
            if now >= self._attack_schedule["brute"]:
                batch.append(self.brute.next_event())
                self._attack_schedule["brute"] = now + random.uniform(0.05, 0.15)

            if self.c2.should_fire():
                batch.append(self.c2.next_event())

            if now >= self._attack_schedule["lateral"] and random.random() < 0.3:
                batch.extend(self.lateral.next_event())
                self._attack_schedule["lateral"] = now + random.uniform(1, 3)

            if now >= self._attack_schedule["exfil"] and random.random() < 0.2:
                batch.extend(self.exfil.next_event())
                self._attack_schedule["exfil"] = now + random.uniform(2, 5)

            if now >= self._attack_schedule["fp"] and random.random() < 0.15:
                batch.append(self.fp.next_event())
                self._attack_schedule["fp"] = now + random.uniform(3, 7)

            yield batch
            time.sleep(delay)


if __name__ == "__main__":
    gen = LogGenerator(events_per_second=5)
    for batch in gen.generate():
        for evt in batch:
            print(json.dumps(evt))
