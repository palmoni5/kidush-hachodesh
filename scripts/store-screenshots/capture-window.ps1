# צילום חלון אוצריא הראשי לקובץ PNG: מביא אותו לחזית, מגדיל למסך מלא,
# ומצלם את גבולותיו הנראים (בלי הצל שמסביב) כפי שהם על המסך — כולל תוכן
# ה-WebView2 של התוסף, שאינו נקלט בצילום חלון רגיל (PrintWindow).
param(
  [Parameter(Mandatory)] [string] $Out,
  [switch] $NoCapture   # רק הבאה לחזית והגדלה
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class Win {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr h);
  [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int attr, out RECT r, int size);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
}
'@
[void][Win]::SetProcessDPIAware()

$proc = Get-Process otzaria -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if (-not $proc) { throw 'חלון אוצריא לא נמצא' }
$h = $proc.MainWindowHandle

if (-not [Win]::IsZoomed($h)) { [void][Win]::ShowWindow($h, 3); Start-Sleep -Milliseconds 800 }  # SW_MAXIMIZE
[void][Win]::SetForegroundWindow($h)
Start-Sleep -Milliseconds 300
if ($NoCapture) { return }

$r = New-Object Win+RECT
[void][Win]::DwmGetWindowAttribute($h, 9, [ref]$r, 16)   # DWMWA_EXTENDED_FRAME_BOUNDS
# חלון מוגדל גולש מעט מעבר לשולי המסך — חותכים לגבולות המסך
$s = [System.Windows.Forms.Screen]::FromHandle($h).Bounds
$x = [Math]::Max($r.Left, $s.Left); $y = [Math]::Max($r.Top, $s.Top)
$w = [Math]::Min($r.Right, $s.Right) - $x; $hgt = [Math]::Min($r.Bottom, $s.Bottom) - $y

# הסמן למרכז פס הכותרת הריק — שלא ייצא בצילום ריחוף על כפתור או תצוגה מקדימה של שורת המשימות
[void][Win]::SetCursorPos($x + [int]($w / 2), $y + 20)
Start-Sleep -Milliseconds 300

$bmp = New-Object System.Drawing.Bitmap $w, $hgt
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
$g.Dispose()
New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "✓ $Out (${w}x$hgt)"
