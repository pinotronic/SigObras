[CmdletBinding()]
param(
	[switch]$SkipInstall,
	[switch]$NewWindows,
	[switch]$InsecureNpm,
	[switch]$AllowInsecureTls,
	[string]$CorporateCertPath,
	[switch]$FreePorts,
	[switch]$StrictTls,
	[ValidateSet('mock', 'external')][string]$AuthMode = 'external'
)

$ErrorActionPreference = 'Stop'

# En este repo se trabaja como entorno de desarrollo por defecto.
if (-not $env:NODE_ENV) {
	$env:NODE_ENV = 'development'
}

function Clear-TlsEnv {
	# Evita que variables queden "pegadas" en la sesión actual de PowerShell entre ejecuciones.
	$vars = @(
		'AUTH_ALLOW_INSECURE_TLS',
		'MAPS_ALLOW_INSECURE_TLS',
		'NODE_TLS_REJECT_UNAUTHORIZED',
		'NODE_EXTRA_CA_CERTS',
		'NPM_CONFIG_CAFILE',
		'NPM_CONFIG_STRICT_SSL'
	)
	foreach ($v in $vars) {
		if (Test-Path "Env:$v") { Remove-Item "Env:$v" -ErrorAction SilentlyContinue }
	}
}

if ($StrictTls) {
	Write-Host "[INFO] StrictTls activado: se limpiarán variables de TLS inseguro y se usará validación estricta." -ForegroundColor Cyan
	Clear-TlsEnv
	$env:NPM_CONFIG_STRICT_SSL = 'true'
}

if ($InsecureNpm) {
	Write-Host "[WARN] InsecureNpm activado: se desactiva la validación estricta de SSL para npm durante esta ejecución." -ForegroundColor Yellow
	Write-Host "       Úsalo solo si estás detrás de proxy/certificado corporativo y npm falla por certificado." -ForegroundColor Yellow
	$env:NPM_CONFIG_STRICT_SSL = 'false'
	# Algunos escenarios también requieren esto para procesos Node (no afecta al navegador).
	$env:NODE_TLS_REJECT_UNAUTHORIZED = '0'
}


# Launcher de desarrollo: si no se provee CA corporativa, por defecto se permite TLS no confiable
# para evitar bloqueos con certificados corporativos (a menos que se pida StrictTls).
if (-not $CorporateCertPath -and -not $AllowInsecureTls -and -not $StrictTls) {
	$AllowInsecureTls = $true
}

if ($AllowInsecureTls) {
	Write-Host "[WARN] AllowInsecureTls activado: Node permitirá TLS no confiable (solo desarrollo)." -ForegroundColor Yellow
	Write-Host "       Se define AUTH_ALLOW_INSECURE_TLS=true y NODE_TLS_REJECT_UNAUTHORIZED=0 para esta ejecución." -ForegroundColor Yellow
	$env:AUTH_ALLOW_INSECURE_TLS = 'true'
	# MapServer también puede estar detrás de TLS corporativo.
	$env:MAPS_ALLOW_INSECURE_TLS = 'true'
	$env:NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

if ($CorporateCertPath) {
	$resolvedCertPath = Resolve-Path -Path $CorporateCertPath -ErrorAction Stop
	if (-not (Test-Path $resolvedCertPath)) {
		throw "CorporateCertPath no existe: $CorporateCertPath"
	}

	# Certificado corporativo para Node (requests HTTPS, fetch, axios, etc.)
	$env:NODE_EXTRA_CA_CERTS = $resolvedCertPath.Path
	# Para npm también suele ayudar (si el problema aparece durante npm install)
	$env:NPM_CONFIG_CAFILE = $resolvedCertPath.Path
	$env:NPM_CONFIG_STRICT_SSL = 'true'

	Write-Host "[OK] Certificado corporativo configurado" -ForegroundColor DarkGreen
	Write-Host "     NODE_EXTRA_CA_CERTS=$($env:NODE_EXTRA_CA_CERTS)" -ForegroundColor DarkGray
}

if ($AuthMode -eq 'mock') {
	# Evita depender de wsautenticador (TLS/cert corporativo / 504) en desarrollo.
	$env:AUTH_MODE = 'mock'
	$env:AUTH_FALLBACK_TO_MOCK = 'true'
	Write-Host "[INFO] AUTH_MODE=mock (dev)" -ForegroundColor Cyan
} else {
	$env:AUTH_MODE = 'external'
	# Requisito: usar token real para MapServer -> no caer a mock silenciosamente.
	$env:AUTH_FALLBACK_TO_MOCK = 'false'
	Write-Host "[INFO] AUTH_MODE=external" -ForegroundColor Cyan
}

function Assert-CommandExists {
	param(
		[Parameter(Mandatory = $true)][string]$Name,
		[Parameter(Mandatory = $true)][string]$Hint
	)

	if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
		throw "No se encontró '$Name'. $Hint"
	}
}

function Ensure-NpmDeps {
	param(
		[Parameter(Mandatory = $true)][string]$ProjectPath
	)

	$nodeModules = Join-Path $ProjectPath 'node_modules'
	if (Test-Path $nodeModules) {
		Write-Host "[OK] Dependencias ya instaladas: $ProjectPath" -ForegroundColor DarkGreen
		return
	}

	Write-Host "[INFO] Instalando dependencias en: $ProjectPath" -ForegroundColor Cyan
	Push-Location $ProjectPath
	try {
		# Usar npm install (el repo no garantiza package-lock consistente para npm ci)
		try {
			npm install
		}
		catch {
			$msg = $_.Exception.Message
			if ($msg -match 'SELF_SIGNED_CERT_IN_CHAIN|unable to get local issuer certificate|CERTIFICATE|certificate|SSL') {
				throw "Fallo npm por certificado/SSL en '$ProjectPath'. Reintenta con: pwsh -ExecutionPolicy Bypass -File .\EJECUTAR_APP.ps1 -InsecureNpm"
			}
			throw
		}
	}
	finally {
		Pop-Location
	}
}

function Start-NpmDev {
	param(
		[Parameter(Mandatory = $true)][string]$ProjectPath,
		[Parameter(Mandatory = $true)][string]$Label,
		[switch]$NewWindow
	)

	# En algunos Windows, `npm` resuelve a un shim .ps1 y Start-Process no puede ejecutarlo como Win32.
	# Usar cmd.exe evita ese problema y funciona tanto en consola externa como en terminal integrada.
	$cmdArgs = if ($NewWindow) {
		@('/k', 'npm run dev')
	} else {
		@('/c', 'npm run dev')
	}

	Write-Host "[INFO] ${Label}: npm run dev" -ForegroundColor Cyan
	return Start-Process -FilePath 'cmd.exe' -ArgumentList $cmdArgs -WorkingDirectory $ProjectPath -PassThru -NoNewWindow:(-not $NewWindow)
}

function Stop-ProcessOnPort {
	param(
		[Parameter(Mandatory = $true)][int]$Port
	)

	try {
		$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
	} catch {
		# En algunos entornos Get-NetTCPConnection puede no estar disponible.
		return
	}

	foreach ($conn in $connections) {
		$owningPid = $conn.OwningProcess
		if (-not $owningPid) { continue }

		try {
			$proc = Get-Process -Id $owningPid -ErrorAction Stop
			Write-Host "[INFO] Liberando puerto ${Port}: deteniendo PID $owningPid ($($proc.ProcessName))" -ForegroundColor Yellow
			Stop-Process -Id $owningPid -Force -ErrorAction Stop
		} catch {
			Write-Host "[WARN] No se pudo detener el proceso en puerto ${Port} (PID $owningPid)." -ForegroundColor Yellow
		}
	}
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root 'backend-mock'
$frontendPath = Join-Path $root 'sigsapal-mobile'

if (-not (Test-Path $backendPath)) {
	throw "No existe la carpeta backend: $backendPath"
}
if (-not (Test-Path $frontendPath)) {
	throw "No existe la carpeta frontend: $frontendPath"
}

Assert-CommandExists -Name 'node' -Hint 'Instala Node.js 18+ (LTS) y reinicia la terminal.'
Assert-CommandExists -Name 'npm' -Hint 'Asegúrate de que npm esté disponible (viene con Node.js).'

Write-Host "\n=== SAPAL Obras Móvil - Ejecutar app completa ===" -ForegroundColor White
Write-Host "Root: $root" -ForegroundColor DarkGray

if ($FreePorts) {
	Write-Host "[INFO] FreePorts activado: intentando liberar puertos 3000 y 3001..." -ForegroundColor Cyan
	Stop-ProcessOnPort -Port 3000
	Stop-ProcessOnPort -Port 3001
}

if (-not $SkipInstall) {
	Ensure-NpmDeps -ProjectPath $backendPath
	Ensure-NpmDeps -ProjectPath $frontendPath

	# Crear .env desde .env.example si aplica
	$envExample = Join-Path $frontendPath '.env.example'
	$envFile = Join-Path $frontendPath '.env'
	if (-not (Test-Path $envFile) -and (Test-Path $envExample)) {
		Copy-Item -Path $envExample -Destination $envFile
		Write-Host "[OK] Creado .env desde .env.example en sigsapal-mobile" -ForegroundColor DarkGreen
	}
}
else {
	Write-Host "[INFO] SkipInstall activado: no se instalarán dependencias." -ForegroundColor Yellow
}

Write-Host "\n[INFO] Iniciando Backend (http://localhost:3001) y Frontend (http://localhost:3000)..." -ForegroundColor Cyan

$backendProc = Start-NpmDev -ProjectPath $backendPath -Label 'Backend' -NewWindow:$NewWindows
$frontendProc = Start-NpmDev -ProjectPath $frontendPath -Label 'Frontend' -NewWindow:$NewWindows

Write-Host "\n[OK] Procesos lanzados" -ForegroundColor DarkGreen
Write-Host "- Backend PID:  $($backendProc.Id)" -ForegroundColor DarkGray
Write-Host "- Frontend PID: $($frontendProc.Id)" -ForegroundColor DarkGray
Write-Host "\nURLs:" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend:  http://localhost:3001/health" -ForegroundColor White

Write-Host "\nPara detener:" -ForegroundColor White
Write-Host "- Cierra las terminales, o ejecuta:" -ForegroundColor DarkGray
Write-Host "  Stop-Process -Id $($backendProc.Id), $($frontendProc.Id)" -ForegroundColor DarkGray
