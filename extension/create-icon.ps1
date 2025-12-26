# Create a simple placeholder icon using PowerShell
Add-Type -AssemblyName System.Drawing

$size = 512
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Red background (AutoHotkey brand color)
$redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 50, 47))
$graphics.FillRectangle($redBrush, 0, 0, $size, $size)

# White "AHK" text
$font = New-Object System.Drawing.Font("Arial", 120, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$textFormat = New-Object System.Drawing.StringFormat
$textFormat.Alignment = [System.Drawing.StringAlignment]::Center
$textFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

$rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
$graphics.DrawString("AHK", $font, $whiteBrush, $rect, $textFormat)

# Add "v2" text
$smallFont = New-Object System.Drawing.Font("Arial", 60, [System.Drawing.FontStyle]::Regular)
$v2Rect = New-Object System.Drawing.RectangleF(0, 300, $size, $size)
$graphics.DrawString("v2", $smallFont, $whiteBrush, $v2Rect, $textFormat)

# Save
$iconPath = Join-Path $PSScriptRoot 'icon.png'
$bitmap.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$graphics.Dispose()
$bitmap.Dispose()
$redBrush.Dispose()
$whiteBrush.Dispose()

Write-Host "✓ Created $iconPath (512x512)" -ForegroundColor Green
