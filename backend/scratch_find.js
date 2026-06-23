const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/config/db.js');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log("Tìm các dòng chứa 'so_lien_lac' trong db.js:");
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('so_lien_lac')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("Không tìm thấy src/config/db.js");
}
