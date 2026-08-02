$ErrorActionPreference = "Stop"

# Copia diaria de RoomFlow. El archivo resultante se guarda en OneDrive para que
# también esté protegido si este ordenador falla.
$origen = Split-Path -Parent $PSScriptRoot
$oneDrive = $env:OneDrive
$baseCopias = if ($oneDrive -and (Test-Path -LiteralPath $oneDrive)) {
  Join-Path $oneDrive "RoomFlow - Copias de seguridad"
} else {
  Join-Path ([Environment]::GetFolderPath("MyDocuments")) "RoomFlow - Copias de seguridad"
}

$temporal = Join-Path ([System.IO.Path]::GetTempPath()) ("roomflow-copia-" + [guid]::NewGuid().ToString())
$fecha = Get-Date -Format "yyyy-MM-dd_HH-mm"
$destino = Join-Path $baseCopias "RoomFlow_$fecha.zip"
$copiaDelDia = "RoomFlow_" + (Get-Date -Format "yyyy-MM-dd") + "_*.zip"

try {
  New-Item -ItemType Directory -Force -Path $baseCopias | Out-Null

  # Si ya se hizo la copia de hoy, por ejemplo a las 03:15, no se duplica al
  # iniciar sesión más tarde.
  if (Get-ChildItem -LiteralPath $baseCopias -Filter $copiaDelDia -File | Select-Object -First 1) { exit 0 }
  New-Item -ItemType Directory -Force -Path $temporal | Out-Null

  # Incluye código, configuraciones, SQL y documentos de trabajo; omite archivos
  # generados que se pueden volver a crear y ocupan mucho espacio.
  robocopy $origen $temporal /E /XD node_modules .next .git .tmp-contratos | Out-Null
  if ($LASTEXITCODE -gt 7) { throw "No se pudieron copiar los archivos de RoomFlow." }

  $contenido = Get-ChildItem -LiteralPath $temporal -Force
  if (!$contenido) { throw "No se encontró contenido para copiar." }
  Compress-Archive -LiteralPath $contenido.FullName -DestinationPath $destino -CompressionLevel Optimal

  # Conserva las últimas 90 copias diarias.
  Get-ChildItem -LiteralPath $baseCopias -Filter "RoomFlow_*.zip" -File |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-90) } |
    Remove-Item -Force

  "$(Get-Date -Format s) Copia creada: $destino" | Add-Content -LiteralPath (Join-Path $baseCopias "historial-copias.txt")
} finally {
  if (Test-Path -LiteralPath $temporal) { Remove-Item -LiteralPath $temporal -Recurse -Force }
}
