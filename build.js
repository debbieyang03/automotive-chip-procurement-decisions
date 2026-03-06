const fs = require('fs');
const path = require('path');

// 讀取環境變數
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('=== Build Environment Variables ===');
console.log('VITE_SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Empty');
console.log('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ Set' : '✗ Empty');
console.log('====================================\n');

// 讀取 app.js
const appJsPath = path.join(__dirname, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf-8');

// 替換環境變數
const originalAppJs = appJs;

appJs = appJs.replace(
  /const SUPABASE_URL = '';/,
  `const SUPABASE_URL = '${SUPABASE_URL}';`
);

appJs = appJs.replace(
  /const SUPABASE_ANON_KEY = '';/,
  `const SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';`
);

// 寫回 app.js
fs.writeFileSync(appJsPath, appJs, 'utf-8');

if (appJs !== originalAppJs) {
  console.log('✓ Environment variables injected into app.js');
} else {
  console.log('⚠ Warning: No variables were replaced. Check regex patterns.');
}

console.log('✓ Build complete');

