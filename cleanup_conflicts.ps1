# cleanup_conflicts.ps1
Write-Host "Removing merge conflicts from all files..." -ForegroundColor Green

# File extensions to process
$fileExtensions = @("*.py", "*.js", "*.jsx", "*.ts", "*.tsx", "*.html", "*.css", "*.md", "*.txt", "*.json", "*.yml", "*.yaml", "*.java", "*.cpp", "*.c", "*.h", "*.php", "*.rb", "*.go", "*.rs")

foreach ($extension in $fileExtensions) {
    Get-ChildItem -Path . -Recurse -Filter $extension -File | ForEach-Object {
        $file = $_.FullName
        $content = Get-Content $file -Raw
        
        if ($content -match '<<<<<<< HEAD') {
            Write-Host "Cleaning: $file" -ForegroundColor Yellow
            
            # Remove conflict markers
            $content = $content -replace '<<<<<<< HEAD[^=]*=======[^>]*>>>>>>> [^\r\n]*', ''
            $content = $content -replace '<<<<<<< HEAD\r?\n', ''
            $content = $content -replace '=======\r?\n', ''
            $content = $content -replace '>>>>>>> [^\r\n]*\r?\n', ''
            
            # Remove multiple empty lines
            $content = $content -replace "(`r?`n){3,}", "`r`n`r`n"
            
            Set-Content -Path $file -Value $content
        }
    }
}

Write-Host "Cleanup completed!" -ForegroundColor Green