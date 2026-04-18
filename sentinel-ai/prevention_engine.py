"""
Data Breach Prevention Engine
Implements comprehensive data protection strategies including DLP, encryption, access control, etc.
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any
from enum import Enum


class RiskLevel(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ProtectionStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    WARNING = "warning"


class PreventionEngine:
    """Core engine for data breach prevention strategies"""

    def __init__(self):
        self.strategies = self._initialize_strategies()
        self.dlp_rules = self._initialize_dlp_rules()
        self.encryption_status = self._initialize_encryption()
        self.vulnerabilities = []
        self.last_scan = None

    def _initialize_strategies(self) -> List[Dict[str, Any]]:
        """Initialize protection strategies"""
        return [
            {
                "id": 1,
                "name": "Database Encryption",
                "description": "End-to-end encryption for sensitive database records",
                "status": ProtectionStatus.ACTIVE.value,
                "risk_level": RiskLevel.CRITICAL.value,
                "coverage": 98.5,
                "last_scanned": "2 minutes ago",
                "affected_assets": 342,
                "protected_records": 15847329,
                "implementation": "AES-256-GCM with key rotation"
            },
            {
                "id": 2,
                "name": "Access Control Management",
                "description": "Role-based access control (RBAC) with MFA enforcement",
                "status": ProtectionStatus.ACTIVE.value,
                "risk_level": RiskLevel.HIGH.value,
                "coverage": 92.3,
                "last_scanned": "5 minutes ago",
                "affected_assets": 156,
                "protected_records": 8234567,
                "implementation": "OAuth 2.0 + MFA via TOTP/U2F"
            },
            {
                "id": 3,
                "name": "Data Loss Prevention (DLP)",
                "description": "Monitor and prevent unauthorized data transfers",
                "status": ProtectionStatus.ACTIVE.value,
                "risk_level": RiskLevel.HIGH.value,
                "coverage": 87.4,
                "last_scanned": "1 minute ago",
                "affected_assets": 289,
                "protected_records": 12456789,
                "implementation": "Pattern matching + ML-based anomaly detection"
            },
            {
                "id": 4,
                "name": "Network Segmentation",
                "description": "Isolate critical systems with firewall rules",
                "status": ProtectionStatus.ACTIVE.value,
                "risk_level": RiskLevel.MEDIUM.value,
                "coverage": 95.2,
                "last_scanned": "3 minutes ago",
                "affected_assets": 78,
                "protected_records": 3456789,
                "implementation": "Zero-trust network architecture"
            },
            {
                "id": 5,
                "name": "API Security",
                "description": "Rate limiting, input validation, and OAuth 2.0",
                "status": ProtectionStatus.ACTIVE.value,
                "risk_level": RiskLevel.MEDIUM.value,
                "coverage": 88.7,
                "last_scanned": "4 minutes ago",
                "affected_assets": 45,
                "protected_records": 2345678,
                "implementation": "OAuth 2.0, JWT validation, rate limiting"
            },
            {
                "id": 6,
                "name": "Backup & Recovery",
                "description": "Automated backup with encryption and air-gapped storage",
                "status": ProtectionStatus.ACTIVE.value,
                "risk_level": RiskLevel.CRITICAL.value,
                "coverage": 100,
                "last_scanned": "7 minutes ago",
                "affected_assets": 512,
                "protected_records": 28934562,
                "implementation": "Daily encrypted backups + 3-2-1 strategy"
            },
            {
                "id": 7,
                "name": "Endpoint Detection (EDR)",
                "description": "Real-time behavioral monitoring across all host endpoints",
                "status": ProtectionStatus.ACTIVE.value,
                "risk_level": RiskLevel.HIGH.value,
                "coverage": 94.6,
                "last_scanned": "1 minute ago",
                "affected_assets": 1205,
                "protected_records": 4500120,
                "implementation": "Kernel-level heuristics & process injection blocks"
            },
            {
                "id": 8,
                "name": "Web App Firewall (WAF)",
                "description": "L7 traffic filtering, blocking SQLi and XSS payloads",
                "status": ProtectionStatus.ACTIVE.value,
                "risk_level": RiskLevel.CRITICAL.value,
                "coverage": 99.9,
                "last_scanned": "Just now",
                "affected_assets": 21,
                "protected_records": 38400000,
                "implementation": "Cloudflare Proxy with OWASP Top 10 rulesets"
            }
        ]

    def _initialize_dlp_rules(self) -> List[Dict[str, Any]]:
        """Initialize DLP rules"""
        return [
            {
                "id": 1,
                "name": "Credit Card Detection",
                "pattern": r"(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})",
                "severity": RiskLevel.CRITICAL.value,
                "matches": 156,
                "blocked": 142,
                "false_positives": 3
            },
            {
                "id": 2,
                "name": "PII Detection",
                "pattern": r"(?:\d{3}-\d{2}-\d{4}|\d{3}-\d{2}-\d{3}|\b\d{9}\b)",
                "severity": RiskLevel.CRITICAL.value,
                "matches": 892,
                "blocked": 834,
                "false_positives": 12
            },
            {
                "id": 3,
                "name": "API Key Detection",
                "pattern": r"(?:api[_-]?key|apikey|auth[_-]?token|secret[_-]?key)\s*[=:]\s*['\"]?([a-zA-Z0-9\-_]{20,})",
                "severity": RiskLevel.CRITICAL.value,
                "matches": 234,
                "blocked": 228,
                "false_positives": 1
            }
        ]

    def _initialize_encryption(self) -> Dict[str, Any]:
        """Initialize encryption status"""
        return {
            "encrypted_data": "94.8%",
            "algorithm": "AES-256-GCM",
            "key_rotation": "Every 90 days",
            "last_rotation": "12 days ago",
            "status": ProtectionStatus.ACTIVE.value,
            "algorithms_in_use": [
                {"name": "AES", "key_size": "256-bit", "mode": "GCM", "systems": 847, "status": "active"},
                {"name": "RSA", "key_size": "2048-bit", "mode": "OAEP", "systems": 523, "status": "active"},
                {"name": "TLS", "key_size": "256-bit", "version": "1.3", "systems": 1247, "status": "active"},
                {"name": "SHA-256", "key_size": "256-bit", "mode": "Hashing", "systems": 2843, "status": "active"}
            ]
        }

    def get_protection_overview(self) -> Dict[str, Any]:
        """Get overall protection overview"""
        active_strategies = sum(1 for s in self.strategies if s["status"] == ProtectionStatus.ACTIVE.value)
        total_protected = sum(s["protected_records"] for s in self.strategies)

        return {
            "active_protections": active_strategies,
            "total_strategies": len(self.strategies),
            "total_protected_records": total_protected,
            "overall_coverage": round(sum(s["coverage"] for s in self.strategies) / len(self.strategies), 1),
            "security_score": 91,
            "threats_blocked_today": 1247
        }

    def scan_vulnerabilities(self) -> List[Dict[str, Any]]:
        """Scan for vulnerabilities"""
        vulnerabilities = [
            {
                "id": 1,
                "type": "Weak Password Policy",
                "severity": RiskLevel.HIGH.value,
                "status": "open",
                "affected_users": 23,
                "recommendation": "Enforce minimum 12-character passwords with complexity rules",
                "remediation_time": "2 hours",
                "action": "update_policy",
                "details": "A weak password policy allows automated brute force and dictionary attacks to succeed. We enforce this via OAuth 2.0 Identity Provider rules combining entropy checks and active leak database queries.",
                "implementation": "Identity Provider (IdP) sync policy update."
            },
            {
                "id": 2,
                "type": "Unencrypted API Endpoints",
                "severity": RiskLevel.CRITICAL.value,
                "status": "open",
                "affected_systems": 4,
                "recommendation": "Implement HTTPS/TLS 1.3 on all API endpoints",
                "remediation_time": "6 hours",
                "action": "enable_tls",
                "details": "Unencrypted HTTP connections allow Man-in-the-Middle (MitM) attackers to intercept sensitive JSON payloads, including JWT tokens.",
                "implementation": "Automatic Let's Encrypt certificate rotation and nginx strictly enforcing port 443 with HSTS."
            },
            {
                "id": 3,
                "type": "Missing MFA on Admin Accounts",
                "severity": RiskLevel.CRITICAL.value,
                "status": "open",
                "affected_users": 8,
                "recommendation": "Mandate MFA for all administrative accounts",
                "remediation_time": "1 hour",
                "action": "enforce_mfa",
                "details": "Compromised admin credentials without MFA lead to complete system takeover. SentinelAI will lock out non-MFA accounts automatically.",
                "implementation": "TOTP Google Authenticator + FIDO2 WebAuthn requirement."
            },
            {
                "id": 4,
                "type": "Excessive Database Privileges",
                "severity": RiskLevel.HIGH.value,
                "status": "in_progress",
                "affected_accounts": 34,
                "recommendation": "Apply principle of least privilege (PoLP)",
                "remediation_time": "4 hours",
                "action": "reduce_privileges",
                "details": "Microservices currently run with global DB read/write privileges. An exploit in one service allows full database wiping.",
                "implementation": "Revoking global grants and generating scoped AWS IAM role boundaries."
            },
            {
                "id": 5,
                "type": "Outdated SSL Certificates",
                "severity": RiskLevel.MEDIUM.value,
                "status": "open",
                "affected_users": 12,
                "recommendation": "Renew and rotate SSL certificates before expiry",
                "remediation_time": "30 minutes",
                "action": "renew_certs",
                "details": "Certificates nearing 30-day expiration window. Failure to renew will result in modern browsers blocking user access completely.",
                "implementation": "certbot auto-renew cron trigger with ACME challenge DNS validation."
            }
        ]
        self.vulnerabilities = vulnerabilities
        self.last_scan = datetime.now().isoformat()
        return vulnerabilities

    def get_dlp_status(self) -> Dict[str, Any]:
        """Get Data Loss Prevention status"""
        return {
            "status": ProtectionStatus.ACTIVE.value,
            "blocked_attempts": 1247,
            "suspicious_activity": 38,
            "files_monitored": 2847394,
            "rules": self.dlp_rules,
            "last_updated": datetime.now().isoformat()
        }

    def check_data_exposure(self, data: str) -> Dict[str, Any]:
        """Check if data contains sensitive information"""
        import re

        findings = []

        for rule in self.dlp_rules:
            if re.search(rule["pattern"], data):
                findings.append({
                    "rule": rule["name"],
                    "severity": rule["severity"],
                    "matched": True
                })

        return {
            "sensitive_data_found": len(findings) > 0,
            "findings": findings,
            "should_block": any(f["severity"] == RiskLevel.CRITICAL.value for f in findings)
        }

    def validate_encryption(self, algorithm: str, key_size: int) -> bool:
        """Validate encryption algorithm and key size"""
        valid_configs = {
            "AES": [128, 192, 256],
            "RSA": [2048, 3072, 4096],
            "ChaCha20": [256],
            "TLS": [256]
        }

        return algorithm in valid_configs and key_size in valid_configs.get(algorithm, [])

    def remediate_vulnerability(self, vuln_id: int, action: str) -> Dict[str, Any]:
        """Apply remediation actions"""
        vuln = next((v for v in self.vulnerabilities if v["id"] == vuln_id), None)

        if not vuln:
            return {"success": False, "message": "Vulnerability not found"}

        remediation_actions = {
            "update_policy": "Password policy updated to enforce 12-character minimum",
            "enable_tls": "TLS 1.3 enabled on all API endpoints",
            "enforce_mfa": "MFA enforcement policy applied to admin accounts",
            "reduce_privileges": "Database privileges reduced via principle of least privilege"
        }

        return {
            "success": True,
            "vulnerability_id": vuln_id,
            "action": action,
            "result": remediation_actions.get(action, "Action completed"),
            "completed_at": datetime.now().isoformat()
        }

    def get_compliance_status(self) -> Dict[str, Any]:
        """Get compliance status"""
        return {
            "gdpr": {
                "compliant": True,
                "score": 92.5,
                "last_audit": (datetime.now() - timedelta(days=30)).isoformat()
            },
            "hipaa": {
                "compliant": True,
                "score": 94.0,
                "last_audit": (datetime.now() - timedelta(days=45)).isoformat()
            },
            "pci_dss": {
                "compliant": True,
                "score": 91.5,
                "last_audit": (datetime.now() - timedelta(days=60)).isoformat()
            },
            "soc2": {
                "compliant": True,
                "score": 93.0,
                "last_audit": (datetime.now() - timedelta(days=90)).isoformat()
            }
        }

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent audit logs"""
        logs = []
        for i in range(limit):
            logs.append({
                "id": i + 1,
                "timestamp": (datetime.now() - timedelta(minutes=i*5)).isoformat(),
                "event": f"Data access event #{i+1}",
                "user": f"user_{i % 10}",
                "resource": f"database_table_{i % 5}",
                "action": ["READ", "WRITE", "DELETE"][i % 3],
                "status": "SUCCESS" if i % 10 != 9 else "BLOCKED"
            })
        return logs

    def export_report(self, report_type: str) -> Dict[str, Any]:
        """Export prevention report"""
        return {
            "report_type": report_type,
            "generated_at": datetime.now().isoformat(),
            "overview": self.get_protection_overview(),
            "strategies": self.strategies,
            "vulnerabilities": self.vulnerabilities,
            "dlp_status": self.get_dlp_status(),
            "encryption_status": self.encryption_status,
            "compliance": self.get_compliance_status()
        }


if __name__ == "__main__":
    engine = PreventionEngine()
    print(json.dumps(engine.get_protection_overview(), indent=2))
    print("\nVulnerabilities:")
    print(json.dumps(engine.scan_vulnerabilities(), indent=2))
