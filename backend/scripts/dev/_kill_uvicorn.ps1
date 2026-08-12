Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like '*uvicorn app.main:app*' } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    Write-Output ("killed uvicorn PID " + $_.ProcessId)
  }
