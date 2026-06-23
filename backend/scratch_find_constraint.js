const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchDir(filePath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.sql')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('so_lien_lac') && content.includes('CHECK')) {
        console.log(`Tìm thấy trong file: ${filePath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('CHECK') || line.includes('vai_tro_gui')) {
            console.log(`  ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

searchDir(__dirname);
