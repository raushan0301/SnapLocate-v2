const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, 'src/components/PageLayout.jsx'),
  path.join(__dirname, 'src/components/Header.jsx')
];

const replacements = [
  { search: /#ffffff/g, replace: 'var(--bg-card)' },
  { search: /#fff/g, replace: 'var(--bg-card)' },
  { search: /#0f172a/g, replace: 'var(--text-primary)' },
  { search: /#1e293b/g, replace: 'var(--text-primary)' },
  { search: /#64748b/g, replace: 'var(--text-secondary)' },
  { search: /#94a3b8/g, replace: 'var(--text-muted)' },
  { search: /#cbd5e1/g, replace: 'var(--text-muted)' },
  { search: /#f8fafc/g, replace: 'var(--bg-main)' },
  { search: /#f1f5f9/g, replace: 'var(--border-light)' },
  { search: /#e2e8f0/g, replace: 'var(--border-primary)' }
];

targetFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.search, r.replace);
  });
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Replaced colors in layout and header files.');
