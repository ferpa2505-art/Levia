# Cofre dos dados de saúde: modelo de ameaça (formato v2)

Código: `src/utils/cofreDados.ts` (núcleo, testável em Node), `src/utils/cofre.ts` (ligação com o sistema),
`src/utils/seguranca.ts` (senha do app e biometria). Testes: `__tests__/cofre-dados.test.ts`, `__tests__/cofre-v2.test.ts`.

## O problema do formato v1

A chave que cifrava os dados era `scrypt(PIN)` e o PIN tem 4 a 10 dígitos. Quem copiasse o armazenamento do app
(backup, `adb`, outro app com acesso, perfil do navegador) podia testar todos os PINs **offline**: 10⁴ combinações
para 4 dígitos são minutos, mesmo com scrypt. Além disso o verificador do PIN também ficava guardado. Isso
contradiz a promessa de que os dados só abrem com a senha. **Aumentar o mínimo do PIN não resolve**: o espaço de busca
continua pequeno comparado a uma chave aleatória.

## Desenho do formato v2

- **DEK**: chave de dados aleatória de 256 bits, criada no aparelho. Não é derivada de PIN algum.
- **Dados**: AES-256-GCM sob a DEK, envelope `LEVIA-ENC2:`; o **nome da chave de armazenamento é AAD**, então um
  envelope trocado de lugar não abre.
- **Slots** (cabeçalho `levia:cofre:v2`) que embrulham a DEK:
  - **`sistema` (celular)**: a DEK é embrulhada por uma chave aleatória guardada no Android Keystore / iOS Keychain
    (`expo-secure-store`, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`). O armazenamento copiado, sozinho, não abre, e **não
    existe slot derivado do PIN para atacar**. O PIN vira a trava do app (5 tentativas, espera de 30 s), não a raiz
    criptográfica.
  - **`senha` (navegador/PWA)**: o navegador não tem Keystore. A DEK é embrulhada por uma chave derivada da senha com
    **Argon2id** (32 MiB, 3 passadas; parâmetros gravados no slot e atualizáveis). A proteção contra cópia do
    armazenamento **depende da entropia da senha**.
- **Verificação**: um valor cifrado pela DEK no cabeçalho confirma uma chave mesmo sem nenhum dado gravado.
- **Rebaixamento**: se o cofre do sistema falhar na criação (celular com Keystore quebrado), o app cai para o slot de
  senha e grava `rebaixado: true` (proteção só pela senha). Nunca fica sem cofre nem apaga dados.

## O que protege

| Ameaça | Celular | PWA |
|---|---|---|
| Cópia do armazenamento do app (backup, adb, outro app sem root) | **Protege**: falta a chave do sistema | Protege **só se a senha tiver entropia alta** (ver abaixo) |
| Quebra offline do PIN | Não há slot de PIN para quebrar | **Não protege** com PIN numérico curto, apesar do Argon2id |
| Envelope trocado ou adulterado | Detectado (GCM + AAD) | Detectado |
| Arquivo de backup do app (opcional, com senha) | Argon2/scrypt da senha de backup, fora deste cofre | Idem |

## O que NÃO protege (não prometer)

- **Aparelho desbloqueado com o app aberto**, ou quem já tem a senha/PIN e o aparelho.
- **Malware com root ou com acesso ao Keystore**, ou keylogger/acessibilidade abusiva.
- Armazenamento **já copiado** junto com a chave do sistema (aparelho comprometido por inteiro).
- **No PWA, PIN numérico curto**: continua quebrável offline por quem copiar o armazenamento do navegador
  (10⁴ a 10¹⁰ tentativas × custo do Argon2id). O PWA só tem proteção forte com uma **senha longa** (recomendado:
  frase de 5 palavras ou mais de 12 caracteres). **A interface do PWA ainda aceita o PIN numérico**: trocá-la por
  campo de senha forte muda o cadastro e as traduções e depende de decisão do responsável (ver "Pendências").
- Cópia de **texto puro** feita antes do primeiro PIN (a fase de onboarding grava sem cifra até o PIN existir).
- XSS no PWA: a DEK fica em memória enquanto o app está aberto.

## Migração v1 → v2 (compatível, sem perda silenciosa)

No primeiro desbloqueio (por PIN ou por biometria) o cofre v1 é convertido:
1. Reabre **cada** valor em memória com a chave v1; confere a ida e volta do envelope novo.
2. Se **qualquer** valor não abrir, **nada é gravado** (erro `CofreBloqueado`) e o v1 fica intacto.
3. Grava os valores novos + o cabeçalho v2 em **uma única operação** (`multiSet`); só depois apaga o sal v1.
4. Falha de gravação (disco cheio) deixa o v1 intacto e a próxima abertura repete a migração.
5. A chave guardada pela biometria (antes: chave derivada do PIN) é substituída pela DEK após o primeiro uso.
6. O verificador do PIN (`levia_pin`, scrypt) continua como trava do app e é regravado no mesmo formato.

## Pendências (dependem de decisão humana)

1. **Interface do PWA com senha forte** (campo de texto, medidor de força, traduções em 18 idiomas). Sem ela, o PWA
   segue com PIN numérico e a política precisa dizer isso (ela diz).
2. **Subir o custo do Argon2id** (ex.: 64 MiB) depois de medir o tempo de desbloqueio em celulares fracos.
3. **Teste em aparelho real** (Android com Keystore) da migração com dados reais **do próprio responsável**: os
   testes automatizados usam só dados sintéticos e um provedor de sistema simulado.
4. Publicar a política atualizada **somente** junto com a versão do app que contém este formato.
