const API_BASE = 'http://localhost:5000/api';

export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

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

export async function fetchMitre() {
  const res = await fetch(`${API_BASE}/mitre`);
  if (!res.ok) throw new Error('Failed to fetch MITRE data');
  return res.json();
}

export async function fetchLogs() {
  const res = await fetch(`${API_BASE}/logs`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}
