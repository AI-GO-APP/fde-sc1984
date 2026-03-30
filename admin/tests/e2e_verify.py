import httpx
import json
from playwright.sync_api import sync_playwright

API_BASE = "https://ai-go.app/api/v1"
REFRESH_TOKEN = "vid5xfabw6pk"

def get_token() -> str:
    r = httpx.post(f"{API_BASE}/auth/refresh", json={"refresh_token": REFRESH_TOKEN}, timeout=15)
    if r.status_code == 200:
        return r.json().get("access_token", "")
    return ""

def test_admin_app():
    token = get_token()
    if not token:
        print("Failed to get token!")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # 進入首頁
        print("Navigating to http://localhost:5013/")
        page.goto("http://localhost:5013/")
        
        # 注入 token
        print("Injecting token to localStorage...")
        page.evaluate(f"localStorage.setItem('admin_token', '{token}')")
        
        # 重新載入以觸發 Auth Hooks
        page.reload()
        page.wait_for_load_state("networkidle")
        
        # 截圖確認 Dashboard 載入成功
        page.screenshot(path="dashboard_loaded.png", full_page=True)
        print("Screenshot saved to dashboard_loaded.png")
        
        # 檢驗是否成功顯示 Sales Orders 等
        content = page.content()
        if "Sales Orders" in content or "Products" in content or "Dashboard" in content:
            print("Dashboard data loaded successfully!")
        else:
            print("Dashboard might be empty or loading failed.")
            
        browser.close()

if __name__ == "__main__":
    test_admin_app()
