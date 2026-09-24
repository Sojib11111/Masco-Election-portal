$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = 8080
$DataFile = Join-Path $Root 'data\election.json'
$Utf8 = [Text.UTF8Encoding]::new($false)
$Ascii = [Text.Encoding]::ASCII
$Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$Listener.Start()
Write-Host "MASCO Election Server: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Admin: http://localhost:$Port/admin.html" -ForegroundColor Green
Write-Host "JSON updates are saved permanently to: $DataFile" -ForegroundColor Yellow
Start-Process "http://localhost:$Port/admin.html"

function Get-Mime([string]$Path) {
  switch ([IO.Path]::GetExtension($Path).ToLower()) {
    '.html' { 'text/html; charset=utf-8' }
    '.js'   { 'application/javascript; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.png'  { 'image/png' }
    '.jpg'  { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.gif'  { 'image/gif' }
    '.svg'  { 'image/svg+xml' }
    default { 'application/octet-stream' }
  }
}

function Send-Response($Stream, [int]$Status, [byte[]]$Body, [string]$Type='text/plain; charset=utf-8') {
  $statusText = @{200='OK';400='Bad Request';403='Forbidden';404='Not Found';405='Method Not Allowed';500='Internal Server Error'}[$Status]
  if (-not $statusText) { $statusText = 'OK' }
  $header = "HTTP/1.1 $Status $statusText`r`nContent-Type: $Type`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $hb = $Ascii.GetBytes($header)
  $Stream.Write($hb,0,$hb.Length)
  if ($Body.Length -gt 0) { $Stream.Write($Body,0,$Body.Length) }
  $Stream.Flush()
}

function Read-HttpRequest($Stream) {
  $all = New-Object System.Collections.Generic.List[byte]
  $buffer = New-Object byte[] 8192
  $headerEnd = -1
  while ($headerEnd -lt 0) {
    $n = $Stream.Read($buffer,0,$buffer.Length)
    if ($n -le 0) { break }
    for($i=0;$i -lt $n;$i++){ $all.Add($buffer[$i]) }
    for($i=[Math]::Max(0,$all.Count-$n-4);$i -le $all.Count-4;$i++){
      if($all[$i]-eq 13 -and $all[$i+1]-eq 10 -and $all[$i+2]-eq 13 -and $all[$i+3]-eq 10){$headerEnd=$i+4;break}
    }
    if($all.Count -gt 65536 -and $headerEnd -lt 0){throw 'HTTP header too large'}
  }
  if($headerEnd -lt 0){throw 'Invalid HTTP request'}
  $headerBytes=$all.GetRange(0,$headerEnd).ToArray()
  $headerText=$Ascii.GetString($headerBytes)
  $lines=$headerText -split "`r`n"
  $requestParts=$lines[0].Split(' ')
  $headers=@{}
  for($i=1;$i -lt $lines.Length;$i++){
    $line=$lines[$i];$idx=$line.IndexOf(':');if($idx -gt 0){$headers[$line.Substring(0,$idx).Trim().ToLower()]=$line.Substring($idx+1).Trim()}
  }
  $contentLength=0;if($headers.ContainsKey('content-length')){$contentLength=[int]$headers['content-length']}
  $already=$all.Count-$headerEnd
  while($already -lt $contentLength){
    $n=$Stream.Read($buffer,0,[Math]::Min($buffer.Length,$contentLength-$already));if($n -le 0){break}
    for($i=0;$i -lt $n;$i++){$all.Add($buffer[$i])};$already+=$n
  }
  $body=New-Object byte[] $contentLength
  for($i=0;$i -lt $contentLength;$i++){$body[$i]=$all[$headerEnd+$i]}
  return @{Method=$requestParts[0];Url=$requestParts[1];Headers=$headers;Body=$body}
}

while ($true) {
  $Client = $Listener.AcceptTcpClient()
  try {
    $Stream = $Client.GetStream()
    $req = Read-HttpRequest $Stream
    $method = $req.Method
    $url = $req.Url
    $pathOnly = ($url -split '\?')[0]

    if ($pathOnly -eq '/api/data') {
      if ($method -eq 'GET') {
        Send-Response $Stream 200 ([IO.File]::ReadAllBytes($DataFile)) 'application/json; charset=utf-8'
      } elseif ($method -eq 'POST') {
        try {
          $bodyText = $Utf8.GetString($req.Body)
          $obj = $bodyText | ConvertFrom-Json
          if ($null -eq $obj.branches -or $null -eq $obj.units -or $null -eq $obj.candidates) { throw 'Invalid election JSON structure' }
          $json = $obj | ConvertTo-Json -Depth 100
          $tmp = "$DataFile.tmp"
          [IO.File]::WriteAllText($tmp,$json,$Utf8)
          Move-Item -Force $tmp $DataFile
          Send-Response $Stream 200 ($Utf8.GetBytes('{"ok":true}')) 'application/json; charset=utf-8'
        } catch {
          Send-Response $Stream 400 ($Utf8.GetBytes("JSON save failed: $($_.Exception.Message)"))
        }
      } else { Send-Response $Stream 405 ($Utf8.GetBytes('Method not allowed')) }
      $Client.Close(); continue
    }

    if ($pathOnly -eq '/') { $pathOnly = '/index.html' }
    $relative = [Uri]::UnescapeDataString($pathOnly.TrimStart('/')).Replace('/','\')
    $full = [IO.Path]::GetFullPath((Join-Path $Root $relative))
    $rootFull = [IO.Path]::GetFullPath($Root)
    if (-not $full.StartsWith($rootFull,[StringComparison]::OrdinalIgnoreCase)) {
      Send-Response $Stream 403 ($Utf8.GetBytes('Forbidden'))
    } elseif (Test-Path -LiteralPath $full -PathType Leaf) {
      Send-Response $Stream 200 ([IO.File]::ReadAllBytes($full)) (Get-Mime $full)
    } else { Send-Response $Stream 404 ($Utf8.GetBytes('Not found')) }
  } catch {
    try { Send-Response $Stream 500 ($Utf8.GetBytes($_.Exception.Message)) } catch {}
  } finally { $Client.Close() }
}
