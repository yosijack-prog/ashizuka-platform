# ============================================================
# Windowsタスクスケジューラ セットアップ
# 「管理者として実行」で一度だけ実行してください
# ============================================================

$TASK_NAME = "芦塚酒店 夜間データ更新"
$SCRIPT_PATH = "C:\Projects\ashizuka-platform\scripts\nightly-refresh.ps1"
$RUN_HOUR = 2   # 毎日 AM 2:00 に実行
$RUN_MIN  = 0

# 既存タスクがあれば削除
if (Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
    Write-Host "既存タスクを削除しました"
}

# トリガー: 毎日 AM 2:00
$trigger = New-ScheduledTaskTrigger -Daily -At "${RUN_HOUR}:${RUN_MIN}AM"

# アクション: PowerShell でスクリプト実行
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -NonInteractive -File `"$SCRIPT_PATH`""

# 設定: バックグラウンド実行・失敗時再試行
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 10) `
    -StartWhenAvailable

# タスク登録（現在のユーザーで実行）
Register-ScheduledTask `
    -TaskName $TASK_NAME `
    -Trigger $trigger `
    -Action $action `
    -Settings $settings `
    -RunLevel Highest `
    -Force

Write-Host ""
Write-Host "✅ タスクスケジューラ登録完了"
Write-Host "   タスク名: $TASK_NAME"
Write-Host "   実行時刻: 毎日 AM $RUN_HOUR`:$($RUN_MIN.ToString('00'))"
Write-Host "   スクリプト: $SCRIPT_PATH"
Write-Host ""
Write-Host "確認: タスクスケジューラ → タスクスケジューラライブラリ → 「$TASK_NAME」"
