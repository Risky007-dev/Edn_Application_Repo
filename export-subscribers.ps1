# PowerShell script to automate subscribers.json export to Excel
# Run this daily to backup subscribers

param(
    [string]$JsonFile = "$PSScriptRoot\subscribers.json",
    [string]$OutputDir = "$PSScriptRoot\exports",
    [string]$PythonScript = "$PSScriptRoot\export-subscribers.py"
)

Write-Host "🍿 Popcorn Maths - Subscribers Auto-Export" -ForegroundColor Cyan
Write-Host "=" * 50

# Create exports directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "✅ Created exports directory: $OutputDir" -ForegroundColor Green
}

# Check if Python script exists
if (-not (Test-Path $PythonScript)) {
    Write-Host "❌ Python script not found: $PythonScript" -ForegroundColor Red
    exit 1
}

# Check if subscribers.json exists
if (-not (Test-Path $JsonFile)) {
    Write-Host "⚠️  subscribers.json not found. No subscribers to export yet." -ForegroundColor Yellow
    exit 0
}

# Run Python export script
Write-Host "📊 Exporting subscribers..." -ForegroundColor Blue
python $PythonScript

# Move exported file to exports directory
$LatestExport = Get-ChildItem -Path $PSScriptRoot -Filter "subscribers_*.xlsx" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

if ($LatestExport) {
    $NewPath = Join-Path $OutputDir $LatestExport.Name
    Move-Item -Path $LatestExport.FullName -Destination $NewPath -Force
    Write-Host "📁 Moved to: $NewPath" -ForegroundColor Green
    Write-Host "✅ Export complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Export failed - no file generated" -ForegroundColor Red
}
