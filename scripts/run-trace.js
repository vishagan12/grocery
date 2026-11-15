const fs = require('fs');
const { execSync } = require('child_process');

const url = process.argv[2] || 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/';
const outFile = process.argv[3] || 'lh-trace-out.json';

try {
  execSync(`npx lighthouse ${url} --output=json --output-path=${outFile} --only-categories=performance --chrome-flags="--headless" --form-factor=mobile --throttling-method=devtools --max-wait-for-load=45000`, {
    timeout: 120000,
    stdio: 'ignore'
  });
  console.log('Lighthouse run complete: ' + outFile);
} catch (e) {
  if (e.killed || e.signal === 'SIGTERM') {
    console.error('Lighthouse timed out');
  } else {
    console.error('Lighthouse error:', e.message);
  }
  process.exit(1);
}

