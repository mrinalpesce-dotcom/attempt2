const API_BASE = '/api';

// ── Dashboard ──
export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// ── Alerts CRUD ──
export async function fetchAlerts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  const res = await fetch(`${API_BASE}/alerts?${params}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function createAlert(data) {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create alert');
  return res.json();
}

export async function updateAlert(id, data) {
  const res = await fetch(`${API_BASE}/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update alert');
  return res.json();
}

export async function deleteAlert(id) {
  const res = await fetch(`${API_BASE}/alerts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete alert');
  return res.json();
}

// ── Threats ──
export async function fetchThreats() {
  const res = await fetch(`${API_BASE}/threats`);
  if (!res.ok) throw new Error('Failed to fetch threats');
  return res.json();
}

export async function fetchTimeline() {
  const res = await fetch(`${API_BASE}/threats/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

// ── Simulations ──
export async function fetchSimulations() {
  const res = await fetch(`${API_BASE}/simulations`);
  if (!res.ok) throw new Error('Failed to fetch simulations');
  return res.json();
}

export async function createSimulation(data) {
  const res = await fetch(`${API_BASE}/simulations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create simulation');
  return res.json();
}

// ── MITRE ATT&CK ──
export async function fetchMitre() {
  const res = await fetch(`${API_BASE}/mitre`);
  if (!res.ok) throw new Error('Failed to fetch MITRE data');
  return res.json();
}

// ── Logs ──
export async function fetchLogs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.level) params.set('level', filters.level);
  if (filters.search) params.set('search', filters.search);
  if (filters.limit) params.set('limit', filters.limit);
  const res = await fetch(`${API_BASE}/logs?${params}`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function createLog(data) {
  const res = await fetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create log');
  return res.json();
}

// ── Reports ──
export async function fetchReportData() {
  const res = await fetch(`${API_BASE}/reports/data`);
  if (!res.ok) throw new Error('Failed to fetch report data');
  return res.json();
}

export async function fetchReportSummary() {
  const res = await fetch(`${API_BASE}/reports/summary`);
  if (!res.ok) throw new Error('Failed to fetch report summary');
  return res.json();
}

// ── System Metrics ──
export async function fetchSystemMetrics() {
  const res = await fetch(`${API_BASE}/system/metrics`);
  if (!res.ok) throw new Error('Failed to fetch system metrics');
  return res.json();
}

// ── Admin: Audit Logs ──
export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/admin/audit`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function createAuditLog(data) {
  const res = await fetch(`${API_BASE}/admin/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create audit log');
  return res.json();
}

// ── Admin: Blocked IPs ──
export async function fetchBlockedIPs() {
  const res = await fetch(`${API_BASE}/admin/blocked-ips`);
  if (!res.ok) throw new Error('Failed to fetch blocked IPs');
  return res.json();
}

export async function blockIP(data) {
  const res = await fetch(`${API_BASE}/admin/blocked-ips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to block IP');
  return res.json();
}

export async function unblockIP(ip) {
  const res = await fetch(`${API_BASE}/admin/blocked-ips/${ip}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unblock IP');
  return res.json();
}

// ── Playbooks ──
export async function fetchPlaybooks() {
  const res = await fetch(`${API_BASE}/playbooks`);
  if (!res.ok) throw new Error('Failed to fetch playbooks');
  return res.json();
}

export async function executePlaybook(data) {
  const res = await fetch(`${API_BASE}/playbooks/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to execute playbook');
  return res.json();
}

// ── Brute Force ──
export async function startBruteForce(data) {
  const res = await fetch(`${API_BASE}/bruteforce/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to start brute force');
  return res.json();
}

// ── Prevention Engine ──
export async function fetchPreventionOverview() {
  const res = await fetch(`${API_BASE}/prevention/overview`);
  if (!res.ok) throw new Error('Failed to fetch prevention overview');
  return res.json();
}

export async function fetchPreventionStrategies() {
  const res = await fetch(`${API_BASE}/prevention/strategies`);
  if (!res.ok) throw new Error('Failed to fetch strategies');
  return res.json();
}

export async function fetchPreventionStrategy(id) {
  const res = await fetch(`${API_BASE}/prevention/strategies/${id}`);
  if (!res.ok) throw new Error('Failed to fetch strategy');
  return res.json();
}

export async function fetchVulnerabilities() {
  const res = await fetch(`${API_BASE}/prevention/vulnerabilities`);
  if (!res.ok) throw new Error('Failed to fetch vulnerabilities');
  return res.json();
}

export async function triggerVulnScan() {
  const res = await fetch(`${API_BASE}/prevention/scan`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger scan');
  return res.json();
}

export async function remediateVulnerability(vulnId, action) {
  const res = await fetch(`${API_BASE}/prevention/remediate/${vulnId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to remediate');
  return res.json();
}

export async function fetchDlpStatus() {
  const res = await fetch(`${API_BASE}/prevention/dlp`);
  if (!res.ok) throw new Error('Failed to fetch DLP status');
  return res.json();
}

export async function checkDataExposure(content) {
  const res = await fetch(`${API_BASE}/prevention/check-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to check data');
  return res.json();
}

export async function fetchEncryptionStatus() {
  const res = await fetch(`${API_BASE}/prevention/encryption`);
  if (!res.ok) throw new Error('Failed to fetch encryption status');
  return res.json();
}

export async function fetchComplianceStatus() {
  const res = await fetch(`${API_BASE}/prevention/compliance`);
  if (!res.ok) throw new Error('Failed to fetch compliance');
  return res.json();
}

export async function fetchPreventionReport(type = 'full') {
  const res = await fetch(`${API_BASE}/prevention/report?type=${type}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

// ── Health ──
export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}
