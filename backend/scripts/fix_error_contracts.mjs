import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const backendSrc = path.join(process.cwd(), 'src');
const files = globSync('**/*.ts', { cwd: backendSrc, absolute: true });

let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Regex to match: res.status(XYZ).json({ error: "some_error_code" })
  // Also matches: return res.status(XYZ).json({ error: "some_error_code" })
  const regex = /res\.status\((\d+)\)\.json\(\{\s*error:\s*"([^"]+)"\s*\}\)/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, (match, status, errorCode) => {
      // transform error_code to UPPER_SNAKE_CASE for code, and human readable for message
      const code = errorCode.toUpperCase();
      const message = errorCode.replace(/_/g, ' ');
      return `res.status(${status}).json({ error: { code: "${code}", message: "${message}" } })`;
    });
    changed = true;
  }

  const regex2 = /res\.status\((\d+)\)\.json\(\{\s*error:\s*'([^']+)'\s*\}\)/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, (match, status, errorCode) => {
      const code = errorCode.toUpperCase();
      const message = errorCode.replace(/_/g, ' ');
      return `res.status(${status}).json({ error: { code: "${code}", message: "${message}" } })`;
    });
    changed = true;
  }

  const regex3 = /res\.json\(\{\s*error:\s*"([^"]+)"\s*\}\)/g;
  if (regex3.test(content)) {
    content = content.replace(regex3, (match, errorCode) => {
      const code = errorCode.toUpperCase();
      const message = errorCode.replace(/_/g, ' ');
      return `res.json({ error: { code: "${code}", message: "${message}" } })`;
    });
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Fixed error contracts in ${modifiedCount} files.`);
