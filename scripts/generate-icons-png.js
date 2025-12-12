const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Função para criar um ícone PNG com gradiente e coração
async function createIconPNG(size, filename) {
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <path d="M${size * 0.5} ${size * 0.3} C${size * 0.4} ${size * 0.3}, ${size * 0.35} ${size * 0.4}, ${size * 0.35} ${size * 0.5} C${size * 0.35} ${size * 0.6}, ${size * 0.4} ${size * 0.7}, ${size * 0.5} ${size * 0.7} C${size * 0.6} ${size * 0.7}, ${size * 0.65} ${size * 0.6}, ${size * 0.65} ${size * 0.5} C${size * 0.65} ${size * 0.4}, ${size * 0.6} ${size * 0.3}, ${size * 0.5} ${size * 0.3} Z" fill="white" opacity="0.95"/>
  <path d="M${size * 0.5} ${size * 0.4} C${size * 0.45} ${size * 0.4}, ${size * 0.42} ${size * 0.45}, ${size * 0.42} ${size * 0.5} C${size * 0.42} ${size * 0.55}, ${size * 0.45} ${size * 0.6}, ${size * 0.5} ${size * 0.6} C${size * 0.55} ${size * 0.6}, ${size * 0.58} ${size * 0.55}, ${size * 0.58} ${size * 0.5} C${size * 0.58} ${size * 0.45}, ${size * 0.55} ${size * 0.4}, ${size * 0.5} ${size * 0.4} Z" fill="white"/>
</svg>`;

  const buffer = Buffer.from(svg);
  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(path.join(assetsDir, filename));
  
  console.log(`✓ Criado ${filename} (${size}x${size}px)`);
}

// Função para criar splash screen PNG
async function createSplashPNG(width, height, filename) {
  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#splashGrad)"/>
  <g transform="translate(${width/2}, ${height/2})">
    <circle cx="0" cy="0" r="${Math.min(width, height) * 0.15}" fill="white" opacity="0.15"/>
    <path d="M0 ${-Math.min(width, height) * 0.1} C${-Math.min(width, height) * 0.08} ${-Math.min(width, height) * 0.1}, ${-Math.min(width, height) * 0.1} ${-Math.min(width, height) * 0.05}, ${-Math.min(width, height) * 0.1} 0 C${-Math.min(width, height) * 0.1} ${Math.min(width, height) * 0.05}, ${-Math.min(width, height) * 0.08} ${Math.min(width, height) * 0.1}, 0 ${Math.min(width, height) * 0.1} C${Math.min(width, height) * 0.08} ${Math.min(width, height) * 0.1}, ${Math.min(width, height) * 0.1} ${Math.min(width, height) * 0.05}, ${Math.min(width, height) * 0.1} 0 C${Math.min(width, height) * 0.1} ${-Math.min(width, height) * 0.05}, ${Math.min(width, height) * 0.08} ${-Math.min(width, height) * 0.1}, 0 ${-Math.min(width, height) * 0.1} Z" fill="white" opacity="0.9"/>
    <path d="M0 ${-Math.min(width, height) * 0.06} C${-Math.min(width, height) * 0.05} ${-Math.min(width, height) * 0.06}, ${-Math.min(width, height) * 0.06} ${-Math.min(width, height) * 0.03}, ${-Math.min(width, height) * 0.06} 0 C${-Math.min(width, height) * 0.06} ${Math.min(width, height) * 0.03}, ${-Math.min(width, height) * 0.05} ${Math.min(width, height) * 0.06}, 0 ${Math.min(width, height) * 0.06} C${Math.min(width, height) * 0.05} ${Math.min(width, height) * 0.06}, ${Math.min(width, height) * 0.06} ${Math.min(width, height) * 0.03}, ${Math.min(width, height) * 0.06} 0 C${Math.min(width, height) * 0.06} ${-Math.min(width, height) * 0.03}, ${Math.min(width, height) * 0.05} ${-Math.min(width, height) * 0.06}, 0 ${-Math.min(width, height) * 0.06} Z" fill="white"/>
  </g>
</svg>`;

  const buffer = Buffer.from(svg);
  await sharp(buffer)
    .resize(width, height)
    .png()
    .toFile(path.join(assetsDir, filename));
  
  console.log(`✓ Criado ${filename} (${width}x${height}px)`);
}

async function generateAll() {
  console.log('🎨 Gerando ícones e splash screen em PNG...\n');
  
  try {
    // Gerar ícones
    await createIconPNG(1024, 'icon.png');
    await createIconPNG(1024, 'adaptive-icon.png');
    
    // Gerar splash screen
    await createSplashPNG(1284, 2778, 'splash-icon.png');
    
    // Gerar favicon
    await createIconPNG(48, 'favicon.png');
    
    console.log('\n✅ Todos os arquivos PNG foram criados com sucesso!');
    console.log('\n📱 Os arquivos estão prontos para uso no app.json');
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error);
    process.exit(1);
  }
}

generateAll();

