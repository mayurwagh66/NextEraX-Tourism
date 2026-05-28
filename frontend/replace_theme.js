const fs = require('fs');
const path = require('path');

// Deep Green -> Sky Blue (#0284c7)
// Dark Green -> Darker Sky Blue (#0369a1)
function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace Hex
  let newContent = content.replace(/#2d452f/gi, '#0284c7');
  newContent = newContent.replace(/#1a2b1c/gi, '#0369a1');
  
  // Replace RGB/RGBA (45, 69, 47 -> 2, 132, 199)
  newContent = newContent.replace(/45,\s*69,\s*47/g, '2, 132, 199');
  
  // Replace RGB/RGBA (26, 43, 28 -> 3, 105, 161)
  newContent = newContent.replace(/26,\s*43,\s*28/g, '3, 105, 161');
  
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
