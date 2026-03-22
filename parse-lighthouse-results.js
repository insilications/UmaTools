const fs = require('fs');
const pages = ['skills', 'hints', 'optimizer', 'calculator'];

console.log('📊 LIGHTHOUSE PERFORMANCE TEST RESULTS\n');
console.log('═══════════════════════════════════════════════════════════');

let allPassed = true;
const results = [];

pages.forEach(page => {
  try {
    const report = JSON.parse(fs.readFileSync(`lighthouse-reports/${page}-report.report.json`, 'utf8'));

    if (report.runtimeError) {
      console.log(`\n✗ ${page}: FAILED`);
      console.log(`  Error: ${report.runtimeError.code}`);
      allPassed = false;
      results.push({ page, passed: false, error: report.runtimeError.code });
      return;
    }

    const score = Math.round(report.categories.performance.score * 100);
    const tti = Math.round(report.audits['interactive']?.numericValue || 0);
    const cls = (report.audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3);
    const fcp = Math.round(report.audits['first-contentful-paint']?.numericValue || 0);
    const lcp = Math.round(report.audits['largest-contentful-paint']?.numericValue || 0);

    const scorePassed = score >= 80;
    const ttiPassed = tti < 3000;
    const clsPassed = parseFloat(cls) < 0.1;
    const passed = scorePassed && ttiPassed && clsPassed;

    if (!passed) allPassed = false;

    const symbol = passed ? '✓' : '✗';

    console.log(`\n${symbol} ${page}:`);
    console.log(`  Performance Score: ${score}/100 ${scorePassed ? '✓ PASS' : '✗ FAIL (need 80+)'}`);
    console.log(`  Time to Interactive: ${tti}ms ${ttiPassed ? '✓' : '✗ (need < 3000ms)'}`);
    console.log(`  Cumulative Layout Shift: ${cls} ${clsPassed ? '✓' : '✗ (need < 0.1)'}`);
    console.log(`  First Contentful Paint: ${fcp}ms`);
    console.log(`  Largest Contentful Paint: ${lcp}ms`);

    results.push({
      page,
      passed,
      score,
      tti,
      cls: parseFloat(cls),
      fcp,
      lcp
    });
  } catch (error) {
    console.log(`\n✗ ${page}: Report not found or invalid`);
    console.log(`  Error: ${error.message}`);
    allPassed = false;
    results.push({ page, passed: false, error: error.message });
  }
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('\n📋 SUMMARY:');
const passedCount = results.filter(r => r.passed).length;
console.log(`${passedCount}/${pages.length} pages passed all requirements\n`);

if (allPassed) {
  console.log('✓ All tests passed! 🎉');
  process.exit(0);
} else {
  console.log('✗ Some tests failed. Review the results above.');
  process.exit(1);
}
