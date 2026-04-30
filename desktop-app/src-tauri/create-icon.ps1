Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(32, 32)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(0, 212, 255))
$g.Dispose()
$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = [System.IO.File]::Create("C:\Users\XaviXPC\Documents\Projects\universal-skills-hub\desktop-app\src-tauri\icons\icon.ico")
$icon.Save($fs)
$fs.Close()
$bmp.Dispose()
Write-Host "Icon created"