"""
Adiciona (ou atualiza) textos nos 20 arquivos de tradução a partir de um JSON:

    { "chave": { "pt-BR": "...", "en-US": "...", ... }, ... }

Idiomas ausentes caem para: pt-PT -> pt-BR, en-GB -> en-US, demais -> en-US.
Uso:  python scripts/adicionar_textos.py caminho/textos.json
"""
import io
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDIOMAS = ['pt-BR', 'pt-PT', 'es', 'en-US', 'en-GB', 'it', 'fr', 'de', 'nl', 'pl',
           'tr', 'ru', 'ja', 'ko', 'zh-CN', 'id', 'vi', 'th', 'hi', 'ar']
RESERVA = {'pt-PT': 'pt-BR', 'en-GB': 'en-US'}

textos = json.load(io.open(sys.argv[1], encoding='utf-8'))

for idioma in IDIOMAS:
    caminho = os.path.join(RAIZ, 'src', 'i18n', 'traducoes', f'{idioma}.ts')
    s = io.open(caminho, encoding='utf-8-sig').read()
    novos = []
    for chave, por_idioma in textos.items():
        valor = por_idioma.get(idioma) or por_idioma.get(RESERVA.get(idioma, 'en-US')) or por_idioma.get('pt-BR')
        if valor is None:
            continue  # nada para este idioma: mantém o texto atual
        literal = json.dumps(valor, ensure_ascii=False)
        padrao = re.compile(r'(\n\s*' + re.escape(json.dumps(chave)) + r'\s*:\s*)"(?:[^"\\]|\\.)*"')
        if padrao.search(s):
            s = padrao.sub(lambda m: m.group(1) + literal, s, count=1)
        else:
            novos.append(f'\n  {json.dumps(chave)}: {literal},')
    if novos:
        i = s.index('\n};')
        antes = s[:i].rstrip()
        if not antes.endswith(','):
            antes += ','
        s = antes + ''.join(novos) + s[i:]
    io.open(caminho, 'w', encoding='utf-8', newline='\n').write(s)

print(f'{len(textos)} textos aplicados em {len(IDIOMAS)} idiomas')
