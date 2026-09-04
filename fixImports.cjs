const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Check if it uses useDialog but hasn't imported it
  if (content.includes('useDialog()') && !content.includes('useDialog }')) {
    const normalizedFile = file.replace(/\\/g, '/');
    const levels = Math.max(0, normalizedFile.split('/').length - 2);
    let relativePath =
      levels === 0 ? './context/DialogContext' : '../'.repeat(levels) + 'context/DialogContext';

    let importStr = `import { useDialog } from '${relativePath}';\n`;

    // Find the end of the last import statement
    const importMatch = [...content.matchAll(/^import .*$/gm)].pop();
    if (importMatch) {
      const index = importMatch.index + importMatch[0].length;
      content = content.slice(0, index) + '\n' + importStr + content.slice(index);
    } else {
      content = importStr + content;
    }

    fs.writeFileSync(file, content);
    console.log(`Fixed import in ${file}`);
  }
}
