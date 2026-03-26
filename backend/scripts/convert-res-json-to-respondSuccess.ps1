<#
.SYNOPSIS
Converts res.json() calls to respondSuccess() in routes.ts files

.DESCRIPTION
This script processes all backend/src/modules/*/routes.ts files and:
- Adds import for respondSuccess if not present
- Replaces res.json() calls with respondSuccess(res, ...)
- Handles multi-line res.json calls
- Tracks and reports on all changes
#>

param(
    [string]$BasePath = "C:\Users\hp\KORA\backend\src\modules"
)

# Initialize tracking variables
$totalFilesProcessed = 0
$totalInstancesReplaced = 0
$filesWithChanges = @()
$filesStillWithResJson = @()
$fileSummary = @()

# Get all routes.ts files
$routesFiles = Get-ChildItem -Path "$BasePath/*/routes.ts" -Recurse

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Converting res.json() to respondSuccess()" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($file in $routesFiles) {
    $totalFilesProcessed++
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    # Check if file has any res.json calls
    if (-not ($content -match 'res\.json\s*\(')) {
        Write-Host "✓ Skipping: $($file.Name) - No res.json() calls found"
        continue
    }
    
    # Check if import already exists
    $hasImport = $content -match 'import\s+.*respondSuccess.*from\s+["\'].*response\.js["\']'
    
    if (-not $hasImport) {
        # Add import at the top (after other imports)
        $importStatement = 'import { respondSuccess } from "../../shared/response.js";' + "`n"
        
        # Find the last import statement
        if ($content -match '(import\s+.*from\s+["\'].*["\'];?\s*\n)+') {
            $lastImportEnd = ([regex]::Matches($content, '(import\s+.*from\s+["\'].*["\'];?\s*\n)') | Select-Object -Last 1).Index + ([regex]::Matches($content, '(import\s+.*from\s+["\'].*["\'];?\s*\n)') | Select-Object -Last 1).Length
            $content = $content.Insert($lastImportEnd, $importStatement)
        } else {
            # No imports found, add at the beginning
            $content = $importStatement + $content
        }
    }
    
    # Replace res.json() calls - handle multiple patterns
    # Pattern 1: res.json({...}) where ... might span multiple lines
    # Pattern 2: return res.json(...)
    
    $replacementCount = 0
    
    # First handle: return res.json(...) - replace with return respondSuccess(res, ...)
    $pattern1 = 'return\s+res\.json\s*\('
    if ($content -match $pattern1) {
        $content = [regex]::Replace($content, $pattern1, 'return respondSuccess(res, ')
        # Count matches
        $replacementCount += ([regex]::Matches($originalContent, $pattern1).Count)
    }
    
    # Handle: res.json(...) - replace with respondSuccess(res, ...)
    $pattern2 = 'res\.json\s*\('
    if ($content -match $pattern2) {
        $content = [regex]::Replace($content, $pattern2, 'respondSuccess(res, ')
        # Count matches that weren't already replaced by pattern1
        $count = ([regex]::Matches($originalContent, $pattern2).Count)
        $returnCount = ([regex]::Matches($originalContent, 'return\s+res\.json\s*\(').Count)
        $replacementCount += ($count - $returnCount)
    }
    
    # Check if there are still res.json calls
    if ($content -match 'res\.json\s*\(') {
        $remainingCount = ([regex]::Matches($content, 'res\.json\s*\(').Count)
        $filesStillWithResJson += @{
            Module = $file.Directory.Name
            File = $file.Name
            RemainingCount = $remainingCount
        }
    }
    
    # Write file if changes were made
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $totalInstancesReplaced += $replacementCount
        $filesWithChanges += $file.Directory.Name
        
        $fileSummary += @{
            Module = $file.Directory.Name
            File = $file.Name
            ReplacementsCount = $replacementCount
            ImportAdded = -not $hasImport
        }
        
        Write-Host "✓ Updated: $($file.Directory.Name) - $replacementCount replacement(s)" -ForegroundColor Green
    } else {
        Write-Host "✓ No changes needed: $($file.Directory.Name)" -ForegroundColor Gray
    }
}

# Output Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CONVERSION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Total files processed: $totalFilesProcessed" -ForegroundColor White
Write-Host "Total instances replaced: $totalInstancesReplaced" -ForegroundColor White
Write-Host "Total files with changes: $($filesWithChanges.Count)" -ForegroundColor White

if ($filesWithChanges.Count -gt 0) {
    Write-Host "`nFiles with changes:" -ForegroundColor Yellow
    $filesWithChanges | Sort-Object -Unique | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Yellow
    }
}

if ($filesStillWithResJson.Count -gt 0) {
    Write-Host "`n⚠ Modules with remaining res.json() calls:" -ForegroundColor Red
    $filesStillWithResJson | ForEach-Object {
        Write-Host "  - $($_.Module): $($_.RemainingCount) instance(s) in $($_.File)" -ForegroundColor Red
    }
} else {
    Write-Host "`n✓ All res.json() calls have been converted!" -ForegroundColor Green
}

if ($fileSummary.Count -gt 0) {
    Write-Host "`nDetailed changes:" -ForegroundColor Cyan
    $fileSummary | Format-Table -Property @(
        @{Label = "Module"; Expression = {$_.Module}},
        @{Label = "File"; Expression = {$_.File}},
        @{Label = "Replacements"; Expression = {$_.ReplacementsCount}},
        @{Label = "Import Added"; Expression = {$_.ImportAdded}}
    ) -AutoSize
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
