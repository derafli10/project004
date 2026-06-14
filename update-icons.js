const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
};

const files = [...walk('./app'), ...walk('./components')];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
  if (importMatch) {
    const icons = importMatch[1].split(',').map(i => i.trim()).filter(Boolean);
    let modified = false;
    icons.forEach(icon => {
      // Find <Icon ... /> and add aria-hidden="true" if not present
      const regexSelf = new RegExp('<' + icon + '\\b([^>]*?)\\/>', 'g');
      content = content.replace(regexSelf, (match, p1) => {
        if (!p1.includes('aria-hidden') && !p1.includes('aria-label')) {
          modified = true;
          return '<' + icon + p1 + ' aria-hidden="true" />';
        }
        return match;
      });
      
      const regex = new RegExp('<' + icon + '\\b([^>]*?)>', 'g');
      content = content.replace(regex, (match, p1) => {
        if (!p1.includes('aria-hidden') && !p1.includes('aria-label')) {
          modified = true;
          return '<' + icon + p1 + ' aria-hidden="true">';
        }
        return match;
      });
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated icons in ' + file);
    }
  }
});
