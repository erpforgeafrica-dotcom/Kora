#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modulesDir = path.join(__dirname, '../src/modules');
const responseUtilPath = '../../shared/response.js';

let totalFilesProcessed = 0;
let totalReplacements = 0;
const filesWithChanges = [];
const filesStillViolating = [];

// Find all modules
const modules = fs.readdirSync(modulesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

// Check each module for routes.ts
const routeFiles = modules
  .map(moduleName => path.join(modulesDir, moduleName, 'routes.ts'))
  .filter(filePath => fs.existsSync(filePath));

console.log(Processing $'{'}routeFiles.length{'}' route files...\n);

routeFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const moduleName = path.basename(path.dirname(filePath));

  // Check if respondSuccess is already imported
  const hasImport = content.includes('respondSuccess');
  
  // Pattern matching for res.json(
  const hasViolation = /res\.json\s*\(/g.test(content);
  
  if (hasViolation && !hasImport) {
    // Add import for respondSuccess - find a good place
    const lines = content.split('\n');
    const lastImportIndex = lines.findIndex((line, idx) => 
      line.includes(import) && !lines.slice(idx + 1).some(l => l.includes('import'))
    );
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, import { respondSuccess } from "${responseUtilPath}";);
      content = lines.join('\n');
    }
  }

  // Replace patterns
  const pattern1 = /return\s+res\.json\s*\(/g;
  const pattern2 = /([^a-zA-Z_])(res\.json\s*\()/g;
  
  let changedContent = content;
  changedContent = changedContent.replace(pattern1, 'return respondSuccess(res, ');
  changedContent = changedContent.replace(pattern2, '(res, ');
  
  if (changedContent !== originalContent) {
    const changes = (originalContent.match(/res\.json\s*\(/g) || []).length;
    totalReplacements += changes;
    filesWithChanges.push({ moduleName, changes });
    totalFilesProcessed++;
    
    try {
      fs.writeFileSync(filePath, changedContent, 'utf8');
      console.log(√ $'{}'moduleName{'}': $'{}'changes{'}' replacements);
    } catch (e) {
      console.error(✗ $'{}'moduleName{'}': Failed to write - $'{}'e.message{'}`);
    }
  } else {
    // Check if there are still violations
    if (/res\.json\s*\(/g.test(content)) {
      filesStillViolating.push(moduleName);
      console.log(? $'{}'moduleName{'}': Contains unconverted res.json() patterns);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log('CONVERSION SUMMARY');
console.log('='.repeat(60));
console.log(Total route files: $'{}'routeFiles.length{'}');
console.log(Files processed: $'{}'totalFilesProcessed{'}');
console.log(Total replacements: $'{}'totalReplacements{'}');

if (filesWithChanges.length > 0) {
  console.log(\nModified files ($'{}'filesWithChanges.length{'}'):);
  filesWithChanges.forEach(({ moduleName, changes }) => {
    console.log(  - $'{}'moduleName.padEnd(25){'}' $'{}'changes{'}' conversions);
  });
}

if (filesStillViolating.length > 0) {
  console.log(\n? Still need attention ($'{}'filesStillViolating.length{'}'):);
  filesStillViolating.forEach((name) => {
    console.log(  - $'{}'name{'}`);
  });
}

console.log('\n✓ Conversion complete!');
process.exit(filesStillViolating.length > 0 ? 1 : 0);
