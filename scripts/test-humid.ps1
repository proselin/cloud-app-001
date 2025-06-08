# Test Runner Script for Humid Project (PowerShell)
# Usage: .\scripts\test-humid.ps1 [options]

param(
    [switch]$Watch,
    [switch]$NoCoverage,
    [switch]$Verbose,
    [switch]$Help
)

$PROJECT_NAME = "humid"
$COVERAGE_DIR = "coverage/apps/$PROJECT_NAME"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Show help if requested
if ($Help) {
    Write-Host "Test Runner for Humid Project" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\test-humid.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Watch         Run tests in watch mode"
    Write-Host "  -NoCoverage    Skip coverage report generation"
    Write-Host "  -Verbose       Enable verbose output"
    Write-Host "  -Help          Show this help message"
    exit 0
}

Write-Status "Starting test suite for $PROJECT_NAME project..."

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Status "Installing dependencies..."
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Lint check
Write-Status "Running lint check..."
npx nx lint $PROJECT_NAME --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Error "Lint check failed"
    exit 1
} else {
    Write-Success "Lint check passed"
}

# Prepare test command
$TestCmd = "npx nx test $PROJECT_NAME"

if ($Watch) {
    $TestCmd += " --watch"
    Write-Status "Running tests in watch mode..."
} elseif (-not $NoCoverage) {
    $TestCmd += " --configuration=ci"
    Write-Status "Running tests with coverage..."
} else {
    $TestCmd += " --watch=false"
    Write-Status "Running tests..."
}

if ($Verbose) {
    $TestCmd += " --verbose"
}

# Run tests
Invoke-Expression $TestCmd
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tests failed!"
    exit 1
} else {
    Write-Success "All tests passed!"
}

# Show coverage summary if available
if (-not $NoCoverage -and (Test-Path "$COVERAGE_DIR/coverage-summary.json")) {
    Write-Status "Test Coverage Summary:"
    Write-Host ""

    # Read and parse coverage data
    $coverageJson = Get-Content "$COVERAGE_DIR/coverage-summary.json" | ConvertFrom-Json
    $total = $coverageJson.total

    Write-Host "📊 Coverage Report:" -ForegroundColor Cyan
    Write-Host "  Lines:      $($total.lines.pct)% ($($total.lines.covered)/$($total.lines.total))"
    Write-Host "  Statements: $($total.statements.pct)% ($($total.statements.covered)/$($total.statements.total))"
    Write-Host "  Functions:  $($total.functions.pct)% ($($total.functions.covered)/$($total.functions.total))"
    Write-Host "  Branches:   $($total.branches.pct)% ($($total.branches.covered)/$($total.branches.total))"
    Write-Host ""
    Write-Host "📁 Full report: .\$COVERAGE_DIR\lcov-report\index.html" -ForegroundColor Gray

    # Check coverage threshold
    $linesPct = [double]$total.lines.pct
    if ($linesPct -ge 80) {
        Write-Success "Coverage threshold met ($linesPct% >= 80%)"
    } else {
        Write-Warning "Coverage below threshold ($linesPct% < 80%)"
    }
}

Write-Success "Test suite completed successfully! 🎉"
