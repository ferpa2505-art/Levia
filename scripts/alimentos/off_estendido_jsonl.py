#!/usr/bin/env python3
"""Amplia o banco ESTENDIDO a partir do export JSONL do Open Food Facts, SEM tirar nenhum item atual.

    python off_estendido_jsonl.py --entrada openfoodfacts-products.jsonl.gz \
        [--base ../../public/dados/alimentosEstendidos.json] [--saida ../../public/dados/alimentosEstendidos.json]

- Mantém todos os itens do arquivo base e só acrescenta produtos novos (código ainda não presente e sem
  duplicar nome + valores). As cotas abaixo são o TOTAL final por país, contando os itens que já existiam.
- Lê os valores do campo antigo `nutriments` e, quando ele vem vazio, do campo novo `nutrition`
  (o Open Food Facts mudou o formato). No campo novo só aceita valores do rótulo, não estimativas.
- Usa os mesmos filtros de qualidade de off_estendido.py (nome, faixa dos valores, Atwater, kJ x kcal).

Licença dos dados: Open Database License (ODbL 1.0). O arquivo derivado continua ODbL e separado do banco curado.
O export bruto (≈13 GB) NÃO entra no Git.
"""
import argparse
import collections
import gzip
import heapq
import json
import re
import sys
import time

from off_estendido import categoria, normalizar

# país (tag do Open Food Facts) -> (sigla, TOTAL final de vagas, já contando os itens atuais)
COTAS = {
    'en:brazil': ('BR', 20000), 'en:portugal': ('PT', 13000), 'en:spain': ('ES', 15000), 'en:italy': ('IT', 15000),
    'en:france': ('FR', 20000), 'en:united-kingdom': ('GB', 15000), 'en:germany': ('DE', 10000),
    'en:malta': ('MT', 1300),
    'en:united-states': ('US', 5000), 'en:mexico': ('MX', 3000), 'en:argentina': ('AR', 1500),
    'en:chile': ('CL', 1000), 'en:colombia': ('CO', 800),
}
VAGAS_OUTROS = 2000
FOLGA = 1.6
UNIDADE_G = {'g': 1.0, 'mg': 0.001, 'µg': 1e-6, 'mcg': 1e-6}


def num(x):
    if x is None or x == '':
        return None
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if v == v and abs(v) < 1e9 else None


def nutrientes(d):
    """Valores por 100 g como vendido: campo antigo, ou o novo só com valores do rótulo."""
    n = d.get('nutriments') or {}
    if 'fat_100g' in n and 'carbohydrates_100g' in n and 'proteins_100g' in n:
        r = {k: num(n.get(k + '_100g')) for k in ('energy-kcal', 'energy', 'fat', 'carbohydrates', 'proteins', 'fiber')}
        r['kcal_informada'] = r['energy-kcal'] is not None
        return r, 'antigo'
    nut = d.get('nutrition') or {}
    for cj in [nut.get('aggregated_set')] + list(nut.get('input_sets') or []):
        if not isinstance(cj, dict) or cj.get('preparation', 'as_sold') != 'as_sold' or cj.get('per') not in (None, '100g'):
            continue
        nn = cj.get('nutrients') or {}

        def valor(nome):
            v = nn.get(nome)
            if not isinstance(v, dict) or v.get('source') == 'estimate':
                return None
            x = num(v.get('value'))
            if x is None:
                return None
            u = (v.get('unit') or '').lower()
            if nome == 'energy-kcal':
                return x if u in ('kcal', '') else (x / 4.184 if u == 'kj' else None)
            if nome == 'energy':
                return x if u in ('kj', '') else (x * 4.184 if u == 'kcal' else None)
            return x * UNIDADE_G[u] if u in UNIDADE_G else (x if u == '' else None)

        r = {k: valor(k) for k in ('energy-kcal', 'energy', 'fat', 'carbohydrates', 'proteins', 'fiber')}
        if None not in (r['fat'], r['carbohydrates'], r['proteins']):
            r['kcal_informada'] = r['energy-kcal'] is not None
            return r, 'novo'
    return None, 'nenhum'


def avaliar(d):
    """Mesmas regras de off_estendido.avaliar, lendo o JSONL. Devolve (item, motivo_de_descarte, origem)."""
    nome = (d.get('product_name') or '').strip()
    codigo = str(d.get('code') or '').strip()
    if len(nome) < 3 or len(nome) > 70:
        return None, 'nome', None
    if '�' in nome or any(0x80 <= ord(ch) < 0xA0 for ch in nome) or not re.fullmatch(r'\d{4,14}', codigo) \
            or re.search(r'[<>{}\[\]\\|]|https?:|www\.', nome) or nome.isdigit():
        return None, 'nome', None
    n, origem = nutrientes(d)
    if not n:
        return None, 'sem_macros', origem
    kcal, kj = n['energy-kcal'], n['energy']
    if kcal is None and kj is not None:
        kcal = kj / 4.184
    g, c, p = n['fat'], n['carbohydrates'], n['proteins']
    if None in (kcal, g, c, p):
        return None, 'sem_macros', origem
    f = n['fiber'] if n['fiber'] is not None else 0.0
    if not (0 <= kcal <= 905) or any(not (0 <= v <= 100) for v in (g, c, p)) or not (0 <= f <= 100):
        return None, 'impossivel', origem
    if p + c + g > 100.5 or f > c + 0.5 and f > 5:
        return None, 'impossivel', origem
    estimado = 4 * p + 4 * c + 9 * g
    if abs(kcal - estimado) / max(kcal, estimado, 30) > 0.25:
        return None, 'atwater', origem
    if kj is not None and kj > 0 and abs(kj - 4.184 * kcal) / max(kj, 30) > 0.35 and n['kcal_informada']:
        return None, 'kj_kcal', origem
    marca = str(d.get('brands') or '').split(',')[0].strip()
    if marca and normalizar(marca) not in normalizar(nome) and len(nome) + len(marca) + 3 <= 78:
        nome = f'{nome} ({marca})'
    # confere de novo com os valores ARREDONDADOS, que são os gravados (kcal inteira, macros com 1 casa):
    # em produtos de poucas calorias o arredondamento sozinho podia passar do limite de Atwater
    kr, pr, cr, gr = round(kcal), round(p, 1), round(c, 1), round(g, 1)
    estimado_r = 4 * pr + 4 * cr + 9 * gr
    if abs(kr - estimado_r) / max(kr, estimado_r, 30) > 0.25 or pr + cr + gr > 100.5:
        return None, 'atwater', origem
    porcao = num(d.get('serving_quantity'))
    if porcao is None or not (5 <= porcao <= 500):
        porcao = 100
    cats = ','.join(d.get('categories_tags') or [])
    return {
        'codigo': codigo, 'nome': nome, 'cat': categoria(cats),
        'kcal': round(kcal), 'p': round(p, 1), 'c': round(c, 1), 'g': round(g, 1), 'f': round(f, 1),
        'porcao': int(round(porcao)),
    }, None, origem


def chave_duplicado(nome, kcal, p, c, g):
    return (normalizar(nome), kcal, p, c, g)


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--entrada', required=True)
    ap.add_argument('--base', default='../../public/dados/alimentosEstendidos.json')
    ap.add_argument('--saida', default='../../public/dados/alimentosEstendidos.json')
    ap.add_argument('--limite-linhas', type=int, default=0, help='só para testar')
    a = ap.parse_args()

    with open(a.base, encoding='utf-8') as arq:
        base = json.load(arq)
    itens = list(base['itens'])
    codigos = {i[0] for i in itens}
    vistos = {chave_duplicado(i[8], i[2], i[3], i[4], i[5]) for i in itens}
    na_base = collections.Counter(i[9] for i in itens)

    todas_vagas = {s: v for s, v in COTAS.values()}
    todas_vagas['ZZ'] = VAGAS_OUTROS
    livres = {s: max(0, v - na_base.get(s, 0)) for s, v in todas_vagas.items()}

    heaps = collections.defaultdict(list)
    descartes = collections.Counter()
    origens = collections.Counter()
    lidas = contador = 0
    inicio = time.time()
    with gzip.open(a.entrada, 'rt', encoding='utf-8') as f:
        for linha in f:
            lidas += 1
            if a.limite_linhas and lidas > a.limite_linhas:
                break
            if lidas % 500000 == 0:
                print(f'  {lidas:,} linhas, {time.time() - inicio:.0f}s', file=sys.stderr, flush=True)
            try:
                d = json.loads(linha)
            except ValueError:
                descartes['json'] += 1
                continue
            item, motivo, origem = avaliar(d)
            if origem:
                origens[origem] += 1
            if motivo:
                descartes[motivo] += 1
                continue
            if 'O' + item['codigo'] in codigos:
                descartes['ja_existe'] += 1
                continue
            sigla = 'ZZ'
            for t in d.get('countries_tags') or []:
                if t in COTAS:
                    sigla = COTAS[t][0]
                    break
            if livres.get(sigla, 0) <= 0:
                continue
            score = (num(d.get('unique_scans_n')) or 0, num(d.get('completeness')) or 0)
            contador += 1
            h = heaps[sigla]
            entrada = (score, -contador, item)
            capacidade = int(livres[sigla] * FOLGA)
            if len(h) < capacidade:
                heapq.heappush(h, entrada)
            elif score > h[0][0]:
                heapq.heapreplace(h, entrada)

    novos = collections.Counter()
    for sigla, h in heaps.items():
        for _score, _, item in sorted(h, reverse=True):
            if novos[sigla] >= livres[sigla]:
                break
            chave = chave_duplicado(item['nome'], item['kcal'], item['p'], item['c'], item['g'])
            if chave in vistos or 'O' + item['codigo'] in codigos:
                descartes['duplicado'] += 1
                continue
            vistos.add(chave)
            codigos.add('O' + item['codigo'])
            novos[sigla] += 1
            itens.append(['O' + item['codigo'], item['cat'], item['kcal'], item['p'], item['c'], item['g'], item['f'],
                          item['porcao'], item['nome'], sigla])

    itens.sort(key=lambda x: (x[9], x[8].lower()))
    por_pais = collections.Counter(i[9] for i in itens)
    estatisticas = {
        'total': len(itens), 'mantidos_da_versao_anterior': len(base['itens']), 'novos': sum(novos.values()),
        'por_pais': dict(por_pais.most_common()), 'novos_por_pais': dict(novos.most_common()),
        'linhas_lidas': lidas, 'origem_dos_valores': dict(origens), 'descartes': dict(descartes.most_common()),
    }
    saida = {
        'versao': 2,
        'gerado': time.strftime('%Y-%m-%d'),
        'campos': base['campos'],
        'unidade': base['unidade'],
        'fonte': base['fonte'],
        'licenca': base['licenca'],
        'estatisticas': estatisticas,
        'itens': itens,
    }
    with open(a.saida, 'w', encoding='utf-8') as out:
        out.write('{')
        for k in [k for k in saida if k != 'itens']:
            out.write(json.dumps(k) + ':' + json.dumps(saida[k], ensure_ascii=False, separators=(',', ':')) + ',\n')
        out.write('"itens":[\n')
        out.write(',\n'.join(json.dumps(i, ensure_ascii=False, separators=(',', ':')) for i in itens))
        out.write('\n]}\n')
    print(json.dumps(estatisticas, ensure_ascii=False, indent=1))
    print(f'{len(itens)} itens gravados em {a.saida} ({time.time() - inicio:.0f}s)')


if __name__ == '__main__':
    principal()
