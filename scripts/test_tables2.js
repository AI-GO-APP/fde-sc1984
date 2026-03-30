import fs from 'fs';

const API_BASE = "https://ai-go.app/api/v1"
const REFRESH_TOKEN = "vid5xfabw6pk"

async function run() {
  console.log("Getting token...")
  let token;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: REFRESH_TOKEN }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      console.error("Token fetch failed", res.status);
      return;
    }
    const data = await res.json();
    token = data.access_token;
    console.log("Got token:", token.substring(0, 20) + "...");
  } catch (e) {
    console.error("Error fetching token:", e);
    return;
  }

  console.log("Fetching available tables...");
  try {
    const tablesRes = await fetch(`${API_BASE}/refs/available-tables`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!tablesRes.ok) {
      console.error("Failed to fetch tables", tablesRes.status, await tablesRes.text());
      return;
    }
    
    const tables = await tablesRes.json();
    console.log("Found tables:", tables.length);
  } catch (e) {
    console.error("Error fetching tables:", e);
  }
}

run().catch(e => console.error("Top level error:", e));
