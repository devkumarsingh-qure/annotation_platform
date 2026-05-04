param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

if (!(Test-Path $Path)) {
    Write-Error "File not found: $Path"
    return
}

Get-Content $Path | ForEach-Object {
    $line = $_.Trim()

    # Skip empty lines and comments
    if (-not $line -or $line.StartsWith("#")) {
        return
    }

    # Match KEY=VALUE
    if ($line -match "^\s*([^=]+?)\s*=\s*(.*)\s*$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if (-not $key) { return }

        # Remove surrounding quotes if present
        if (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        # Set in current process (dynamic names are not valid as $env:Name syntax)
        Set-Item -Path "Env:$key" -Value $value
    }
}