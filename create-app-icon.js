#!/usr/bin/env node

/**
 * CRIAR ÍCONE DO APP LEVIÃ (512×512)
 * 
 * Este script gera um SVG que representa:
 * - Saúde (coração verde)
 * - Diabetes (gota de sangue)
 * - Friendly (arredondado, acessível)
 * 
 * Output: assets/icon-512.png (ou SVG)
 */

const fs = require('fs');
const path = require('path');

// Criar pasta assets se não existir
if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets', { recursive: true });
  console.log('✅ Pasta assets criada');
}

// SVG Icon - Leviã Logo
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Rounded background -->
  <rect width="512" height="512" rx="120" fill="url(#grad1)"/>
  
  <!-- White circle background for icon -->
  <circle cx="256" cy="256" r="180" fill="white"/>
  
  <!-- Heart (Diabetes awareness) -->
  <g transform="translate(150, 150) scale(1.5)">
    <!-- Main heart shape -->
    <path d="M 64 120 
             C 64 120, 32 90, 32 60
             C 32 40, 45 30, 60 30
             C 75 30, 85 40, 85 55
             C 85 40, 95 30, 110 30
             C 125 30, 138 40, 138 60
             C 138 90, 106 120, 106 120
             Z" 
          fill="#ef4444" opacity="0.9"/>
    
    <!-- Blood drop inside heart (stylized) -->
    <ellipse cx="85" cy="80" rx="12" ry="18" fill="#dc2626"/>
  </g>
  
  <!-- Glucose drop symbol -->
  <g transform="translate(280, 180)">
    <!-- Drop shape -->
    <path d="M 20 5 
             C 20 5, 5 20, 5 35
             C 5 45, 10 50, 20 50
             C 30 50, 35 45, 35 35
             C 35 20, 20 5, 20 5
             Z" 
          fill="#3b82f6" opacity="0.85"/>
    
    <!-- Plus sign inside (health indicator) -->
    <line x1="20" y1="25" x2="20" y2="40" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="12" y1="32" x2="28" y2="32" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </g>
  
  <!-- Bottom text banner -->
  <rect x="40" y="410" width="432" height="60" rx="15" fill="#10b981" opacity="0.2"/>
  
  <!-- App name (if included) -->
  <text x="256" y="450" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
        fill="#059669" text-anchor="middle">Leviã</text>
</svg>`;

// Salvar SVG
const svgPath = path.join('assets', 'icon.svg');
fs.writeFileSync(svgPath, svgIcon);
console.log(`✅ SVG icon salvo: ${svgPath}`);

// Informação para conversão
console.log('\n📋 PRÓXIMO PASSO: Converter SVG para PNG 512×512\n');

console.log('OPÇÃO 1: Online (Rápido)\n');
console.log('  1. Abrir: https://svgonline.com/ ou https://cloudconvert.com/');
console.log('  2. Upload: assets/icon.svg');
console.log('  3. Converter para: PNG (512×512)');
console.log('  4. Download e salvar como: assets/icon-512.png\n');

console.log('OPÇÃO 2: Command Line (se tiver ImageMagick)\n');
console.log('  $ convert -density 150 assets/icon.svg -resize 512x512 assets/icon-512.png\n');

console.log('OPÇÃO 3: Usar icon padrão Expo\n');
console.log('  - Deixar icon.svg como backup');
console.log('  - Expo usará automaticamente se não tiver PNG\n');

console.log('═════════════════════════════════════════════════════════════════\n');

// Salvar instruções
const instructions = `# Como Converter o Ícone

## SVG gerado: assets/icon.svg

### Opção 1: Ferramenta Online (Recomendado)
1. Abrir https://cloudconvert.com/
2. Fazer upload de: assets/icon.svg
3. Converter para PNG
4. Dimensões: 512x512 pixels
5. Download como: icon-512.png
6. Salvar em: assets/icon-512.png

### Opção 2: Ferramenta Local (ImageMagick)
\`\`\`bash
convert -density 150 assets/icon.svg -resize 512x512 assets/icon-512.png
\`\`\`

### Opção 3: Usar SVG diretamente
- Leviã usará SVG automaticamente se PNG não existir
- Menos ideal, mas funciona

## Que significado tem o ícone:

🔴 **Coração vermelho**: Saúde, cuidado, vida
💙 **Gota azul com +**: Glicose, monitoramento, saúde ativa
🟢 **Fundo verde**: Esperança, cura, bem-estar

O design é amigável, acessível e representa:
- Diabetes (consciência)
- Saúde monitorada (gota)
- Esperança e cuidado (cores vivas)
`;

const instructPath = path.join('assets', 'ICON_INSTRUCTIONS.md');
fs.writeFileSync(instructPath, instructions);
console.log(`✅ Instruções salvas: ${instructPath}`);

console.log('\n✨ Icon pronto! Próxima etapa: EAS Build\n');
