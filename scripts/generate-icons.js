const fs = require('fs');
const path = require('path');

// Criar diretório assets se não existir
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Função para criar um SVG simples do ícone
function createIconSVG(size, filename) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <path d="M${size * 0.5} ${size * 0.3} C${size * 0.4} ${size * 0.3}, ${size * 0.35} ${size * 0.4}, ${size * 0.35} ${size * 0.5} C${size * 0.35} ${size * 0.6}, ${size * 0.4} ${size * 0.7}, ${size * 0.5} ${size * 0.7} C${size * 0.6} ${size * 0.7}, ${size * 0.65} ${size * 0.6}, ${size * 0.65} ${size * 0.5} C${size * 0.65} ${size * 0.4}, ${size * 0.6} ${size * 0.3}, ${size * 0.5} ${size * 0.3} Z" fill="white" opacity="0.9"/>
  <path d="M${size * 0.5} ${size * 0.4} C${size * 0.45} ${size * 0.4}, ${size * 0.42} ${size * 0.45}, ${size * 0.42} ${size * 0.5} C${size * 0.42} ${size * 0.55}, ${size * 0.45} ${size * 0.6}, ${size * 0.5} ${size * 0.6} C${size * 0.55} ${size * 0.6}, ${size * 0.58} ${size * 0.55}, ${size * 0.58} ${size * 0.5} C${size * 0.58} ${size * 0.45}, ${size * 0.55} ${size * 0.4}, ${size * 0.5} ${size * 0.4} Z" fill="white"/>
</svg>`;
  
  fs.writeFileSync(path.join(assetsDir, filename), svg);
  console.log(`✓ Criado ${filename} (${size}x${size})`);
}

// Função para criar splash screen SVG
function createSplashSVG(width, height, filename) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#splashGrad)"/>
  <g transform="translate(${width/2}, ${height/2})">
    <circle cx="0" cy="0" r="${Math.min(width, height) * 0.15}" fill="white" opacity="0.2"/>
    <path d="M0 ${-Math.min(width, height) * 0.1} C${-Math.min(width, height) * 0.08} ${-Math.min(width, height) * 0.1}, ${-Math.min(width, height) * 0.1} ${-Math.min(width, height) * 0.05}, ${-Math.min(width, height) * 0.1} 0 C${-Math.min(width, height) * 0.1} ${Math.min(width, height) * 0.05}, ${-Math.min(width, height) * 0.08} ${Math.min(width, height) * 0.1}, 0 ${Math.min(width, height) * 0.1} C${Math.min(width, height) * 0.08} ${Math.min(width, height) * 0.1}, ${Math.min(width, height) * 0.1} ${Math.min(width, height) * 0.05}, ${Math.min(width, height) * 0.1} 0 C${Math.min(width, height) * 0.1} ${-Math.min(width, height) * 0.05}, ${Math.min(width, height) * 0.08} ${-Math.min(width, height) * 0.1}, 0 ${-Math.min(width, height) * 0.1} Z" fill="white" opacity="0.9"/>
    <path d="M0 ${-Math.min(width, height) * 0.06} C${-Math.min(width, height) * 0.05} ${-Math.min(width, height) * 0.06}, ${-Math.min(width, height) * 0.06} ${-Math.min(width, height) * 0.03}, ${-Math.min(width, height) * 0.06} 0 C${-Math.min(width, height) * 0.06} ${Math.min(width, height) * 0.03}, ${-Math.min(width, height) * 0.05} ${Math.min(width, height) * 0.06}, 0 ${Math.min(width, height) * 0.06} C${Math.min(width, height) * 0.05} ${Math.min(width, height) * 0.06}, ${Math.min(width, height) * 0.06} ${Math.min(width, height) * 0.03}, ${Math.min(width, height) * 0.06} 0 C${Math.min(width, height) * 0.06} ${-Math.min(width, height) * 0.03}, ${Math.min(width, height) * 0.05} ${-Math.min(width, height) * 0.06}, 0 ${-Math.min(width, height) * 0.06} Z" fill="white"/>
  </g>
</svg>`;
  
  fs.writeFileSync(path.join(assetsDir, filename), svg);
  console.log(`✓ Criado ${filename} (${width}x${height})`);
}

console.log('🎨 Gerando ícones e splash screen...\n');

// Gerar ícones
createIconSVG(1024, 'icon.svg');
createIconSVG(1024, 'adaptive-icon.svg');

// Gerar splash screen
createSplashSVG(1284, 2778, 'splash-icon.svg');

// Gerar favicon
createIconSVG(48, 'favicon.svg');

console.log('\n✅ Todos os arquivos SVG foram criados!');
console.log('\n📝 Nota: Os arquivos foram criados como SVG.');
console.log('   Para usar como PNG, você pode:');
console.log('   1. Converter online (ex: convertio.co, cloudconvert.com)');
console.log('   2. Usar ferramentas como Inkscape ou Adobe Illustrator');
console.log('   3. Ou instalar sharp e executar: npm install sharp --save-dev');

