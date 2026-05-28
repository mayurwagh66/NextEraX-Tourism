const fs = require('fs');
const path = require('path');

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace mango rgba with deep green rgba
  let newContent = content.replace(/245,\s*158,\s*11/g, '45, 69, 47');
  // Replace accent orange rgba with earthy brown rgba
  newContent = newContent.replace(/217,\s*119,\s*6/g, '139, 95, 74');
  
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
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      replaceColorsInFile(fullPath);
    }
  });
}

walkDir('d:\\Jharkhand-Tourism-main\\frontend\\src');
console.log('Done');
