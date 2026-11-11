#!/usr/bin/env python3
"""Banco ESTENDIDO de produtos industrializados do Levia, a partir do export do Open Food Facts.

Gera `src/data/alimentosEstendidos.json`: os produtos MAIS POPULARES de cada país, com valores por 100 g
verificados (nada de kJ gravado como kcal, nada de macro acima de 100 g).

    python3 off_estendido.py --entrada openfoodfacts.csv.gz [--saida ../../src/data/alimentosEstendidos.json]

O export bruto (1,5 GB, https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz) NÃO entra no Git.

Licença dos dados: Open Database License (ODbL 1.0) + Database Contents License do Open Food Facts.
Exige crédito ("Contains information from Open Food Facts") e que este arquivo derivado continue sob ODbL.
Por isso ele fica SEPARADO do banco curado (alimentosGlobais.json).
"""
import argparse
import collections
import csv
import gzip
import heapq
import json
import re
import sys
import time
import unicodedata

csv.field_size_limit(10 ** 8)

# país (tag do Open Food Facts) -> (sigla, vagas). "outros" junta os demais países por popularidade.
COTAS = {
    'en:brazil': ('BR', 10000), 'en:portugal': ('PT', 4000), 'en:spain': ('ES', 5000), 'en:italy': ('IT', 5000),
    'en:france': ('FR', 6000), 'en:united-kingdom': ('GB', 5000), 'en:germany': ('DE', 5000),
    'en:united-states': ('US', 5000), 'en:mexico': ('MX', 3000), 'en:argentina': ('AR', 1500),
    'en:chile': ('CL', 1000), 'en:colombia': ('CO', 800),
}
VAGAS_OUTROS = 2000
FOLGA = 1.6          # guarda mais candidatos que as vagas, para sobrar depois de tirar duplicados

# regras de categoria: a primeira que casar vence (ordem importa). Sem casar: "processados".
REGRAS = [
    ('alcoolicas', ('alcoholic-beverages', 'beers', 'wines', 'spirits', 'liqueurs')),
    ('suplementos', ('dietary-supplements', 'protein-powders', 'sports-nutrition')),
    ('queijos', ('cheeses',)),
    ('sopas', ('soups',)),
    ('fastfood', ('pizzas', 'burgers', 'sandwiches', 'hamburgers', 'kebabs')),
    ('pratos', ('meals', 'ready-meals', 'prepared-meals', 'lasagnes', 'dishes')),
    ('massas', ('pastas', 'noodles', 'spaghetti')),
    ('cafe_manha', ('breakfast-cereals', 'breakfasts', 'muesli', 'granolas', 'oat-flakes')),
    ('paes', ('breads', 'bakery', 'toasts', 'buns')),
    ('embutidos', ('sausages', 'hams', 'charcuterie', 'cured-meats', 'salamis')),
    ('aves', ('poultry', 'chicken', 'turkey')),
    ('peixes', ('fishes', 'seafood', 'tunas', 'salmons', 'sardines', 'fish-and-seafood')),
    ('carnes', ('meats', 'beef', 'pork', 'meat-based')),
    ('ovos', ('eggs',)),
    ('laticinios', ('dairies', 'milks', 'yogurts', 'creams', 'fermented-milk', 'plant-based-milk', 'desserts-lactes')),
    ('gorduras', ('fats', 'oils', 'butters', 'margarines', 'olive-oils')),
    ('molhos', ('sauces', 'condiments', 'dressings', 'ketchup', 'mayonnaises', 'mustards', 'vinegars')),
    ('doces', ('confectioneries', 'chocolates', 'candies', 'sweet-snacks', 'desserts', 'jams', 'ice-creams', 'cakes', 'biscuits', 'cookies', 'sweeteners', 'honeys', 'sugars')),
    ('snacks', ('snacks', 'chips', 'crisps', 'salty-snacks', 'crackers', 'appetizers', 'popcorn')),
    ('bebidas', ('beverages', 'waters', 'sodas', 'juices', 'teas', 'coffees', 'energy-drinks', 'soft-drinks')),
    ('leguminosas', ('legumes', 'beans', 'lentils', 'chickpeas', 'pulses')),
    ('oleaginosas', ('nuts', 'seeds', 'peanuts', 'almonds', 'dried-nuts')),
    ('tuberculos', ('potatoes', 'cassava', 'sweet-potatoes')),
    ('frutas', ('fruits', 'fruit-based', 'fresh-fruits', 'dried-fruits', 'canned-fruits')),
    ('vegetais', ('vegetables', 'vegetable-based', 'canned-vegetables', 'frozen-vegetables')),
    ('graos', ('cereals', 'rices', 'flours', 'cereals-and-potatoes', 'cereal-grains')),
]


def normalizar(texto):
    t = unicodedata.normalize('NFD', texto.lower())
    return re.sub(r'[^a-z0-9 ]+', ' ', ''.join(c for c in t if unicodedata.category(c) != 'Mn')).strip()


def numero(x):
    x = (x or '').strip()
    if not x:
        return None
    try:
        v = float(x)
    except ValueError:
        return None
    return v if v == v and abs(v) < 1e9 else None


def categoria(tags):
    base = [t.split(':', 1)[-1] for t in tags.split(',') if t]
    for nome, palavras in REGRAS:
        for t in base:
            if t in palavras:
                return nome
    return 'processados'


def avaliar(linha, ix):
    """Devolve (item, motivo_de_descarte)."""
    nome = (linha[ix['product_name']] or '').strip()
    if len(nome) < 3 or len(nome) > 70:
        return None, 'nome'
    if '�' in nome or any(0x80 <= ord(ch) < 0xA0 for ch in nome) or not re.fullmatch(r'\d{4,14}', linha[ix['code']].strip()) or re.search(r'[<>{}\[\]\\|]|https?:|www\.', nome) or nome.isdigit():
        return None, 'nome'
    kcal = numero(linha[ix['energy-kcal_100g']])
    kj = numero(linha[ix['energy_100g']])
    if kcal is None and kj is not None:
        kcal = kj / 4.184
    g = numero(linha[ix['fat_100g']])
    c = numero(linha[ix['carbohydrates_100g']])
    p = numero(linha[ix['proteins_100g']])
    if None in (kcal, g, c, p):
        return None, 'sem_macros'
    f = numero(linha[ix['fiber_100g']])
    if f is None:
        f = 0.0
    if not (0 <= kcal <= 905) or any(not (0 <= v <= 100) for v in (g, c, p)) or not (0 <= f <= 100):
        return None, 'impossivel'
    if p + c + g > 100.5 or f > c + 0.5 and f > 5:
        return None, 'impossivel'
    estimado = 4 * p + 4 * c + 9 * g
    if abs(kcal - estimado) / max(kcal, estimado, 30) > 0.25:
        return None, 'atwater'
    if kj is not None and kj > 0 and abs(kj - 4.184 * kcal) / max(kj, 30) > 0.35 and numero(linha[ix['energy-kcal_100g']]) is not None:
        return None, 'kj_kcal'
    marca = (linha[ix['brands']] or '').split(',')[0].strip()
    if marca and normalizar(marca) not in normalizar(nome) and len(nome) + len(marca) + 3 <= 78:
        nome = f'{nome} ({marca})'
    porcao = numero(linha[ix['serving_quantity']])
    if porcao is None or not (5 <= porcao <= 500):
        porcao = 100
    cats = linha[ix['categories_tags']] or ''
    return {
        'codigo': linha[ix['code']].strip(), 'nome': nome, 'cat': categoria(cats),
        'kcal': round(kcal), 'p': round(p, 1), 'c': round(c, 1), 'g': round(g, 1), 'f': round(f, 1),
        'porcao': int(round(porcao)),
    }, None


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--entrada', required=True)
    ap.add_argument('--saida', default='../../src/data/alimentosEstendidos.json')
    ap.add_argument('--limite-linhas', type=int, default=0, help='só para testar')
    a = ap.parse_args()

    heaps = collections.defaultdict(list)    # sigla -> heap de (score, contador, item, pais)
    descartes = collections.Counter()
    lidas = 0
    contador = 0
    inicio = time.time()
    with gzip.open(a.entrada, 'rt', encoding='utf-8', newline='') as f:
        leitor = csv.reader(f, delimiter='\t')
        cab = next(leitor)
        precisa = ['code', 'product_name', 'brands', 'countries_tags', 'categories_tags', 'serving_quantity',
                   'energy-kcal_100g', 'energy_100g', 'fat_100g', 'carbohydrates_100g', 'fiber_100g',
                   'proteins_100g', 'unique_scans_n', 'completeness']
        ix = {c: cab.index(c) for c in precisa}
        maior = max(ix.values())
        for linha in leitor:
            lidas += 1
            if a.limite_linhas and lidas > a.limite_linhas:
                break
            if lidas % 250000 == 0:
                print(f'  {lidas:,} linhas, {time.time() - inicio:.0f}s', file=sys.stderr, flush=True)
            if len(linha) <= maior:
                descartes['linha_curta'] += 1
                continue
            item, motivo = avaliar(linha, ix)
            if motivo:
                descartes[motivo] += 1
                continue
            paises = [t for t in (linha[ix['countries_tags']] or '').split(',') if t]
            sigla, vagas = 'ZZ', VAGAS_OUTROS
            for t in paises:
                if t in COTAS:
                    sigla, vagas = COTAS[t]
                    break
            scans = numero(linha[ix['unique_scans_n']]) or 0
            compl = numero(linha[ix['completeness']]) or 0
            score = (scans, compl)
            contador += 1
            h = heaps[sigla]
            entrada = (score, -contador, item, sigla)
            capacidade = int(vagas * FOLGA)
            if len(h) < capacidade:
                heapq.heappush(h, entrada)
            elif score > h[0][0]:
                heapq.heapreplace(h, entrada)

    # escolhe, tira duplicados (mesmo nome e mesmos números) e respeita as vagas
    itens = []
    vistos = set()
    por_pais = collections.Counter()
    todas_vagas = {s: v for s, v in COTAS.values()}
    todas_vagas['ZZ'] = VAGAS_OUTROS
    for sigla, h in heaps.items():
        for score, _, item, s in sorted(h, reverse=True):
            if por_pais[s] >= todas_vagas[s]:
                break
            chave = (normalizar(item['nome']), item['kcal'], item['p'], item['c'], item['g'])
            if chave in vistos:
                descartes['duplicado'] += 1
                continue
            vistos.add(chave)
            por_pais[s] += 1
            itens.append([
                'O' + item['codigo'], item['cat'], item['kcal'], item['p'], item['c'], item['g'], item['f'],
                item['porcao'], item['nome'], s,
            ])
    itens.sort(key=lambda x: (x[9], x[8].lower()))
    saida = {
        'versao': 1,
        'gerado': time.strftime('%Y-%m-%d'),
        'campos': ['id', 'categoria', 'kcal', 'proteina', 'carboidrato', 'gordura', 'fibra', 'porcaoG', 'nome', 'pais'],
        'unidade': 'valores por 100 g; porcaoG = porção sugerida em gramas; nome na língua do produto; pais = sigla (ZZ = outros)',
        'fonte': 'Contains information from Open Food Facts (openfoodfacts.org), made available under the Open Database License (ODbL 1.0).',
        'licenca': 'ODbL-1.0',
        'estatisticas': {'total': len(itens), 'por_pais': dict(por_pais.most_common()), 'linhas_lidas': lidas, 'descartes': dict(descartes.most_common())},
        'itens': itens,
    }
    caminho = a.saida
    with open(caminho, 'w', encoding='utf-8') as out:
        out.write('{')
        chaves = [k for k in saida if k != 'itens']
        for k in chaves:
            out.write(json.dumps(k) + ':' + json.dumps(saida[k], ensure_ascii=False, separators=(',', ':')) + ',\n')
        out.write('"itens":[\n')
        out.write(',\n'.join(json.dumps(i, ensure_ascii=False, separators=(',', ':')) for i in itens))
        out.write('\n]}\n')
    print(json.dumps(saida['estatisticas'], ensure_ascii=False, indent=1))
    print(f'{len(itens)} itens gravados em {caminho} ({time.time() - inicio:.0f}s)')


if __name__ == '__main__':
    principal()
