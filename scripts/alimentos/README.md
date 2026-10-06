# Banco global de alimentos do Levia

Gera `src/data/alimentosGlobais.json`: **4.458 itens** (3.526 alimentos e pratos prontos + 932 pratos montados), com nomes em **PT-BR, EN, ES, FR e IT**. Valores por 100 g: kcal, proteína, carboidrato, gordura e fibra, mais a porção sugerida em gramas.

## Fontes e licenças

| Prefixo do id | Fonte | Licença | Itens |
|---|---|---|---|
| `T` | TACO 4ª ed. (NEPA/UNICAMP), via github.com/brolesi/taco | MIT (dados públicos) | ~594 |
| `C` | ANSES-CIQUAL / CALNUT 2020 (via repositório do Open Food Facts, arquivo `external-data/ciqual/calnut/CALNUT.csv.0`) | Licence Ouverte Etalab 2.0 (pede crédito) | ~1.299 |
| `U` | USDA FoodData Central SR Legacy (via pacote npm `tempo-food-db`) | Domínio público | ~1.377 |
| `E` | TempoLife Food Dataset (pacote npm `tempo-food-db`) | **CC-BY-4.0: crédito obrigatório** | ~257 |
| `P` `B` `V` `S` `W` | Pratos montados calculados pelo Levia (soma ponderada por gramas dos itens acima) | — | 932 |

**Crédito obrigatório** (mostrar em "Sobre" ou "Fontes" no app): use a constante `CREDITO_FONTES_ALIMENTOS` de `src/constants/alimentosGlobais.ts`.

## Como foi feito

1. Seleção: removi variações irrelevantes (cortes de carne repetidos, marcas, águas minerais, comida de bebê, versões "sem sal" e "low sodium" duplicadas etc.).
2. Tradução: feita nome a nome, revisada para soar natural em cada idioma (`trans/*.tsv`, formato `id|pt|en|es|fr|it`).
3. Pratos montados: arroz/massa/batata/mandioca/quinoa/cuscuz × 14 proteínas × 6 acompanhamentos, mais café da manhã, vitaminas, saladas e sanduíches.
4. Checagens: 5 nomes preenchidos, macros entre 0 e 100 g, kcal ≤ 905 e coerência de Atwater (4/4/9). Os 7 itens que ficaram fora da faixa têm explicação (álcool, fibra, polióis).

## Limitações conhecidas

- Os carboidratos seguem a definição de cada tabela: na TACO e no USDA é o **total**; no CIQUAL é o **disponível** (sem fibra).
- Os itens de restaurante e fast-food do USDA são dos EUA (por volta de 2010). Os nomes de marca foram trocados por nomes genéricos.
- Sopas marcadas como "(lata, concentrada)" estão sem diluir.
- Itens TACO sem valor na fonte (leite integral, leite desnatado, iogurte de abacaxi) usam o equivalente do USDA, do CIQUAL ou da própria TACO.

## Regenerar

```bash
# baixar fontes (ver build.py): taco_composicao.csv, calnut0.csv, tempo-food-db (npm)
python3 build.py   # gera out/alimentosGlobais.json e out/alimentosGlobais_revisao.csv
```
