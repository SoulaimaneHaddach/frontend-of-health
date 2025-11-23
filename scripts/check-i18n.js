const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const translationsPath = path.join(srcDir, 'i18n', 'translations.ts');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files = files.concat(walk(full));
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      files.push(full);
    }
  }
  return files;
}

function extractUsedKeys(files) {
  const keySet = new Set();
  const re = /\bt\.([A-Za-z0-9_]+)\b/g;
  files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(content)) !== null) {
      keySet.add(m[1]);
    }
  });
  return Array.from(keySet).sort();
}

function extractDefinedKeys(translationsFile) {
  const content = fs.readFileSync(translationsFile, 'utf8');
  // Heuristic: extract keys from the Translations interface and from the object literals
  const keySet = new Set();
  // match `key: string;` lines in interface
  const ifaceRe = /\b([A-Za-z0-9_]+)\s*:\s*[^;]+;/g;
  let m;
  while ((m = ifaceRe.exec(content)) !== null) {
    keySet.add(m[1]);
  }
  // match keys in object literal like `bookingSuccess: 'Booking Successful',`
  const objRe = /\b([A-Za-z0-9_]+)\s*:\s*(?:`|'|")/g;
  while ((m = objRe.exec(content)) !== null) {
    keySet.add(m[1]);
  }
  return Array.from(keySet).sort();
}

function main() {
  if (!fs.existsSync(translationsPath)) {
    console.error('translations.ts not found at', translationsPath);
    process.exit(2);
  }
  const files = walk(srcDir);
  const used = extractUsedKeys(files);
  const defined = extractDefinedKeys(translationsPath);

  const definedSet = new Set(defined);
  const usedButMissing = used.filter(k => !definedSet.has(k));
  const unusedDefined = defined.filter(k => !used.includes(k));

  console.log('== i18n check report ==');
  console.log('Files scanned:', files.length);
  console.log('Used keys count:', used.length);
  console.log('Defined keys count:', defined.length);
  console.log('---');
  if (usedButMissing.length === 0) {
    console.log('No missing keys.');
  } else {
    console.log('Missing keys (used in code but not defined in translations):');
    usedButMissing.forEach(k => console.log(' -', k));
  }
  console.log('---');
  console.log('Defined keys not used anywhere (maybe stale):', unusedDefined.length);
  // print a short sample of unused keys (up to 40)
  unusedDefined.slice(0, 40).forEach(k => console.log('  *', k));

  // For convenience, write result file
  const out = { filesScanned: files.length, usedKeys: used, definedKeys: defined, missing: usedButMissing, unusedDefined };
  fs.writeFileSync(path.join(root, 'i18n-check-report.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log('\nReport written to i18n-check-report.json');
}

main();
