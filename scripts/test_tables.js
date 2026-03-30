const API_BASE = "https://ai-go.app/api/v1"
const REFRESH_TOKEN = "vid5xfabw6pk"

async function run() {
  console.log("Getting token...")
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: REFRESH_TOKEN }),
  })
  
  if (!res.ok) {
    console.error("Token fetch failed", res.status, await res.text())
    return
  }
  
  const data = await res.json()
  const token = data.access_token
  console.log("Got token:", token.substring(0, 20) + "...")

  console.log("Fetching available tables...")
  const tablesRes = await fetch(`${API_BASE}/refs/available-tables`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  if (!tablesRes.ok) {
    console.error("Failed to fetch tables", tablesRes.status, await tablesRes.text())
    return
  }
  
  const tables = await tablesRes.json()
  console.log("Found tables:", tables.length)
}

run().catch(console.error)
