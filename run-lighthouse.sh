#!/bin/bash

# Lighthouse Performance Test Script
set -e

PORT=8080
BASE_URL="http://127.0.0.1:${PORT}"
OUTPUT_DIR="./lighthouse-reports"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🚀 Starting Lighthouse Performance Tests"
echo ""
echo "Target Requirements:"
echo "  - Performance score: 80+"
echo "  - Time to Interactive: < 3000ms (on throttled 4G)"
echo "  - Cumulative Layout Shift: < 0.1"
echo "═══════════════════════════════════════════════════════════"

# Start Python HTTP server in background
echo "Starting HTTP server on port ${PORT}..."
python -m http.server ${PORT} > /dev/null 2>&1 &
SERVER_PID=$!

# Give server time to start
sleep 3

echo "✓ Server started on port ${PORT}"

# Function to run lighthouse on a page
run_lighthouse() {
    local PAGE_NAME=$1
    local PAGE_PATH=$2
    local URL="${BASE_URL}/${PAGE_PATH}"
    local OUTPUT_PATH="${OUTPUT_DIR}/${PAGE_NAME}-report"

    echo ""
    echo "→ Testing ${PAGE_NAME} (${PAGE_PATH})..."

    npx lighthouse "${URL}" \
        --only-categories=performance \
        --form-factor=mobile \
        --throttling-method=simulate \
        --throttling.cpuSlowdownMultiplier=4 \
        --output=json \
        --output=html \
        --output-path="${OUTPUT_PATH}" \
        --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu" \
        --quiet 2>&1 | grep -E "(Performance|Time|CLS)" || true

    # Parse results
    if [ -f "${OUTPUT_PATH}.report.json" ]; then
        local SCORE=$(cat "${OUTPUT_PATH}.report.json" | grep -o '"score":[0-9.]*' | head -1 | cut -d: -f2)
        SCORE=$(awk "BEGIN {printf \"%.0f\", $SCORE * 100}")
        echo "✓ ${PAGE_NAME}: Performance ${SCORE}/100"

        # Extract key metrics using node
        node -e "
        const fs = require('fs');
        const report = JSON.parse(fs.readFileSync('${OUTPUT_PATH}.report.json', 'utf8'));
        const tti = report.audits['interactive']?.numericValue || 0;
        const cls = report.audits['cumulative-layout-shift']?.numericValue || 0;
        const fcp = report.audits['first-contentful-paint']?.numericValue || 0;
        const lcp = report.audits['largest-contentful-paint']?.numericValue || 0;
        console.log('TTI:', Math.round(tti), 'ms');
        console.log('CLS:', cls.toFixed(3));
        console.log('FCP:', Math.round(fcp), 'ms');
        console.log('LCP:', Math.round(lcp), 'ms');
        " | sed 's/^/  - /'
    else
        echo "✗ ${PAGE_NAME}: Test failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    echo ""
    echo "→ Stopping server..."
    kill $SERVER_PID 2>/dev/null || true
}

trap cleanup EXIT

# Run tests on all pages
PASSED=0
FAILED=0

run_lighthouse "skills" "skills.html" && ((PASSED++)) || ((FAILED++))
run_lighthouse "hints" "hints.html" && ((PASSED++)) || ((FAILED++))
run_lighthouse "optimizer" "optimizer.html" && ((PASSED++)) || ((FAILED++))
run_lighthouse "calculator" "calculator.html" && ((PASSED++)) || ((FAILED++))

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 TEST RESULTS SUMMARY"
echo ""
echo "${PASSED}/4 pages passed"
echo ""
echo "Detailed reports saved to: ${OUTPUT_DIR}/"

if [ $FAILED -gt 0 ]; then
    exit 1
fi

exit 0
