---
description: 首次部署 staging 並完成基礎設置的方式 (含常見地雷排查)
---

參考以下文件

C:\Users\User\.gemini\antigravity\brain\0efb956e-f044-4f84-ba4d-1ba37d0ca4e4\staging_deployment_guide.md.resolved

請在設定 GitHub Actions 與 VM 伺服器端編譯時，務必對照以下「四大地雷排查清單」：

### ⚠️ 地雷 1：Windows CRLF 換行字元導致遠端 Bash 崩潰
* **現象**：Github Actions 執行到 `cd /opt/apps/fde-apps` 會失敗，並報出 `not a git repository` 或找不到 `docker-compose` 檔案。
* **原因**：在 Windows 建立的 `.yml` 腳本帶有 `\r` 換行，傳入 Ubuntu 容器執行時會變成 `cd /dir\r`，導致找不到目錄而停留在預設家目錄。
* **解法**：在 `appleboy/ssh-action` 內的多行 script 盡量改用單行 `&&` 連接（例如：`cd /dir && git fetch && docker-compose up`），或嚴格轉換 YML 檔為 LF (Unix) 換行格式。

### ⚠️ 地雷 2：PowerShell 變數解析破壞 Nginx 設定檔
* **現象**：透過 `gcloud compute ssh` 從本機拋送含 Nginx 配置的字串至主機時，`nginx -t` 語法檢查失敗（例如：`System.Management...` 未預期字串出現在設定檔中）。
* **原因**：PowerShell 的雙引號 `""` 或 `@""@` 會將 Nginx 的內部變數（如 `$host`, `$http_upgrade`）當成本地端變數展開。
* **解法**：從 Windows 拋送腳本至遠端時，務必使用 **Single-Quote Here-String (`@' ... '@`)**，或者先在本地轉成 Base64 再丟上雲端解碼(`base64 -d`)。

### ⚠️ 地雷 3：被 `.gitignore` 排除的機密 `.env` 導致重啟中斷
* **現象**：GitHub Action 執行 `docker-compose up -d --build` 時，馬上跳出 `Couldn't find env file: ordering/.env` 錯誤。
* **原因**：專案本身的 `.env` 並不會進版本控制，VM `git clone` 下來的程式碼天然沒有這些設定檔，Docker 無法掛載。
* **解法**：專案上線前，**必須手動 SSH 進入 VM 建立各個 `.env`** 甚至先放入 `touch .env` 假檔。若 `.env` 為空，Node/Vite 編譯仍能過，但執行時可能會缺少 API Token。

### ⚠️ 地雷 4：首次 `git fetch` 的 SSH Host Key 互動審查
* **現象**：GitHub Action 嘗試拉取私有庫時報錯 `Host key verification failed. fatal: Could not read from remote repository.`
* **原因**：若該 VM 過去從未連線過 GitHub，Git 背景作業會被卡在詢問 `Are you sure you want to continue connecting (yes/no)?` 上。
* **解法**：在腳本裡，首次指令強制加上金鑰信任：`GIT_SSH_COMMAND='ssh -o StrictHostKeyChecking=accept-new' git fetch origin main`。