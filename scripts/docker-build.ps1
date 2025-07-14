# PowerShell script to build and run Docker containers
param(
    [switch]$Build,
    [switch]$Up,
    [switch]$Down,
    [switch]$Dev
)

function Write-Status {
    param([string]$Message)
    Write-Host "🐳 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

if ($Build -or (-not $Up -and -not $Down)) {
    Write-Status "Building Cloud App containers..."

    Write-Status "Building humid (NestJS backend)..."
    docker build -f apps/humid/Dockerfile -t cloud-humid:latest .

    Write-Status "Building cloud (Angular frontend)..."
    docker build -f apps/cloud/Dockerfile -t cloud-frontend:latest .

    Write-Success "All images built successfully!"
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found. Copying from .env.example..."
    Copy-Item ".env.example" ".env"
    Write-Warning "Please edit .env file with your configuration before running docker-compose"
}

if ($Up) {
    Write-Status "Starting containers..."
    if ($Dev) {
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    } else {
        docker-compose up -d
    }
    Write-Success "Containers started!"
    Write-Host "🌐 Frontend: http://localhost" -ForegroundColor Blue
    Write-Host "🔧 Backend API: http://localhost:3000/api" -ForegroundColor Blue
}

if ($Down) {
    Write-Status "Stopping containers..."
    docker-compose down
    Write-Success "Containers stopped!"
}

if (-not $Build -and -not $Up -and -not $Down) {
    Write-Host @"
🐳 Cloud App Docker Management

Usage:
  .\scripts\docker-build.ps1 -Build        # Build images only
  .\scripts\docker-build.ps1 -Up           # Start containers
  .\scripts\docker-build.ps1 -Down         # Stop containers
  .\scripts\docker-build.ps1 -Build -Up    # Build and start
  .\scripts\docker-build.ps1 -Up -Dev      # Start in development mode

Manual commands:
  docker-compose up -d                     # Start in production mode
  docker-compose down                      # Stop containers
  docker-compose logs -f humid             # View backend logs
  docker-compose logs -f cloud             # View frontend logs
"@ -ForegroundColor White
}
