#!/usr/bin/env python3
"""Pratos prontos que faltavam no banco curado (brasileiros e do mundo), em 5 idiomas.

Gera `src/data/alimentosPratos.json` no MESMO formato de linha do banco principal (ids com prefixo D).
Os valores são ESTIMATIVAS do Levia para a receita típica (por 100 g, prato pronto), no estilo dos pratos
montados "P/B/V/S/W": proteína, carboidrato, gordura e fibra são informados e a kcal é calculada
(Atwater 4/4/9), então nunca há incoerência. Não vêm de nenhuma base de terceiros.

    python3 pratos_extras.py [--saida ../../src/data/alimentosPratos.json]
"""
import argparse
import json

# (pt, en, es, fr, it, proteína, carboidrato, gordura, fibra, porçãoG, categoria)
PRATOS = [
    ('Moqueca de peixe', 'Brazilian fish stew (moqueca)', 'Moqueca de pescado', 'Moqueca de poisson', 'Moqueca di pesce', 11, 3, 7, 0.5, 200, 'pratos'),
    ('Bobó de camarão', 'Shrimp and cassava cream (bobó)', 'Bobó de camarón', 'Bobó de crevettes', 'Bobó di gamberi', 7, 9, 9, 1, 200, 'pratos'),
    ('Feijão tropeiro', 'Tropeiro beans', 'Frijoles tropeiro', 'Haricots tropeiro', 'Fagioli tropeiro', 8, 17, 9, 5, 150, 'pratos'),
    ('Tutu de feijão', 'Mashed bean tutu', 'Tutu de frijoles', 'Tutu de haricots', 'Tutu di fagioli', 5, 12, 4, 4, 120, 'pratos'),
    ('Galinhada', 'Brazilian chicken and rice', 'Arroz con pollo brasileño (galinhada)', 'Riz au poulet brésilien (galinhada)', 'Riso con pollo brasiliano (galinhada)', 9, 17, 5, 1, 250, 'pratos'),
    ('Carne de sol com macaxeira', 'Sun-dried beef with cassava', 'Carne de sol con yuca', 'Viande séchée au manioc', 'Carne secca con manioca', 20, 12, 9, 2, 250, 'pratos'),
    ('Esfiha de carne', 'Beef sfiha', 'Esfiha de carne', 'Sfiha à la viande', 'Sfiha di carne', 9, 30, 9, 1.5, 80, 'snacks'),
    ('Empadão de frango', 'Chicken pot pie (empadão)', 'Pastel de pollo (empadão)', 'Tourte au poulet (empadão)', 'Torta di pollo (empadão)', 8, 22, 12, 1, 150, 'pratos'),
    ('Brigadeiro', 'Brigadeiro (chocolate fudge ball)', 'Brigadeiro (bombón de chocolate)', 'Brigadeiro (bonbon au chocolat)', 'Brigadeiro (pallina di cioccolato)', 4, 62, 14, 1, 20, 'doces'),
    ('Beijinho de coco', 'Coconut beijinho', 'Beijinho de coco', 'Beijinho à la noix de coco', 'Beijinho al cocco', 3, 58, 14, 2, 20, 'doces'),
    ('Romeu e Julieta (queijo com goiabada)', 'Cheese with guava paste', 'Queso con dulce de guayaba', 'Fromage à la pâte de goyave', 'Formaggio con pasta di guava', 8, 38, 10, 1, 80, 'doces'),
    ('Pão de mel', 'Honey cake with chocolate', 'Pan de miel con chocolate', 'Pain de miel au chocolat', 'Pan di miele al cioccolato', 5, 62, 8, 1, 50, 'doces'),
    ('Curau de milho', 'Sweet corn custard (curau)', 'Curau de maíz', 'Crème de maïs sucrée (curau)', 'Crema di mais dolce (curau)', 3, 25, 4, 1, 120, 'doces'),
    ('Sonho recheado', 'Filled doughnut', 'Dónut relleno', 'Beignet fourré', 'Bombolone ripieno', 6, 45, 15, 1.5, 90, 'doces'),
    ('Caldo verde', 'Portuguese green soup (caldo verde)', 'Caldo verde portugués', 'Soupe verte portugaise', 'Zuppa verde portoghese', 3, 7, 4, 1.5, 250, 'sopas'),
    ('Frango a passarinho', 'Fried chicken pieces', 'Pollo frito en trozos', 'Poulet frit en morceaux', 'Pollo fritto a pezzetti', 22, 5, 14, 0.5, 120, 'aves'),
    ('Arroz de forno', 'Baked rice casserole', 'Arroz al horno', 'Riz gratiné au four', 'Riso al forno', 7, 20, 8, 1, 200, 'pratos'),
    ('Macarronada à bolonhesa', 'Spaghetti bolognese', 'Espagueti a la boloñesa', 'Spaghetti bolognaise', 'Spaghetti alla bolognese', 7, 20, 5, 1.5, 300, 'massas'),
    ('Misto quente', 'Ham and cheese toastie', 'Sándwich mixto caliente', 'Croque jambon-fromage', 'Toast prosciutto e formaggio', 12, 30, 12, 1.5, 120, 'fastfood'),
    ('X-burger (hambúrguer com queijo)', 'Cheeseburger', 'Hamburguesa con queso', 'Cheeseburger', 'Cheeseburger', 14, 24, 14, 1, 200, 'fastfood'),
    ('Pão na chapa com manteiga', 'Buttered grilled bread', 'Pan a la plancha con mantequilla', 'Pain grillé au beurre', 'Pane tostato al burro', 8, 45, 8, 2, 60, 'paes'),
    ('Salpicão de frango', 'Chicken salpicão salad', 'Ensalada salpicão de pollo', 'Salade salpicão au poulet', 'Insalata salpicão di pollo', 8, 8, 9, 1.5, 150, 'pratos'),
    ('Maionese de batata', 'Potato salad with mayonnaise', 'Ensalada de patata con mayonesa', 'Salade de pommes de terre à la mayonnaise', 'Insalata di patate con maionese', 2, 12, 8, 1.5, 120, 'pratos'),
    ('Vinagrete', 'Brazilian vinaigrette salsa', 'Vinagreta brasileña', 'Vinaigrette brésilienne', 'Vinaigrette brasiliana', 1, 5, 3, 1.5, 50, 'molhos'),
    ('Pirão de peixe', 'Fish and cassava porridge (pirão)', 'Pirón de pescado', 'Bouillie de manioc au poisson', 'Pirão di pesce', 3, 15, 1, 1, 100, 'pratos'),
    ('Mandioca frita', 'Fried cassava', 'Yuca frita', 'Manioc frit', 'Manioca fritta', 1.5, 38, 14, 2, 100, 'tuberculos'),
    ('Hummus', 'Hummus', 'Hummus', 'Houmous', 'Hummus', 8, 14, 18, 6, 50, 'molhos'),
    ('Guacamole', 'Guacamole', 'Guacamole', 'Guacamole', 'Guacamole', 2, 9, 15, 6, 50, 'molhos'),
    ('Ramen (com caldo)', 'Ramen noodle soup', 'Ramen (sopa de fideos)', 'Ramen (soupe de nouilles)', 'Ramen (zuppa di noodle)', 5, 10, 3, 0.5, 450, 'sopas'),
    ('Pho (sopa vietnamita)', 'Pho (Vietnamese noodle soup)', 'Pho (sopa vietnamita)', 'Pho (soupe vietnamienne)', 'Pho (zuppa vietnamita)', 4, 6, 1, 0.3, 450, 'sopas'),
    ('Pad thai', 'Pad thai', 'Pad thai', 'Pad thaï', 'Pad thai', 8, 25, 7, 1.5, 300, 'pratos'),
    ('Biryani de frango', 'Chicken biryani', 'Biryani de pollo', 'Biryani au poulet', 'Biryani di pollo', 8, 25, 6, 1, 300, 'pratos'),
    ('Frango tikka masala', 'Chicken tikka masala', 'Pollo tikka masala', 'Poulet tikka masala', 'Pollo tikka masala', 12, 6, 9, 1, 250, 'pratos'),
    ('Ceviche de peixe', 'Fish ceviche', 'Ceviche de pescado', 'Ceviche de poisson', 'Ceviche di pesce', 14, 5, 1, 0.5, 200, 'peixes'),
    ('Arepa recheada', 'Filled arepa', 'Arepa rellena', 'Arepa garnie', 'Arepa ripiena', 5, 30, 5, 2, 120, 'pratos'),
    ('Pupusa', 'Pupusa (stuffed corn tortilla)', 'Pupusa', 'Pupusa (galette de maïs farcie)', 'Pupusa (tortilla di mais ripiena)', 7, 25, 9, 2, 100, 'pratos'),
    ('Arroz jollof', 'Jollof rice', 'Arroz jollof', 'Riz jollof', 'Riso jollof', 3, 25, 4, 1, 250, 'pratos'),
    ('Tagine de frango', 'Chicken tagine', 'Tajín de pollo', 'Tajine de poulet', 'Tagine di pollo', 14, 8, 7, 1.5, 300, 'pratos'),
    ('Shawarma (prato)', 'Shawarma wrap', 'Shawarma (wrap)', 'Shawarma (wrap)', 'Shawarma (piadina)', 14, 18, 9, 1.5, 250, 'fastfood'),
    ('Gyoza', 'Gyoza (pan-fried dumplings)', 'Gyoza (empanadillas japonesas)', 'Gyoza (raviolis japonais)', 'Gyoza (ravioli giapponesi)', 8, 22, 7, 1, 100, 'pratos'),
    ('Bibimbap', 'Bibimbap', 'Bibimbap', 'Bibimbap', 'Bibimbap', 6, 20, 4, 1.5, 400, 'pratos'),
    ('Goulash húngaro', 'Hungarian goulash', 'Goulash húngaro', 'Goulash hongrois', 'Gulasch ungherese', 10, 5, 5, 1, 300, 'pratos'),
    ('Poutine', 'Poutine', 'Poutine', 'Poutine', 'Poutine', 5, 18, 11, 1.5, 300, 'fastfood'),
    ('Taco al pastor', 'Al pastor taco', 'Taco al pastor', 'Taco al pastor', 'Taco al pastor', 12, 20, 8, 2, 120, 'fastfood'),
    ('Burrito de carne', 'Beef burrito', 'Burrito de carne', 'Burrito au bœuf', 'Burrito di manzo', 9, 25, 8, 3, 250, 'fastfood'),
    ('Quesadilla de queijo', 'Cheese quesadilla', 'Quesadilla de queso', 'Quesadilla au fromage', 'Quesadilla al formaggio', 11, 24, 14, 1.5, 150, 'fastfood'),
    ('Nachos com queijo', 'Nachos with cheese', 'Nachos con queso', 'Nachos au fromage', 'Nachos al formaggio', 7, 40, 20, 4, 100, 'snacks'),
    ('Tortilla espanhola', 'Spanish omelette (tortilla)', 'Tortilla de patatas', 'Tortilla espagnole', 'Tortilla spagnola', 7, 8, 9, 1, 120, 'pratos'),
    ('Gaspacho', 'Gazpacho', 'Gazpacho', 'Gaspacho', 'Gazpacho', 1, 4, 3.5, 1, 250, 'sopas'),
    ('Sashimi de salmão', 'Salmon sashimi', 'Sashimi de salmón', 'Sashimi de saumon', 'Sashimi di salmone', 20, 0, 12, 0, 100, 'peixes'),
    ('Temaki', 'Temaki (hand roll)', 'Temaki (rollo de mano)', 'Temaki (cornet de sushi)', 'Temaki (cono di sushi)', 5, 25, 3, 1, 120, 'pratos'),
    ('Bolinho de bacalhau', 'Salt cod fritter', 'Buñuelo de bacalao', 'Beignet de morue', 'Frittella di baccalà', 9, 20, 12, 1.5, 60, 'snacks'),
    ('Pastel de nata', 'Portuguese custard tart', 'Pastel de nata (tarta de crema portuguesa)', 'Pastel de nata (flan portugais)', 'Pastel de nata (dolcetto alla crema)', 5, 30, 12, 0.5, 60, 'doces'),
    ('Francesinha', 'Francesinha (Portuguese sandwich)', 'Francesinha (sándwich portugués)', 'Francesinha (sandwich portugais)', 'Francesinha (panino portoghese)', 14, 14, 16, 1, 350, 'fastfood'),
    ('Bacalhau à Brás', 'Salt cod with eggs and potato (Brás style)', 'Bacalao a la Brás', 'Morue à la Brás', 'Baccalà alla Brás', 12, 10, 10, 1, 250, 'pratos'),
    ('Fish and chips', 'Fish and chips', 'Pescado frito con patatas (fish and chips)', 'Fish and chips', 'Fish and chips', 10, 22, 12, 2, 300, 'fastfood'),
    ('Torta de carne com purê (shepherd’s pie)', 'Shepherd’s pie', 'Pastel de carne con puré', 'Hachis parmentier', 'Sformato di carne e purè', 7, 12, 6, 1.5, 300, 'pratos'),
    ('Croque-monsieur', 'Croque-monsieur', 'Croque-monsieur', 'Croque-monsieur', 'Croque-monsieur', 13, 25, 15, 1, 150, 'fastfood'),
    ('Quiche lorraine', 'Quiche Lorraine', 'Quiche lorraine', 'Quiche lorraine', 'Quiche lorraine', 10, 18, 20, 1, 150, 'pratos'),
    ('Ratatouille', 'Ratatouille', 'Pisto provenzal (ratatouille)', 'Ratatouille', 'Ratatouille', 1.5, 6, 4, 2, 200, 'vegetais'),
    ('Coq au vin (frango ao vinho)', 'Coq au vin', 'Pollo al vino (coq au vin)', 'Coq au vin', 'Pollo al vino (coq au vin)', 17, 3, 8, 0.5, 250, 'aves'),
    ('Crepe simples', 'Plain crêpe', 'Crepe sencillo', 'Crêpe nature', 'Crêpe semplice', 6, 28, 8, 1, 80, 'cafe_manha'),
    ('Tiramisù', 'Tiramisu', 'Tiramisú', 'Tiramisu', 'Tiramisù', 5, 30, 18, 0.5, 100, 'doces'),
    ('Espaguete à carbonara', 'Spaghetti carbonara', 'Espagueti a la carbonara', 'Spaghetti carbonara', 'Spaghetti alla carbonara', 12, 25, 14, 1.5, 300, 'massas'),
    ('Berinjela à parmegiana', 'Eggplant parmigiana', 'Berenjena a la parmesana', 'Aubergines à la parmigiana', 'Parmigiana di melanzane', 8, 8, 10, 2, 250, 'pratos'),
    ('Nhoque ao sugo', 'Gnocchi with tomato sauce', 'Ñoquis con salsa de tomate', 'Gnocchis à la sauce tomate', 'Gnocchi al pomodoro', 4, 25, 2, 1.5, 250, 'massas'),
]

POSICAO_ID = 1


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--saida', default='../../src/data/alimentosPratos.json')
    a = ap.parse_args()
    itens = []
    vistos = set()
    for n, (pt, en, es, fr, it, p, c, g, f, porcao, cat) in enumerate(PRATOS, start=1):
        assert pt not in vistos, pt
        vistos.add(pt)
        assert f <= c + 0.5 or f <= 5, pt
        assert p + c + g <= 100, pt
        kcal = round(4 * p + 4 * c + 9 * g)
        itens.append([f'D{n:03d}', cat, kcal, p, c, g, f, porcao, pt, en, es, fr, it])
    with open(a.saida, 'w', encoding='utf-8') as out:
        out.write('{"versao":1,"fonte":"Estimativas do Levia (calculadas por Atwater 4/4/9 a partir de macros típicos da receita)",\n"itens":[\n')
        out.write(',\n'.join(json.dumps(i, ensure_ascii=False, separators=(',', ':')) for i in itens))
        out.write('\n]}\n')
    print(len(itens), 'pratos gravados em', a.saida)


if __name__ == '__main__':
    principal()
