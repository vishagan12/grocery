const fs = require('fs');
let code = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const regex = /fetchLiveCatalog\(\);\s*return \(\) => \{\s*isSubscribed = false;\s*\};/;
const replacement = `if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => {
        fetchLiveCatalog();
      }, { timeout: 3000 });
      return () => {
        isSubscribed = false;
        if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(handle);
      };
    } else {
      const timer = setTimeout(() => {
        fetchLiveCatalog();
      }, 1500);
      return () => {
        isSubscribed = false;
        clearTimeout(timer);
      };
    }`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/context/StoreContext.tsx', code, 'utf8');
  console.log('Successfully deferred fetchLiveCatalog');
} else {
  console.log('Regex match failed');
}

