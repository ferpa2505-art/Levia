#!/usr/bin/env python3
"""Monta o banco global de alimentos do Levia (5 idiomas) a partir das fontes
abertas e das traduções revisadas em trans/*.tsv. Saída: out/alimentosGlobais.json
"""
import csv, glob, json, math, re, collections, os

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)
os.makedirs('out', exist_ok=True)

def num(v):
    if v is None: return None
    v = str(v).strip().replace(',', '.')
    if v in ('', 'NA', 'Tr', '-', 'traces', 'nan'): return None
    v = v.replace('<', '')
    try:
        x = float(v)
        return None if math.isnan(x) else x
    except ValueError:
        return None

# ---------------------------------------------------------------- nutrientes
nutr = {}   # id -> dict(kcal,p,c,f,fib, src, grp)
for x in csv.DictReader(open('taco_composicao.csv', encoding='utf-8')):
    nutr['T' + x['numero_alimento']] = dict(
        kcal=num(x['energia_kcal']), p=num(x['proteina_g']), c=num(x['carboidrato_g']),
        f=num(x['lipideos_g']), fib=num(x['fibra_g']), src='TACO', grp=x['categoria'])
for x in csv.DictReader(open('calnut0.csv', encoding='utf-8')):
    if x['HYPOTH'] != 'MB': continue
    nutr['C' + x['alim_code']] = dict(
        kcal=num(x['nrj_kcal']), p=num(x['proteines_g']), c=num(x['glucides_g']),
        f=num(x['lipides_g']), fib=num(x['fibres_g']), src='CIQUAL', grp=x['alim_grp_nom_fr'],
        sgrp=x['alim_ssgrp_nom_fr'])
tempo_names = {}
for x in csv.DictReader(open('tempo/package/data/tempolife-foods.csv', encoding='utf-8')):
    pre = 'U' if x['source'] == 'usda_sr_legacy' else 'E'
    nutr[pre + x['id']] = dict(
        kcal=num(x['calories']), p=num(x['protein']), c=num(x['carbs']), f=num(x['fat']),
        fib=num(x['fiber']), src='USDA' if pre == 'U' else 'TempoLife', grp=x['category'])
    tempo_names[pre + x['id']] = x['name']

# TACO sem valores na fonte -> equivalente de outra tabela aberta
FALLBACK = {'T458': 'U15815', 'T457': 'C19050', 'T450': 'T451'}
for a, b in FALLBACK.items():
    nutr[a] = dict(nutr[b], src=nutr[a]['src'], grp=nutr[a]['grp'])
# óleos na TACO: proteína/carbo vazios = 0
for k, v in nutr.items():
    if v['kcal'] is not None:
        for q in ('p', 'c', 'f', 'fib'):
            if v[q] is None: v[q] = 0.0

# ---------------------------------------------------------------- traduções
LANGS = ['pt', 'en', 'es', 'fr', 'it']
trans = collections.OrderedDict()
order_files = ['taco_00', 'taco_01', 'tempo_00'] + [f'calnut_{i:02d}' for i in range(6)] + [f'usda_{i:02d}' for i in range(8)]
for fn in order_files:
    for ln in open(f'trans/{fn}.tsv', encoding='utf-8'):
        ln = ln.rstrip('\n')
        if not ln.strip(): continue
        p = ln.split('|')
        assert len(p) == 6, ln
        if p[1].strip() == '-': continue
        trans[p[0]] = [s.strip() for s in p[1:]]

def limpa(n):
    return re.sub(r'\s*\((variante)\)', '', n).strip()

CONDENSADA = ['(lata, concentrada)', '(canned, condensed)', '(lata, concentrada)', '(conserve, concentrée)', '(in scatola, concentrata)']

# ---------------------------------------------------------------- categorias
CATS = {
 'graos':      ['Cereais e grãos', 'Grains & cereals', 'Cereales y granos', 'Céréales et grains', 'Cereali e granaglie'],
 'paes':       ['Pães e padaria', 'Breads & bakery', 'Panes y bollería', 'Pains et boulangerie', 'Pane e prodotti da forno'],
 'massas':     ['Massas', 'Pasta & noodles', 'Pastas y fideos', 'Pâtes et nouilles', 'Pasta e noodles'],
 'frutas':     ['Frutas', 'Fruits', 'Frutas', 'Fruits', 'Frutta'],
 'vegetais':   ['Verduras e legumes', 'Vegetables', 'Verduras y hortalizas', 'Légumes', 'Verdure e ortaggi'],
 'tuberculos': ['Batatas e raízes', 'Potatoes & tubers', 'Patatas y tubérculos', 'Pommes de terre et tubercules', 'Patate e tuberi'],
 'leguminosas':['Leguminosas', 'Legumes & beans', 'Legumbres', 'Légumineuses', 'Legumi'],
 'carnes':     ['Carnes', 'Meat', 'Carnes', 'Viandes', 'Carne'],
 'aves':       ['Aves', 'Poultry', 'Aves', 'Volailles', 'Pollame'],
 'embutidos':  ['Frios e embutidos', 'Deli meats & sausages', 'Embutidos y fiambres', 'Charcuterie', 'Salumi e insaccati'],
 'peixes':     ['Peixes e frutos do mar', 'Fish & seafood', 'Pescados y mariscos', 'Poissons et fruits de mer', 'Pesce e frutti di mare'],
 'ovos':       ['Ovos', 'Eggs', 'Huevos', 'Œufs', 'Uova'],
 'laticinios': ['Leite e iogurtes', 'Milk & yogurt', 'Leche y yogures', 'Lait et yaourts', 'Latte e yogurt'],
 'queijos':    ['Queijos', 'Cheese', 'Quesos', 'Fromages', 'Formaggi'],
 'oleaginosas':['Castanhas e sementes', 'Nuts & seeds', 'Frutos secos y semillas', 'Fruits à coque et graines', 'Frutta secca e semi'],
 'gorduras':   ['Óleos e gorduras', 'Oils & fats', 'Aceites y grasas', 'Huiles et matières grasses', 'Oli e grassi'],
 'doces':      ['Doces e sobremesas', 'Sweets & desserts', 'Dulces y postres', 'Sucreries et desserts', 'Dolci e dessert'],
 'bebidas':    ['Bebidas', 'Drinks', 'Bebidas', 'Boissons', 'Bevande'],
 'alcoolicas': ['Bebidas alcoólicas', 'Alcoholic drinks', 'Bebidas alcohólicas', 'Boissons alcoolisées', 'Bevande alcoliche'],
 'molhos':     ['Molhos e temperos', 'Sauces & seasonings', 'Salsas y condimentos', 'Sauces et condiments', 'Salse e condimenti'],
 'snacks':     ['Salgadinhos e snacks', 'Snacks', 'Snacks y aperitivos', 'Snacks et apéritifs', 'Snack e stuzzichini'],
 'pratos':     ['Pratos prontos', 'Prepared dishes', 'Platos preparados', 'Plats cuisinés', 'Piatti pronti'],
 'sopas':      ['Sopas e caldos', 'Soups & broths', 'Sopas y caldos', 'Soupes et bouillons', 'Zuppe e brodi'],
 'fastfood':   ['Fast-food e restaurante', 'Fast food & restaurant', 'Comida rápida y restaurante', 'Fast-food et restaurant', 'Fast food e ristorante'],
 'cafe_manha': ['Café da manhã', 'Breakfast', 'Desayuno', 'Petit-déjeuner', 'Colazione'],
 'suplementos':['Suplementos', 'Supplements', 'Suplementos', 'Compléments', 'Integratori'],
 'combinacoes':['Pratos montados', 'Plate combos', 'Platos combinados', 'Assiettes composées', 'Piatti combinati'],
}

def kw(en, *words):
    e = en.lower()
    return any(re.search(r'\b' + w.replace('\x08', r'\b'), e) for w in words)

def categoria(id_, en, info):
    g = info.get('grp', '') or ''
    sg = info.get('sgrp', '') or ''
    e = en.lower()
    if kw(en, 'fast food', 'restaurant', 'drive') or '(fast food)' in e: return 'fastfood'
    if kw(en, 'soup', 'broth', 'bouillon', 'stock', 'chowder', 'bisque', 'consomm', 'gazpacho', 'minestrone', 'vichyssoise', 'borscht', 'solyanka', 'harira', 'chorba', 'stew\b') and not kw(en, 'cube', 'powder', 'mix', 'dashi'): return 'sopas'
    if kw(en, 'bouillon cube', 'stock cube', 'bouillon, dehydrated', 'broth cubes'): return 'molhos'
    if kw(en, 'protein powder', 'whey', 'protein isolate', 'meal replacement', 'supplement', 'shake mix', 'instant breakfast'): return 'suplementos'
    if kw(en, 'wine', 'beer', 'lager', 'vodka', 'whisk', 'rum\b', 'gin\b', 'cognac', 'brandy', 'liqueur', 'cocktail', 'sangria', 'sake', 'cider', 'champagne', 'pastis', 'vermouth', 'daiquiri', 'piña colada', 'tequila', 'cachaça', 'kir\b', 'irish coffee', 'cassis', 'eau-de-vie', 'spirit') and not kw(en, 'non-alcoholic', 'mocktail', 'vinegar', 'used in cooking', 'cooking') and 'sans alcool' not in e: return 'alcoolicas'
    if id_[0] == 'T':
        M = {'Carnes e derivados': 'carnes', 'Verduras, hortaliças e derivados': 'vegetais', 'Frutas e derivados': 'frutas',
             'Cereais e derivados': 'graos', 'Pescados e frutos do mar': 'peixes', 'Alimentos preparados': 'pratos',
             'Leguminosas e derivados': 'leguminosas', 'Leite e derivados': 'laticinios', 'Produtos açucarados': 'doces',
             'Gorduras e óleos': 'gorduras', 'Bebidas (alcoólicas e não alcoólicas)': 'bebidas', 'Nozes e sementes': 'oleaginosas',
             'Miscelâneas': 'molhos', 'Ovos e derivados': 'ovos', 'Outros alimentos industrializados': 'molhos'}
        c = M.get(g, 'pratos')
    elif id_[0] == 'C':
        if g.startswith('viandes'):
            c = 'peixes' if ('poisson' in sg or 'mollusques' in sg or 'mer' in sg) else ('ovos' if 'œufs' in sg else ('embutidos' if 'charcut' in sg else 'carnes'))
        elif g.startswith('fruits, légumes'):
            c = {'légumes': 'vegetais', 'fruits': 'frutas', 'légumineuses': 'leguminosas', 'pommes de terre et autres tubercules': 'tuberculos',
                 'fruits à coque et graines oléagineuses': 'oleaginosas'}.get(sg, 'vegetais')
        elif g.startswith('produits sucrés'): c = 'doces'
        elif g.startswith('produits laitiers'): c = 'queijos' if 'fromage' in sg else ('doces' if 'desserts' in sg else 'laticinios')
        elif g.startswith('eaux'): c = 'bebidas'
        elif g.startswith('entrées'): c = 'sopas' if 'soupe' in sg else 'pratos'
        elif g.startswith('aides culinaires'): c = 'molhos'
        elif g.startswith('produits céréaliers'):
            c = 'paes' if ('pain' in sg or 'biscottes' in sg) else ('massas' if 'pâtes' in sg and 'riz' in sg and kw(en, 'pasta', 'noodle', 'gnocchi', 'vermicelli') else ('doces' if 'viennoiseries' in sg or 'gâteaux' in sg or 'biscuits sucrés' in sg else ('snacks' if 'apéritif' in sg else ('cafe_manha' if 'petit-déjeuner' in sg else 'graos'))))
        elif g.startswith('matières grasses'): c = 'gorduras'
        elif g.startswith('glaces'): c = 'doces'
        else: c = 'pratos'
    else:
        M = {'Liha ja linnuliha': 'carnes', 'Köögivili': 'vegetais', 'Leivad ja pagarittooted': 'paes', 'Valmistoidud': 'pratos',
             'Puuviljad ja marjad': 'frutas', 'Magustoidud ja küpsetised': 'doces', 'Joogid': 'bebidas', 'Piimatooted': 'laticinios',
             'Kaunviljad': 'leguminosas', 'Kala ja mereannid': 'peixes', 'Rasvad ja õlid': 'gorduras', 'Hommikusöögid': 'cafe_manha',
             'Teravili ja pasta': 'graos', 'Pähklid ja seemned': 'oleaginosas', 'Supid': 'sopas', 'Snäkid ja suupisted': 'snacks',
             'Kartulid ja mugulad': 'tuberculos', 'Kastmed ja maitsed': 'molhos', 'Eesti toidud': 'pratos', 'Vürtsid ja maitseained': 'molhos',
             'Munad': 'ovos', 'Salatid': 'pratos'}
        c = M.get(g, 'pratos')
    # refinamentos por palavra-chave (nome em inglês)
    if c in ('carnes', 'pratos') and kw(en, 'chicken', 'turkey', 'duck', 'goose', 'quail', 'capon', 'pheasant', 'pigeon', 'guinea fowl', 'cornish hen') and not kw(en, 'soup', 'pie', 'salad', 'burger', 'sandwich', 'nugget', 'pizza', 'curry', 'tagine', 'stroganoff', 'parmigiana', 'cordon', 'rice', 'with ', 'basque', 'coq au vin', 'skewer', 'yakitori', 'paupiette', 'tenders', 'patty'): c = 'aves'
    if c in ('carnes', 'aves') and kw(en, 'sausage', 'salami', 'ham\b', 'bologna', 'mortadella', 'frankfurter', 'hot dog', 'bacon', 'pastrami', 'pepperoni', 'chorizo', 'kielbasa', 'bratwurst', 'liverwurst', 'pâté', 'pate\b', 'rillettes', 'terrine', 'luncheon', 'deli', 'corned beef', 'prosciutto', 'pancetta', 'coppa', 'lardons', 'knackwurst', 'jerky', 'cervelat', 'andouille', 'pudding', 'head cheese', 'aspic', 'foie gras'): c = 'embutidos'
    if c == 'laticinios' and kw(en, 'cheese', 'mozzarella', 'ricotta', 'parmesan', 'cheddar', 'brie', 'camembert', 'gouda', 'feta', 'provolone', 'mascarpone', 'emmental', 'gruyère', 'quark', 'requeijão', 'queso', 'petit-suisse', 'cotija', 'limburger', 'tilsit', 'gjetost', 'fontina', 'pecorino', 'muenster', 'neufchâtel', 'colby', 'monterey') and not kw(en, 'cheesecake', 'sauce'): c = 'queijos'
    if c in ('graos', 'pratos', 'paes') and kw(en, 'pasta', 'noodle', 'spaghetti', 'macaroni', 'lasagna pasta', 'gnocchi', 'vermicelli', 'soba', 'somen', 'wonton wrappers', 'ramen') and not kw(en, 'salad', 'sauce', 'bolognese', 'carbonara', 'soup', 'with ', 'cheese', 'bake'): c = 'massas'
    if c in ('graos', 'pratos') and kw(en, 'bread', 'roll\b', 'bun\b', 'bagel', 'baguette', 'croissant', 'toast', 'pita', 'naan', 'chapati', 'tortilla', 'crispbread', 'rusks', 'breadsticks', 'matzo', 'brioche', 'muffin') and not kw(en, 'pudding', 'french toast', 'garlic bread', 'chips', 'crumbs', 'stuffing'): c = 'paes'
    if c in ('vegetais',) and kw(en, 'potato', 'cassava', 'yam\b', 'taro', 'arracacha', 'sweet potato', 'plantain', 'jerusalem artichoke', 'yautia', 'jicama'): c = 'tuberculos'
    if c in ('pratos', 'graos', 'doces', 'laticinios') and kw(en, 'cereal', 'granola', 'muesli', 'oatmeal', 'porridge', 'pancake', 'waffle', 'overnight oats', 'açaí bowl', 'smoothie bowl', 'parfait', 'cream of wheat', 'corn flakes', 'puffed', 'grits', 'farina', 'chia pudding', 'baked oats') and not kw(en, 'cookie', 'bar\b', 'bread', 'flour'): c = 'cafe_manha'
    if c in ('doces', 'graos', 'pratos', 'paes') and kw(en, 'chips', 'crackers?', 'pretzel', 'popcorn', 'puffs', 'rice cake', 'corn cakes', 'trail mix', 'pork rinds', 'corn nuts', 'sesame sticks', 'pita chips', 'snack') and not kw(en, 'chocolate chip', 'graham', 'cookie'): c = 'snacks'
    if c in ('bebidas', 'laticinios') and kw(en, 'milk', 'yogurt', 'kefir', 'buttermilk', 'lassi', 'cream\b') and not kw(en, 'almond', 'oat milk', 'rice milk', 'soy', 'coconut', 'shake', 'cocoa', 'chocolate drink'): c = 'laticinios'
    if c == 'laticinios' and kw(en, 'ice cream', 'frozen yogurt', 'sorbet', 'sherbet', 'pudding', 'dessert', 'custard', 'mousse', 'flan', 'tiramisu', 'panna cotta', 'cheesecake', 'crème brûlée', 'rice pudding', 'cake', 'profiterole', 'floating island', 'french toast', 'dulce de leche', 'liégeois', 'condensed milk'): c = 'doces'
    if c in ('graos', 'pratos', 'molhos', 'doces', 'snacks') and kw(en, 'sauce', 'dressing', 'mayonnaise', 'ketchup', 'mustard', 'vinegar', 'gravy', 'salsa\b', 'pesto', 'relish', 'harissa', 'wasabi', 'seasoning', 'spice', 'pepper\b', 'paprika', 'cumin', 'cinnamon', 'herbes', 'tapenade', 'aioli', 'tzatziki', 'sofrito', 'hummus', 'dip\b', 'guacamole') and not kw(en, 'pasta with', 'spaghetti', 'fish', 'chicken', 'beef', 'pork', 'shrimp', 'in tomato sauce', 'in sauce', 'with meat', 'ravioli', 'meatballs', 'chocolate sauce', 'caramel sauce'): c = 'molhos'
    if kw(en, 'hummus', 'guacamole', 'baba ganoush', 'eggplant dip', 'bean dip', 'tapenade', 'taramasalata'): c = 'molhos'
    if (c in ('graos', 'pratos', 'bebidas', 'snacks') or (c == 'paes' and not kw(en, 'bread', 'roll', 'bun', 'bagel', 'pita', 'tortilla', 'english muffin', 'toast', 'naan', 'chapati', 'paratha', 'croissant', 'biscuit', 'taco', 'tostada', 'crust', 'phyllo', 'wonton', 'puff pastry', 'focaccia', 'garlic', 'french toast', 'hush'))) and kw(en, 'cookie', 'biscuit', 'cake', 'pie\b', 'tart\b', 'candy', 'chocolate', 'brownie', 'doughnut', 'pastry', 'danish', 'sweet', 'jam', 'jelly', 'marmalade', 'sugar', 'honey', 'syrup', 'fudge', 'toffee', 'caramel', 'gum\b', 'marshmallow', 'nougat', 'macaron', 'meringue', 'wafer', 'madeleine', 'éclair', 'strudel', 'muffin', 'crumble') and not kw(en, 'pot pie', 'chicken', 'beef', 'fish', 'potato', 'rice cake', 'crab', 'corn cakes', 'drink', 'milk', 'shake', 'soda', 'cocoa', 'meat', 'cheese crackers', 'cracker', 'biscuit .fast', 'buttermilk biscuit', 'sweet potato', 'sweet corn', 'sweetened', 'sweet pepper', 'sweet onion', 'sweet and sour', 'sweet soy'): c = 'doces'
    if c == 'doces' and kw(en, 'chips', 'pretzels?$', 'popcorn$', 'crackers') and not kw(en, 'chocolate', 'caramel'): c = 'snacks'
    if c in ('pratos', 'graos') and kw(en, 'oil\b', 'butter$', 'lard', 'tallow', 'margarine', 'ghee', 'fat\b') and not kw(en, 'peanut butter', 'almond butter', 'chicken', 'with', 'fried'): c = 'gorduras'
    if c == 'oleaginosas' and kw(en, 'oil\b'): c = 'gorduras'
    if not kw(en, 'sauce', 'dough', 'crust') and kw(en, 'nugget', 'patty', 'burger', 'hamburger', 'hot dog', 'cheeseburger', 'pizza', 'taco', 'burrito', 'quesadilla', 'enchilada', 'lasagna', 'sandwich', 'panini', 'wrap\b', 'falafel') and c in ('carnes', 'aves', 'peixes', 'graos', 'paes', 'snacks', 'molhos', 'laticinios', 'queijos', 'leguminosas', 'massas', 'embutidos'): c = 'pratos'
    if c in ('bebidas',) and kw(en, 'syrup') and not kw(en, 'diluted'): c = 'doces'
    return c

# porção sugerida (g) por categoria
PORCAO = {'graos': 100, 'paes': 50, 'massas': 150, 'frutas': 130, 'vegetais': 80, 'tuberculos': 150, 'leguminosas': 100,
          'carnes': 120, 'aves': 120, 'embutidos': 30, 'peixes': 120, 'ovos': 50, 'laticinios': 200, 'queijos': 30,
          'oleaginosas': 30, 'gorduras': 10, 'doces': 50, 'bebidas': 250, 'alcoolicas': 150, 'molhos': 20, 'snacks': 30,
          'pratos': 250, 'sopas': 300, 'fastfood': 150, 'cafe_manha': 150, 'suplementos': 30, 'combinacoes': 350}

def porcao(cat, en, kcal):
    e = en.lower()
    if cat == 'gorduras' and kw(en, 'butter', 'margarine', 'spread'): return 10
    if cat == 'molhos' and kw(en, 'salt', 'pepper', 'spice', 'cinnamon', 'paprika', 'cumin', 'curry', 'nutmeg', 'clove', 'saffron', 'oregano', 'thyme', 'basil', 'dill', 'mint', 'rosemary', 'sage', 'parsley', 'tarragon', 'coriander', 'chervil', 'herbes', 'seasoning', 'bay leaf', 'ginger', 'garlic', 'yeast', 'baking powder', 'gelatin'): return 5
    if cat == 'molhos' and kw(en, 'hummus', 'guacamole', 'dip', 'tzatziki'): return 40
    if cat == 'bebidas' and kw(en, 'powder', 'instant coffee powder', 'ground roasted coffee'): return 10
    if cat == 'bebidas' and kw(en, 'espresso', 'ristretto', 'cortado', 'macchiato'): return 40
    if cat == 'laticinios' and kw(en, 'powder', 'dried'): return 30
    if cat == 'laticinios' and kw(en, 'yogurt', 'petit', 'fromage blanc', 'quark', 'skyr', 'kefir'): return 150
    if cat == 'laticinios' and kw(en, 'cream\b', 'crème fraîche', 'half and half', 'sour cream', 'creamer', 'condensed'): return 30
    if cat == 'alcoolicas' and kw(en, 'beer', 'cider', 'lager'): return 330
    if cat == 'alcoolicas' and kw(en, 'vodka', 'whisk', 'rum', 'gin', 'cognac', 'brandy', 'liqueur', 'pastis', 'cachaça', 'spirit', 'eau-de-vie', 'tequila'): return 40
    if cat == 'doces' and kw(en, 'ice cream', 'sorbet', 'frozen yogurt', 'sherbet'): return 100
    if cat == 'doces' and kw(en, 'ice pop', 'juice bars', 'italian ice'): return 70
    if cat == 'doces' and kw(en, 'sugar', 'honey', 'syrup', 'jam', 'jelly', 'marmalade', 'sweetener', 'sprinkles', 'molasses'): return 15
    if cat == 'doces' and kw(en, 'candy', 'gum', 'chocolate', 'caramel', 'toffee', 'marshmallow', 'fudge', 'truffle'): return 25
    if cat == 'doces' and kw(en, 'pudding', 'mousse', 'custard', 'flan', 'panna cotta', 'tiramisu', 'crème'): return 120
    if cat == 'doces' and kw(en, 'cake', 'pie\b', 'tart\b', 'cheesecake'): return 100
    if cat == 'doces' and kw(en, 'cookie', 'biscuit', 'wafer'): return 30
    if cat in ('tuberculos', 'leguminosas', 'oleaginosas') and kw(en, 'flour', 'starch', 'powder'): return 40
    if cat == 'graos' and kw(en, 'raw', 'dry', 'flour', 'starch', 'bran', 'germ'): return 40
    if cat == 'graos' and kw(en, 'cooked', 'boiled'): return 150
    if cat == 'leguminosas' and kw(en, 'raw', 'dry', 'flour', 'powder'): return 40
    if cat == 'frutas' and kw(en, 'dried', 'raisins', 'prunes', 'dates', 'candied', 'goji', 'chips'): return 30
    if cat == 'frutas' and kw(en, 'juice', 'nectar'): return 200
    if cat == 'frutas' and kw(en, 'lemon zest', 'peel'): return 5
    if cat == 'vegetais' and kw(en, 'dried', 'paste', 'powder', 'flakes'): return 15
    if cat == 'vegetais' and kw(en, 'juice'): return 200
    if cat == 'embutidos' and kw(en, 'sausage', 'frankfurter', 'hot dog', 'chorizo', 'kielbasa', 'bratwurst', 'knackwurst', 'merguez', 'chipolata', 'andouille', 'blood', 'pudding', 'confit'): return 80
    if cat == 'molhos' and kw(en, 'bouillon', 'cube'): return 5
    if cat == 'carnes' and kw(en, 'liver', 'tongue', 'heart', 'kidney', 'tripe'): return 100
    if cat == 'ovos': return 100 if kw(en, 'omelette', 'scrambled', 'eggs', 'benedict', 'tortilla', 'salad') else 50
    if cat == 'paes' and kw(en, 'bagel', 'naan', 'pita'): return 80
    if cat == 'paes' and kw(en, 'tortilla', 'wrap', 'toast', 'rusk', 'crispbread', 'cracker'): return 30
    if cat == 'pratos' and kw(en, 'pizza'): return 200
    if cat == 'pratos' and kw(en, 'sandwich', 'burger', 'hamburger', 'cheeseburger', 'panini', 'croissant', 'puff pastry', 'samosa', 'spring roll', 'egg roll', 'taquitos', 'coxinha', 'pastel', 'kibbeh', 'croquette', 'fritter', 'falafel', 'nuggets', 'dim sum'): return 120
    return PORCAO[cat]

def r1(x):
    return None if x is None else round(x + 1e-9, 1)

# ---------------------------------------------------------------- itens base
itens = []
vistos = set()
descartados = collections.Counter()
for id_, names in trans.items():
    info = nutr.get(id_)
    if not info or info['kcal'] is None:
        descartados['sem_nutriente'] += 1; continue
    names = [limpa(n) for n in names]
    src_name = tempo_names.get(id_, '')
    if 'condensed' in src_name.lower():
        names = [f'{n} {s}' for n, s in zip(names, CONDENSADA)]
    chave = names[0].lower()
    if chave in vistos:
        descartados['nome_duplicado'] += 1; continue
    vistos.add(chave)
    cat = categoria(id_, names[1], info)
    itens.append(dict(id=id_, cat=cat, kcal=round(info['kcal']), p=r1(info['p']), c=r1(info['c']), f=r1(info['f']),
                      fib=r1(info['fib']), porcao=porcao(cat, names[1], info['kcal']), nomes=names, fonte=info['src']))

byid = {x['id']: x for x in itens}
# itens usados nas combinações precisam existir (mesmo se descartados como duplicados)
def comp(id_):
    if id_ in byid: return byid[id_]
    info = nutr[id_]
    return dict(kcal=info['kcal'], p=info['p'], c=info['c'], f=info['f'], fib=info['fib'] or 0)

# ---------------------------------------------------------------- combinações
def soma(partes):
    tot = dict(kcal=0, p=0, c=0, f=0, fib=0); g = 0
    for id_, gramas in partes:
        x = comp(id_)
        for q in tot: tot[q] += (x[q] or 0) * gramas / 100
        g += gramas
    return {q: v * 100 / g for q, v in tot.items()}, g

def junta(lst, lang):
    e = {'pt': ' e ', 'en': ' and ', 'es': ' y ', 'fr': ' et ', 'it': ' e '}[lang]
    lst = [s for s in lst if s]
    if len(lst) == 1: return lst[0]
    return ', '.join(lst[:-1]) + e + lst[-1]

def cap(s): return s[:1].upper() + s[1:]

CARBOS = [
 ('T3', 150, ['arroz branco', 'white rice', 'arroz blanco', 'riz blanc', 'riso bianco']),
 ('T1', 150, ['arroz integral', 'brown rice', 'arroz integral', 'riz complet', 'riso integrale']),
 ('C9811', 150, ['macarrão', 'pasta', 'pasta', 'pâtes', 'pasta']),
 ('C4047', 150, ['purê de batata', 'mashed potatoes', 'puré de patatas', 'purée de pommes de terre', 'purè di patate']),
 ('C4003', 150, ['batata cozida', 'boiled potatoes', 'patatas cocidas', 'pommes de terre vapeur', 'patate lesse']),
 ('T88', 150, ['batata-doce', 'sweet potato', 'boniato', 'patate douce', 'patata dolce']),
 ('T129', 150, ['mandioca cozida', 'boiled cassava', 'yuca cocida', 'manioc cuit', 'manioca lessa']),
 ('C9341', 150, ['quinoa', 'quinoa', 'quinoa', 'quinoa', 'quinoa']),
 ('T533', 150, ['cuscuz de milho', 'corn couscous', 'cuscús de maíz', 'couscous de maïs', 'cuscus di mais']),
]
PROTS = [
 ('T410', 120, ['frango grelhado', 'grilled chicken', 'pollo a la plancha', 'poulet grillé', 'pollo alla griglia']),
 ('T377', 120, ['carne magra grelhada', 'grilled lean beef', 'ternera magra a la plancha', 'bœuf maigre grillé', 'manzo magro alla griglia']),
 ('T346', 120, ['bife de contrafilé', 'sirloin steak', 'filete de lomo bajo', 'faux-filet', 'controfiletto']),
 ('T326', 120, ['carne moída', 'ground beef', 'carne picada', 'bœuf haché', 'carne macinata']),
 ('T490', 100, ['ovo frito', 'fried egg', 'huevo frito', 'œuf au plat', 'uovo fritto']),
 ('T488', 100, ['ovo cozido', 'boiled egg', 'huevo duro', 'œuf dur', 'uovo sodo']),
 ('U18593', 120, ['tilápia', 'tilapia', 'tilapia', 'tilapia', 'tilapia']),
 ('T317', 120, ['salmão grelhado', 'grilled salmon', 'salmón a la plancha', 'saumon grillé', 'salmone alla griglia']),
 ('T401', 120, ['frango à milanesa', 'breaded chicken', 'pollo empanado', 'poulet pané', 'cotoletta di pollo']),
 ('T429', 120, ['bisteca suína', 'pork chop', 'chuleta de cerdo', 'côte de porc', 'braciola di maiale']),
 ('T420', 100, ['linguiça de frango', 'chicken sausage', 'salchicha de pollo', 'saucisse de poulet', 'salsiccia di pollo']),
 ('U15963', 120, ['tofu', 'tofu', 'tofu', 'tofu', 'tofu']),
 ('T396', 120, ['coxa de frango assada', 'roast chicken leg', 'muslo de pollo asado', 'cuisse de poulet rôtie', 'coscia di pollo arrosto']),
 ('T280', 120, ['bacalhau', 'salt cod', 'bacalao', 'morue', 'baccalà']),
]
ACOMP = [
 (None, 0, None),
 ('T561', 100, ['feijão carioca', 'pinto beans', 'frijoles pintos', 'haricots pinto', 'fagioli borlotti']),
 ('T567', 100, ['feijão preto', 'black beans', 'frijoles negros', 'haricots noirs', 'fagioli neri']),
 ('SALADA', 80, ['salada', 'salad', 'ensalada', 'salade', 'insalata']),
 ('T546', 100, ['legumes no vapor', 'steamed vegetables', 'verduras al vapor', 'légumes vapeur', 'verdure al vapore']),
 ('T577', 100, ['lentilha', 'lentils', 'lentejas', 'lentilles', 'lenticchie']),
]
COM = {'pt': ' com ', 'en': ' with ', 'es': ' con ', 'fr': ' avec ', 'it': ' con '}

combos = []
def add_combo(cid, partes, nomes, cat='combinacoes'):
    v, g = soma(partes)
    combos.append(dict(id=cid, cat=cat, kcal=round(v['kcal']), p=r1(v['p']), c=r1(v['c']), f=r1(v['f']), fib=r1(v['fib']),
                       porcao=int(g), nomes=[cap(n) for n in nomes], fonte='Levia (calculado)'))

for ci, (cid, cg, cn) in enumerate(CARBOS):
    for pi, (pid, pg, pn) in enumerate(PROTS):
        for ai, (aid, ag, an) in enumerate(ACOMP):
            partes = [(cid, cg), (pid, pg)]
            if aid == 'SALADA': partes += [('T78', 40), ('T157', 40)]
            elif aid: partes.append((aid, ag))
            nomes = []
            for li, lang in enumerate(LANGS):
                if aid is None: nomes.append(cn[li] + COM[lang] + pn[li])
                else: nomes.append(junta([cn[li], an[li], pn[li]] if aid not in ('SALADA', 'T546') else [cn[li], pn[li], an[li]], lang))
            add_combo(f'P{ci}{pi:02d}{ai}', partes, nomes)

PAES = [
 ('T53', 50, ['pão francês', 'French roll', 'pan francés', 'petit pain', 'panino francese']),
 ('T52', 50, ['pão integral', 'whole wheat bread', 'pan integral', 'pain complet', 'pane integrale']),
 ('C7258', 90, ['bagel', 'bagel', 'bagel', 'bagel', 'bagel']),
 ('T533', 120, ['cuscuz', 'corn couscous', 'cuscús de maíz', 'couscous de maïs', 'cuscus di mais']),
 ('E1931', 60, ['wrap', 'wrap', 'wrap', 'wrap', 'piadina']),
 ('T63', 30, ['torrada', 'toast', 'tostada', 'pain grillé', 'pane tostato']),
]
RECHEIOS = [
 ([('T461', 30)], ['queijo branco', 'fresh cheese', 'queso fresco', 'fromage frais', 'formaggio fresco']),
 ([('T468', 20)], ['requeijão', 'cream cheese', 'queso crema', 'fromage à tartiner', 'formaggio spalmabile']),
 ([('C22502', 100)], ['ovos mexidos', 'scrambled eggs', 'huevos revueltos', 'œufs brouillés', 'uova strapazzate']),
 ([('T439', 20), ('T463', 20)], ['presunto e queijo', 'ham and cheese', 'jamón y queso', 'jambon et fromage', 'prosciutto e formaggio']),
 ([('T262', 10)], ['manteiga', 'butter', 'mantequilla', 'beurre', 'burro']),
 ([('C15202', 20)], ['pasta de amendoim', 'peanut butter', 'crema de cacahuete', 'beurre de cacahuète', 'burro di arachidi']),
 ([('C28964', 30)], ['peito de peru', 'turkey breast', 'pechuga de pavo', 'blanc de dinde', 'fesa di tacchino']),
 ([('C25621', 30)], ['homus', 'hummus', 'hummus', 'houmous', 'hummus']),
 ([('T163', 50)], ['abacate', 'avocado', 'aguacate', 'avocat', 'avocado']),
 ([('C31024', 20)], ['geleia de morango', 'strawberry jam', 'mermelada de fresa', 'confiture de fraise', 'confettura di fragole']),
]
for bi, (bid, bg, bn) in enumerate(PAES):
    for ri, (rpartes, rn) in enumerate(RECHEIOS):
        add_combo(f'B{bi}{ri}', [(bid, bg)] + rpartes, [bn[li] + COM[l] + rn[li] for li, l in enumerate(LANGS)], 'cafe_manha')

FRUTAS = [
 ('T179', 100, ['banana', 'banana', 'plátano', 'banane', 'banana']),
 ('T239', 100, ['morango', 'strawberry', 'fresa', 'fraise', 'fragola']),
 ('T226', 100, ['mamão', 'papaya', 'papaya', 'papaye', 'papaya']),
 ('T228', 100, ['manga', 'mango', 'mango', 'mangue', 'mango']),
 ('T168', 100, ['açaí', 'açaí', 'açaí', 'açaí', 'açaí']),
 ('T163', 80, ['abacate', 'avocado', 'aguacate', 'avocat', 'avocado']),
 ('C13997', 100, ['frutas vermelhas', 'mixed berries', 'frutos rojos', 'fruits rouges', 'frutti rossi']),
]
BASES = [
 ('T458', 200, ['leite integral', 'whole milk', 'leche entera', 'lait entier', 'latte intero']),
 ('C19050', 200, ['leite desnatado', 'skim milk', 'leche desnatada', 'lait écrémé', 'latte scremato']),
 ('T448', 170, ['iogurte natural', 'plain yogurt', 'yogur natural', 'yaourt nature', 'yogurt bianco']),
 ('U18248', 200, ['bebida de amêndoas', 'almond milk', 'bebida de almendras', "lait d'amande", 'latte di mandorla']),
]
VIT = ['Vitamina de {f}' + COM['pt'] + '{b}', '{F} smoothie' + COM['en'] + '{b}', 'Batido de {f}' + COM['es'] + '{b}', 'Smoothie {f}' + COM['fr'] + '{b}', 'Frullato di {f}' + COM['it'] + '{b}']
AVEIA = [' e aveia', ' and oats', ' y avena', " et flocons d'avoine", ' e avena']
for fi, (fid, fg, fn) in enumerate(FRUTAS):
    for bi, (bid, bg, bn) in enumerate(BASES):
        for av in (0, 1):
            partes = [(fid, fg), (bid, bg)] + ([('T7', 15)] if av else [])
            nomes = []
            for li, l in enumerate(LANGS):
                f_ = fn[li]
                if l == 'fr': f_ = {'banane': 'à la banane', 'fraise': 'à la fraise', 'papaye': 'à la papaye', 'mangue': 'à la mangue', 'açaí': "à l'açaí", 'avocat': "à l'avocat", 'fruits rouges': 'aux fruits rouges'}[f_]
                if l == 'it' and f_ == 'frutti rossi': f_ = 'frutti rossi'
                s = VIT[li].format(f=f_, F=cap(f_), b=bn[li]) + (AVEIA[li] if av else '')
                nomes.append(s)
            add_combo(f'V{fi}{bi}{av}', partes, nomes, 'bebidas')

SAL_PROT = [
 ('T410', 100, ['frango grelhado', 'grilled chicken', 'pollo a la plancha', 'poulet grillé', 'pollo alla griglia']),
 ('C26039', 80, ['atum', 'tuna', 'atún', 'thon', 'tonno']),
 ('T488', 100, ['ovo cozido', 'boiled egg', 'huevo duro', 'œuf dur', 'uovo sodo']),
 ('C20532', 100, ['grão-de-bico', 'chickpeas', 'garbanzos', 'pois chiches', 'ceci']),
 ('T461', 50, ['queijo branco', 'fresh cheese', 'queso fresco', 'fromage frais', 'formaggio fresco']),
 ('T317', 100, ['salmão grelhado', 'grilled salmon', 'salmón a la plancha', 'saumon grillé', 'salmone alla griglia']),
 ('U15963', 100, ['tofu', 'tofu', 'tofu', 'tofu', 'tofu']),
]
MOLHOS = [
 (None, 0, None),
 ('T260', 10, ['azeite', 'olive oil', 'aceite de oliva', "huile d'olive", "olio d'oliva"]),
 ('C11166', 30, ['molho de iogurte', 'yogurt dressing', 'salsa de yogur', 'sauce au yaourt', 'salsa allo yogurt']),
 ('C11110', 15, ['vinagrete', 'vinaigrette', 'vinagreta', 'vinaigrette', 'vinaigrette']),
]
SAL = ['Salada verde', 'Green salad', 'Ensalada verde', 'Salade verte', 'Insalata verde']
for si, (sid, sg, sn) in enumerate(SAL_PROT):
    for mi, (mid, mg, mn) in enumerate(MOLHOS):
        partes = [('T78', 60), ('T157', 60), ('T110', 30), (sid, sg)] + ([(mid, mg)] if mid else [])
        nomes = []
        for li, l in enumerate(LANGS):
            s = SAL[li] + COM[l] + sn[li]
            if mid: s += {'pt': ' e ', 'en': ' and ', 'es': ' y ', 'fr': ' et ', 'it': ' e '}[l] + mn[li]
            nomes.append(s)
        add_combo(f'S{si}{mi}', partes, nomes, 'combinacoes')

SANDS = [
 ('T53', 50, ['Sanduíche de pão francês', 'French roll sandwich', 'Bocadillo de pan francés', 'Sandwich au petit pain', 'Panino francese']),
 ('T52', 50, ['Sanduíche de pão integral', 'Whole wheat sandwich', 'Sándwich de pan integral', 'Sandwich au pain complet', 'Tramezzino integrale']),
 ('E1931', 60, ['Wrap', 'Wrap', 'Wrap', 'Wrap', 'Piadina']),
 ('C7259', 60, ['Lanche no pão de hambúrguer', 'Bun sandwich', 'Bocadillo en pan de hamburguesa', 'Sandwich en pain burger', 'Panino tipo burger']),
]
SFILL = [
 ([('T408', 80), ('T78', 15), ('T157', 20)], ['frango', 'chicken', 'pollo', 'poulet', 'pollo']),
 ([('C26039', 60), ('C11079', 10), ('T78', 15)], ['atum', 'tuna', 'atún', 'thon', 'tonno']),
 ([('C28964', 40), ('T463', 20)], ['peito de peru e queijo', 'turkey and cheese', 'pavo y queso', 'dinde et fromage', 'tacchino e formaggio']),
 ([('T490', 50), ('T463', 20)], ['ovo e queijo', 'egg and cheese', 'huevo y queso', 'œuf et fromage', 'uovo e formaggio']),
 ([('T417', 100), ('T463', 20), ('T78', 15), ('T157', 20)], ['hambúrguer e queijo', 'beef patty and cheese', 'hamburguesa y queso', 'steak haché et fromage', 'hamburger e formaggio']),
 ([('T463', 40)], ['queijo quente', 'grilled cheese', 'queso fundido', 'fromage fondu', 'formaggio fuso']),
 ([('T439', 30), ('T463', 30)], ['presunto e queijo', 'ham and cheese', 'jamón y queso', 'jambon-fromage', 'prosciutto e formaggio']),
 ([('U15963', 80), ('T78', 15), ('T157', 20), ('T110', 15)], ['tofu e salada', 'tofu and salad', 'tofu y ensalada', 'tofu et crudités', 'tofu e insalata']),
]
DE = {'pt': ' com ', 'en': ' with ', 'es': ' de ', 'fr': ' ', 'it': ' con '}
for bi, (bid, bg, bn) in enumerate(SANDS):
    for fi, (fp, fn) in enumerate(SFILL):
        nomes = []
        for li, l in enumerate(LANGS):
            if l == 'fr': nomes.append(bn[li] + ' ' + {'poulet': 'au poulet', 'thon': 'au thon', 'dinde et fromage': 'dinde-fromage', 'œuf et fromage': 'œuf-fromage', 'steak haché et fromage': 'steak haché-fromage', 'fromage fondu': 'au fromage fondu', 'jambon-fromage': 'jambon-fromage', 'tofu et crudités': 'tofu-crudités'}[fn[li]])
            elif l == 'pt' and bn[li] == 'Wrap': nomes.append('Wrap de ' + fn[li])
            elif l == 'pt' and fn[li] == 'queijo quente': nomes.append(bn[li].replace('Sanduíche', 'Queijo quente').replace('Lanche', 'Queijo quente'))
            elif l == 'es' and bn[li] == 'Wrap': nomes.append('Wrap de ' + fn[li])
            else: nomes.append(bn[li] + DE[l] + fn[li])
        add_combo(f'W{bi}{fi}', [(bid, bg)] + fp, nomes, 'pratos')

todos = itens + combos
# checagens
nomes_vistos = {l: set() for l in LANGS}
for x in todos:
    assert all(x['nomes']) and len(x['nomes']) == 5, x
    assert x['kcal'] is not None and x['kcal'] >= 0, x
    for q in ('p', 'c', 'f'):
        assert x[q] is not None and 0 <= x[q] <= 100.5, (x, q)
    assert x['kcal'] <= 905, x
    assert x['cat'] in CATS, x
# coerência energia (Atwater) para sinalizar erros grosseiros
suspeitos = []
for x in todos:
    est = 4 * x['p'] + 4 * x['c'] + 9 * x['f']
    if x['kcal'] > 40 and (est < 0.5 * x['kcal'] or est > 1.6 * x['kcal']) and x['cat'] not in ('alcoolicas',):
        suspeitos.append((x['id'], x['nomes'][0], x['kcal'], round(est)))

print('itens base', len(itens), 'combinações', len(combos), 'total', len(todos))
print('descartados', dict(descartados))
print('por categoria', collections.Counter(x['cat'] for x in todos).most_common())
print('por fonte', collections.Counter(x['fonte'] for x in todos))
print('suspeitos Atwater', len(suspeitos), suspeitos[:40])

ORDEM_FONTE = {'TACO': 0, 'Levia (calculado)': 1, 'CIQUAL': 2, 'TempoLife': 3, 'USDA': 4}
todos.sort(key=lambda x: ORDEM_FONTE[x['fonte']])
saida = {
  'versao': 1,
  'gerado': '2026-10-06',
  'idiomas': LANGS,
  'campos': ['id', 'categoria', 'kcal', 'proteina', 'carboidrato', 'gordura', 'fibra', 'porcaoG', 'pt', 'en', 'es', 'fr', 'it'],
  'unidade': 'valores por 100 g; porcaoG = porção sugerida em gramas',
  'categorias': {k: v for k, v in CATS.items()},
  'fontes': {
    'T': 'TACO 4ª ed. (NEPA/UNICAMP, 2011) via github.com/brolesi/taco (MIT)',
    'C': 'ANSES-CIQUAL / CALNUT 2020 — Licence Ouverte Etalab 2.0',
    'U': 'USDA FoodData Central SR Legacy (domínio público) via tempo-food-db',
    'E': 'TempoLife Food Dataset (CC-BY-4.0) — "Food nutrition data from TempoLife (tempolife.app), CC-BY-4.0."',
    'P/B/V/S/W': 'Combinações calculadas pelo Levia a partir dos itens acima (soma ponderada por gramas)'
  },
  'itens': [[x['id'], x['cat'], x['kcal'], x['p'], x['c'], x['f'], x['fib'] if x['fib'] is not None else 0, x['porcao']] + x['nomes'] for x in todos],
}
json.dump(saida, open('out/alimentosGlobais.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
with open('out/alimentosGlobais_revisao.csv', 'w', encoding='utf-8-sig', newline='') as fh:
    w = csv.writer(fh, delimiter=';')
    w.writerow(['id', 'categoria', 'fonte', 'kcal_100g', 'proteina_100g', 'carboidrato_100g', 'gordura_100g', 'fibra_100g', 'porcao_g', 'kcal_porcao', 'proteina_porcao', 'PT-BR', 'EN', 'ES', 'FR', 'IT'])
    for x in todos:
        w.writerow([x['id'], x['cat'], x['fonte'], x['kcal'], x['p'], x['c'], x['f'], x['fib'], x['porcao'], round(x['kcal'] * x['porcao'] / 100), round(x['p'] * x['porcao'] / 100, 1)] + x['nomes'])
print('json bytes', os.path.getsize('out/alimentosGlobais.json'))
