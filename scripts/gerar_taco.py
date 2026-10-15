"""
Gera src/constants/taco.ts a partir da TACO (Tabela Brasileira de Composição
de Alimentos, 4ª edição, NEPA/UNICAMP).

Fonte dos dados normalizados: https://github.com/brolesi/taco (licença MIT),
arquivo data/processed/taco/taco_composicao.csv, copiado em scripts/dados/.

Uso:  python scripts/gerar_taco.py
"""
import csv
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(RAIZ, 'scripts', 'dados', 'taco_composicao.csv')
SAIDA = os.path.join(RAIZ, 'src', 'constants', 'taco.ts')


def numero(texto):
    """Valores da TACO podem vir vazios, 'NA' ou 'Tr' (traço = ~0)."""
    try:
        v = float(texto)
    except (TypeError, ValueError):
        return 0.0
    return 0.0 if v < 0.01 else v


def nome_amigavel(descricao):
    # "Batata, inglesa, crua" -> "Batata inglesa crua"
    partes = [p.strip() for p in descricao.split(',') if p.strip()]
    return ' '.join(partes)


alimentos = []
vistos = set()
with open(ENTRADA, encoding='utf-8') as f:
    for linha in csv.DictReader(f):
        if not linha['energia_kcal']:
            continue
        nome = nome_amigavel(linha['descricao'])
        if nome.lower() in vistos:
            continue
        vistos.add(nome.lower())
        alimentos.append({
            'nome': nome,
            'kcalPor100g': round(numero(linha['energia_kcal'])),
            'proteinaGPor100g': round(numero(linha['proteina_g']), 1),
            'carboidratoGPor100g': round(numero(linha['carboidrato_g']), 1),
            'gramaPadrao': 100,
        })

alimentos.sort(key=lambda a: a['nome'])

cabecalho = '''// ARQUIVO GERADO por scripts/gerar_taco.py — não edite à mão.
//
// TACO — Tabela Brasileira de Composição de Alimentos, 4ª edição revisada e
// ampliada. NEPA/UNICAMP, Campinas, 2011. Valores por 100 g de parte comestível.
// Dados normalizados por github.com/brolesi/taco (MIT).
import { Ingrediente } from '@models/ingredients';

export const alimentosTaco: Ingrediente[] = [
'''
linhas = [f'  {json.dumps(a, ensure_ascii=False)},' for a in alimentos]
with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
    f.write(cabecalho + '\n'.join(linhas) + '\n];\n')

print(f'{len(alimentos)} alimentos gravados em {os.path.relpath(SAIDA, RAIZ)}')
