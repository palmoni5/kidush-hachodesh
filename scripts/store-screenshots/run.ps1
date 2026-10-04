# צילומי מסך לחנות מתוך אוצריא אמיתית. נקרא מ-.github/workflows/screenshots.yml
# אחרי שאוצריא חולצה ל-$AppDir ועותק נקי של התוסף הונח ב-$PluginDir.
#  1. העדפות ראשוניות (בלי סיור מודרך וחלון קידום) — seed_prefs.dart
#  2. הפעלה ראשונה, שתיצור את מסד התוספים, וסגירה
#  3. רישום התוסף כתוסף בפיתוח במסד — install_dev_plugin.py
#  4. הפעלה שנייה עם remote debugging ל-WebView2, ופתיחת טאב התוסף בקישור
#     otzaria://open/plugin/<id>, שנכתב ישירות לתור ההפעלות שהמופע הרץ מאזין
#     לו. הפעלת otzaria.exe נוספת עם הקישור אינה מגיעה בגרסה הניידת: המופע
#     השני (windows/runner/main.cpp, EnqueueUri) כותב תמיד ל-%APPDATA%\otzaria,
#     ואילו הגרסה הניידת מאזינה לתור שבשורש הנתונים שלה
#  5. מעבר על טאבי התוסף וצילום החלון בכל אחד — capture.mjs
param(
  [Parameter(Mandatory)] [string] $AppDir,
  [Parameter(Mandatory)] [string] $PluginDir,
  [Parameter(Mandatory)] [string] $OutDir
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$exe = Join-Path $AppDir 'otzaria.exe'
$pluginId = (Get-Content (Join-Path $PluginDir 'manifest.json') -Raw | ConvertFrom-Json).id
# עם portable.marker ליד ה-exe (כך ב-otzaria-windows.zip) הנתונים נשמרים ליד
# התוכנה; אחרת ב-%APPDATA%\otzaria (lib/core/app_paths.dart)
$dataRoot = if (Test-Path (Join-Path $AppDir 'portable.marker')) { Join-Path $AppDir 'otzaria_data' }
            else { Join-Path $env:APPDATA 'otzaria' }
Write-Host "שורש הנתונים: $dataRoot"

function Stop-Otzaria {
  foreach ($p in Get-Process otzaria -ErrorAction SilentlyContinue) { [void]$p.CloseMainWindow() }
  Start-Sleep 8
  Get-Process otzaria -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep 2
  # שתי הפעלות שהסתיימו תוך 20 שניות מפעילות "מצב בטוח" שבו תוספים לא רצים
  # (startup_crash_counter.dart) — מאפסים את המונה בכל מקרה
  Get-ChildItem $dataRoot -Recurse -Filter startup_attempts.txt -ErrorAction SilentlyContinue | Remove-Item -Force
}

function Wait-MainWindow([int] $Seconds = 90) {
  for ($t = 0; $t -lt $Seconds; $t += 2) {
    if (Get-Process otzaria -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }) { return }
    Start-Sleep 2
  }
  throw "חלון אוצריא לא הופיע תוך $Seconds שניות"
}

# כמו EnqueueUri ב-windows/runner/main.cpp: שורת JSONL שהמופע הרץ מנקז
# (lib/core/external_activation_queue.dart)
function Open-Plugin {
  $line = @{ uri = "otzaria://open/plugin/$pluginId"; createdAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') } |
    ConvertTo-Json -Compress
  [IO.File]::AppendAllText((Join-Path $dataRoot 'pending_external_activations.jsonl'), "$line`n", [Text.UTF8Encoding]::new($false))
}

# 1
Push-Location $here
dart pub get
if ($LASTEXITCODE) { throw "dart pub get נכשל" }
dart run seed_prefs.dart $dataRoot
if ($LASTEXITCODE) { throw 'כתיבת ההעדפות נכשלה' }
Pop-Location

# 2
Write-Host '— הפעלה ראשונה'
Start-Process $exe -WorkingDirectory $AppDir | Out-Null
Wait-MainWindow
$db = $null
for ($t = 0; $t -lt 60 -and -not $db; $t += 2) {
  Start-Sleep 2
  $db = Get-ChildItem $dataRoot -Recurse -Filter plugins_host.db -ErrorAction SilentlyContinue | Select-Object -First 1
}
if (-not $db) { throw "plugins_host.db לא נוצר תחת $dataRoot" }
Start-Sleep 25   # מעבר לסף ה-20 שניות של מונה הקריסות, ושהמיגרציות יסתיימו
Stop-Otzaria

# 3
python (Join-Path $here 'install_dev_plugin.py') $db.FullName $PluginDir
if ($LASTEXITCODE) { throw 'רישום התוסף נכשל' }

# 4
Write-Host '— הפעלה שנייה'
# פורט 0: הדפדפן בוחר פורט פנוי ורושם אותו ב-DevToolsActivePort (capture.mjs)
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '--remote-debugging-port=0'
Start-Process $exe -WorkingDirectory $AppDir | Out-Null
Wait-MainWindow
& (Join-Path $here 'capture-window.ps1') -Out x -NoCapture   # מסך מלא לפני שהתוכן נפרש
Start-Sleep 20   # טעינת התוספים מסתיימת לפני שהקישור מגיע

# 5 — עד שלושה ניסיונות: קישור שהגיע לפני שהתוספים נטענו פותח טאב ריק או הודעת "לא זמין"
for ($try = 1; ; $try++) {
  Open-Plugin
  node (Join-Path $here 'capture.mjs') $OutDir (Join-Path $dataRoot 'webview2')
  if ($LASTEXITCODE -eq 0) { break }
  if ($try -ge 3) {
    Get-CimInstance Win32_Process -Filter "name='msedgewebview2.exe'" |
      Where-Object CommandLine -notmatch '--type=' | ForEach-Object { Write-Host "WebView2: $($_.CommandLine)" }
    Get-ChildItem (Join-Path $dataRoot 'webview2') -Recurse -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $($_.FullName)" }
    & (Join-Path $here 'capture-window.ps1') -Out (Join-Path $OutDir '..\debug-failed.png')
    throw 'דף התוסף לא נמצא אחרי שלושה ניסיונות'
  }
  Start-Sleep 10
}
Stop-Otzaria
