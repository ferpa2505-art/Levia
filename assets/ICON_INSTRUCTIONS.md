# Como Converter o Ícone

## SVG gerado: assets/icon.svg

### Opção 1: Ferramenta Online (Recomendado)
1. Abrir https://cloudconvert.com/
2. Fazer upload de: assets/icon.svg
3. Converter para PNG
4. Dimensões: 512x512 pixels
5. Download como: icon-512.png
6. Salvar em: assets/icon-512.png

### Opção 2: Ferramenta Local (ImageMagick)
```bash
convert -density 150 assets/icon.svg -resize 512x512 assets/icon-512.png
```

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
