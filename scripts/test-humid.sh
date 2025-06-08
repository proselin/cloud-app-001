#!/usr/bin/env bash

# Test Runner Script for Humid Project
# Usage: ./scripts/test-humid.sh [options]

set -e

PROJECT_NAME="humid"
COVERAGE_DIR="coverage/apps/${PROJECT_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
WATCH_MODE=false
COVERAGE=true
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --no-coverage)
            COVERAGE=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Test Runner for Humid Project"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --watch         Run tests in watch mode"
            echo "  --no-coverage   Skip coverage report generation"
            echo "  --verbose       Enable verbose output"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Starting test suite for ${PROJECT_NAME} project..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm ci
fi

# Lint check
print_status "Running lint check..."
if npx nx lint ${PROJECT_NAME} --quiet; then
    print_success "Lint check passed"
else
    print_error "Lint check failed"
    exit 1
fi

# Prepare test command
TEST_CMD="npx nx test ${PROJECT_NAME}"

if [ "$WATCH_MODE" = true ]; then
    TEST_CMD="${TEST_CMD} --watch"
    print_status "Running tests in watch mode..."
elif [ "$COVERAGE" = true ]; then
    TEST_CMD="${TEST_CMD} --configuration=ci"
    print_status "Running tests with coverage..."
else
    TEST_CMD="${TEST_CMD} --watch=false"
    print_status "Running tests..."
fi

if [ "$VERBOSE" = true ]; then
    TEST_CMD="${TEST_CMD} --verbose"
fi

# Run tests
if eval $TEST_CMD; then
    print_success "All tests passed!"

    # Show coverage summary if available
    if [ "$COVERAGE" = true ] && [ -f "${COVERAGE_DIR}/coverage-summary.json" ]; then
        print_status "Test Coverage Summary:"
        echo ""

        # Extract coverage data using node
        node -e "
        const fs = require('fs');
        const coverage = JSON.parse(fs.readFileSync('${COVERAGE_DIR}/coverage-summary.json', 'utf8'));
        const { lines, statements, functions, branches } = coverage.total;

        console.log('📊 Coverage Report:');
        console.log('  Lines:      ' + lines.pct + '% (' + lines.covered + '/' + lines.total + ')');
        console.log('  Statements: ' + statements.pct + '% (' + statements.covered + '/' + statements.total + ')');
        console.log('  Functions:  ' + functions.pct + '% (' + functions.covered + '/' + functions.total + ')');
        console.log('  Branches:   ' + branches.pct + '% (' + branches.covered + '/' + branches.total + ')');
        console.log('');
        console.log('📁 Full report: ./' + '${COVERAGE_DIR}' + '/lcov-report/index.html');
        "

        # Check coverage thresholds
        LINES_PCT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('${COVERAGE_DIR}/coverage-summary.json', 'utf8')).total.lines.pct)")

        if (( $(echo "$LINES_PCT >= 80" | bc -l) )); then
            print_success "Coverage threshold met (${LINES_PCT}% >= 80%)"
        else
            print_warning "Coverage below threshold (${LINES_PCT}% < 80%)"
        fi
    fi

    print_success "Test suite completed successfully! 🎉"
else
    print_error "Tests failed!"
    exit 1
fi
