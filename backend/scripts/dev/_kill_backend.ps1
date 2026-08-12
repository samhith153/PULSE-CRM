$c = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($c) {
    $p = Get-Process -Id $c.OwningProcess
    Stop-Process -Id $p.Id -Force
    Write-Output ("killed " + $p.Id + " on 8000")
} else {
    Write-Output "no listener on 8000"
}
