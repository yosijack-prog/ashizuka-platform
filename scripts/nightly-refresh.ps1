# ============================================================
# 夜間自動データ更新スクリプト
# SQL Server（スーパーリカー）から評価データを取得し
# APIキャッシュを更新する
#
# Windowsタスクスケジューラ設定:
#   実行時刻: 毎日 02:00
#   プログラム: powershell.exe
#   引数: -ExecutionPolicy Bypass -File "C:\Projects\ashizuka-platform\scripts\nightly-refresh.ps1"
# ============================================================

$LOG = "C:\Projects\ashizuka-platform\scripts\refresh.log"
$API = "http://localhost:3001"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-Log($msg) {
    $line = "[$TIMESTAMP] $msg"
    Write-Host $line
    Add-Content -Path $LOG -Value $line -Encoding UTF8
}

Write-Log "=== 夜間データ更新開始 ==="

# ── APIサーバーの起動確認 ──────────────────────────────
try {
    $health = Invoke-RestMethod -Uri "$API/health" -Method Get -TimeoutSec 5
    Write-Log "APIサーバー稼働中: $($health.service)"
} catch {
    Write-Log "❌ APIサーバーに接続できません。サーバーが起動しているか確認してください。"
    Write-Log "   エラー: $_"
    exit 1
}

# ── 評価データ更新（SQL Server → API キャッシュ）──────────
Write-Log "評価データ更新中 (SQL Server → キャッシュ)..."
try {
    $result = Invoke-RestMethod -Uri "$API/api/eval-data/refresh" -Method Post -TimeoutSec 60
    if ($result.success) {
        $count = $result.data.scores.Count
        $fetchedAt = $result.data.fetchedAt
        Write-Log "✅ 評価データ更新完了: ${count}名分 @ $fetchedAt"

        # スコアサマリーをログに出力
        foreach ($s in $result.data.scores) {
            Write-Log "   $($s.name): 売上$([math]::Round($s.salesQ1/10000))万 粗利$($s.grossMarginRate)% 維持$($s.retentionRate)% 新規$($s.newCustomers)社"
        }
    } else {
        Write-Log "❌ 評価データ更新失敗: $($result.error)"
    }
} catch {
    Write-Log "❌ 評価データ更新エラー: $_"
}

Write-Log "=== 夜間データ更新完了 ==="
Write-Log ""
