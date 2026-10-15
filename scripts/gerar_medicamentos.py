"""
Gera src/constants/medicamentos.ts com os nomes usados nas sugestões de medicação.

Fontes (dados públicos oficiais):
- PT-BR: ANVISA — Dados abertos de medicamentos registrados
  https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv
  (apenas registros com situação "Ativo")
- EN:    FDA — Drugs@FDA (Products.txt + MarketingStatus.txt)
  https://www.fda.gov/media/89850/download
  (apenas produtos com venda sob prescrição ou isenta — não descontinuados)

Uso:  python scripts/gerar_medicamentos.py <anvisa.csv> <drugsatfda.zip>
"""
import csv
import html
import io
import json
import os
import re
import sys
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'src', 'constants', 'medicamentos.ts')

# Palavras que ficam minúsculas no meio do nome
MINUSCULAS = {'de', 'da', 'do', 'das', 'dos', 'e', 'com', 'em', 'para', 'a', 'o', 'and', 'with', 'of', 'in', 'for'}
# Sais/formas removidos para gerar o nome base ("cloridrato de metformina" -> "metformina")
SAIS = re.compile(
    r'^(cloridrato|dicloridrato|bromidrato|sulfato|fosfato|maleato|fumarato|succinato|tartarato|besilato|'
    r'mesilato|acetato|citrato|valerato|propionato|dipropionato|furoato|nitrato|cloreto|brometo|butilbrometo|'
    r'carbonato|bicarbonato|gluconato|lactato|oxalato|hemifumarato|hiclato|tosilato|xinafoato|monoidratado|'
    r'di-hidratado|sódico|sodico|potássico|potassico|cálcico|calcico)\s+(de\s+)?', re.I)


# Sais em inglês removidos do fim ("metformin hydrochloride" -> "metformin")
SAIS_EN = re.compile(
    r'\s+(hydrochloride|hcl|hydrobromide|sodium|potassium|calcium|magnesium|phosphate|sulfate|maleate|'
    r'fumarate|succinate|tartrate|besylate|mesylate|acetate|citrate|valerate|propionate|dipropionate|'
    r'furoate|nitrate|chloride|bromide|carbonate|gluconate|lactate|oxalate|hyclate|tosylate|monohydrate|'
    r'dihydrate|trihydrate|anhydrous)(\s+(hydrochloride|sodium|monohydrate|dihydrate|anhydrous))*$', re.I)


def titulo(nome: str) -> str:
    """'GLIFAGE XR 500' -> 'Glifage XR 500'; mantém siglas curtas em maiúsculas."""
    palavras = []
    for i, p in enumerate(nome.split()):
        baixa = p.lower()
        if i > 0 and baixa in MINUSCULAS:
            palavras.append(baixa)
        elif re.fullmatch(r'[A-Z]{1,3}\d*', p) and baixa not in MINUSCULAS and len(p) <= 3:
            palavras.append(p)  # XR, HCT, D3, B12...
        else:
            palavras.append(p[:1].upper() + p[1:].lower())
    return ' '.join(palavras)


def limpar(texto: str) -> str:
    return re.sub(r'\s+', ' ', html.unescape(texto or '')).strip(' .;,')


def principio_formatado(p: str) -> str:
    p = limpar(p).lower()
    return p[:1].upper() + p[1:] if p else p


def base_do_principio(p: str) -> str:
    sem_sal = SAIS.sub('', p.lower()).strip()
    return sem_sal[:1].upper() + sem_sal[1:] if sem_sal else ''


def gerar_pt(caminho_csv):
    raw = open(caminho_csv, 'rb').read()
    texto = raw.decode('cp1252', errors='replace')
    itens = {}  # nome normalizado -> (nome, principio)
    for l in csv.DictReader(io.StringIO(texto), delimiter=';'):
        if l['SITUACAO_REGISTRO'] != 'Ativo':
            continue
        principios = [principio_formatado(x) for x in re.split(r'[+,]', l['PRINCIPIO_ATIVO']) if limpar(x)]
        principio_txt = ' + '.join(dict.fromkeys(principios))
        for p in principios:
            itens.setdefault(p.lower(), (p, ''))
            base = base_do_principio(p)
            if base and len(base) > 3:
                itens.setdefault(base.lower(), (base, ''))
        marca = titulo(limpar(l['NOME_PRODUTO']))
        if marca and marca.lower() not in itens:
            itens[marca.lower()] = (marca, principio_txt)
    return sorted(itens.values(), key=lambda x: x[0].lower())


def gerar_en(caminho_zip):
    z = zipfile.ZipFile(caminho_zip)
    ler = lambda nome: list(csv.DictReader(io.StringIO(z.read(nome).decode('latin-1')), delimiter='\t'))
    ativos = {(m['ApplNo'], m['ProductNo']) for m in ler('MarketingStatus.txt') if m['MarketingStatusID'] in ('1', '2')}
    itens = {}
    for p in ler('Products.txt'):
        if (p['ApplNo'], p['ProductNo']) not in ativos:
            continue
        principios = [limpar(x).lower() for x in p['ActiveIngredient'].split(';') if limpar(x)]
        for pr in principios:
            nome = pr[:1].upper() + pr[1:]
            itens.setdefault(nome.lower(), (nome, ''))
            base = SAIS_EN.sub('', pr).strip()
            if base and base != pr and len(base) > 3:
                itens.setdefault(base.lower(), (base[:1].upper() + base[1:], ''))
        marca = titulo(limpar(p['DrugName']))
        if marca and marca.lower() not in itens:
            itens[marca.lower()] = (marca, ' + '.join(dict.fromkeys(principios)))
    return sorted(itens.values(), key=lambda x: x[0].lower())


def serializar(lista):
    # [nome] ou [nome, principio] — formato compacto para não pesar no app
    return ',\n'.join('  ' + json.dumps([n, p] if p else [n], ensure_ascii=False) for n, p in lista)


pt = gerar_pt(sys.argv[1])
en = gerar_en(sys.argv[2])
with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
    f.write('// ARQUIVO GERADO por scripts/gerar_medicamentos.py — não edite à mão.\n')
    f.write('// PT: ANVISA, dados abertos (registros ativos). EN: FDA Drugs@FDA (produtos não descontinuados).\n')
    f.write('// Cada item: [nome] para princípio ativo ou [marca, princípio(s) ativo(s)].\n\n')
    f.write('export type ItemMedicamento = [string] | [string, string];\n\n')
    f.write(f'export const MEDICAMENTOS_PT: ItemMedicamento[] = [\n{serializar(pt)},\n];\n\n')
    f.write(f'export const MEDICAMENTOS_EN: ItemMedicamento[] = [\n{serializar(en)},\n];\n')
print(f'PT: {len(pt)} nomes · EN: {len(en)} nomes · {os.path.getsize(SAIDA) // 1024} KB')
