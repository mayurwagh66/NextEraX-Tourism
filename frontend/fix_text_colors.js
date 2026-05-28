const fs = require('fs');
const path = require('path');

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace text colors specifically
  let newContent = content.replace(/color:\s*'#0284c7'/gi, "color: '#1f2937'");
  newContent = newContent.replace(/color:\s*#0284c7/gi, "color: #1f2937");
  newContent = newContent.replace(/color:\s*'#0369a1'/gi, "color: '#0f172a'");
  newContent = newContent.replace(/color:\s*#0369a1/gi, "color: #0f172a");
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.jsx')) {
      replaceColorsInFile(fullPath);
    }
  });
}

walkDir('d:\\Jharkhand-Tourism-main\\frontend\\src');
console.log('Done');
