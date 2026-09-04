const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');

let modified = 0;

for (const file of files) {
  if (file.includes('DialogContext.tsx') || file.includes('App.tsx')) continue;

  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  let hasAlert = content.includes('alert(') || content.includes('window.alert(');
  let hasConfirm = content.includes('confirm(') || content.includes('window.confirm(');

  if (!hasAlert && !hasConfirm) continue;

  // 1. Replace alert( and window.alert( with showAlert(
  content = content.replace(/\bwindow\.alert\(/g, 'showAlert(');
  content = content.replace(/\balert\(/g, 'showAlert(');

  // 2. Replace confirm( and window.confirm( with await showConfirm(
  content = content.replace(/\bwindow\.confirm\(/g, 'await showConfirm(');
  content = content.replace(/\bconfirm\(/g, 'await showConfirm(');

  // 3. Make containing arrow functions async if they have await showConfirm
  if (hasConfirm) {
    // This is a naive regex but works for most React event handlers
    content = content.replace(/const (\w+) = \((.*?)\) => {/g, (match, name, args) => {
      if (content.substring(content.indexOf(match)).includes('await showConfirm')) {
        // If it's already async, skip
        if (match.includes('async')) return match;
        return `const ${name} = async (${args}) => {`;
      }
      return match;
    });

    // For function declarations
    content = content.replace(/function (\w+)\((.*?)\) {/g, (match, name, args) => {
      // we don't want to make the main component async usually, but we have to make handlers async
      // actually, we already made handlers async. Let's just blindly make async any function that contains await showConfirm?
      // Actually, `await showConfirm` is only valid inside async functions. If there are syntax errors, we can fix them manually.
      return match;
    });
  }

  // 4. Inject useDialog hook into the main component
  // Find the main component signature: export default function X() { or export function X() { or const X = () => {
  let hooksToExtract = [];
  if (hasAlert) hooksToExtract.push('showAlert');
  if (hasConfirm) hooksToExtract.push('showConfirm');
  let hookStr = `  const { ${hooksToExtract.join(', ')} } = useDialog();\n`;

  let injected = false;
  content = content.replace(/(export default function \w+\(.*?\)\s*{)/, (match) => {
    injected = true;
    return match + '\n' + hookStr;
  });

  if (!injected) {
    content = content.replace(/(export function \w+\(.*?\)\s*{)/, (match) => {
      injected = true;
      return match + '\n' + hookStr;
    });
  }

  if (!injected) {
    content = content.replace(/(const [A-Z]\w* = \(.*?\)(?:: React\.FC.*?)? =>\s*{)/, (match) => {
      injected = true;
      return match + '\n' + hookStr;
    });
  }

  // 5. Add import
  if (injected || hasAlert || hasConfirm) {
    const normalizedFile = file.replace(/\\/g, '/');
    const levels = Math.max(0, normalizedFile.split('/').length - 2); // src/pages/x.tsx -> 1 level, src/x.tsx -> 0 levels
    let relativePath =
      levels === 0 ? './context/DialogContext' : '../'.repeat(levels) + 'context/DialogContext';
    if (levels === -1) relativePath = './context/DialogContext'; // if it's directly in src

    let importStr = `import { useDialog } from '${relativePath}';\n`;
    // Insert after first import
    content = content.replace(/import .*?;\n/, (match) => match + importStr);
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    modified++;
  }
}

console.log(`Refactored ${modified} files.`);
