# Política de Privacidade — Leviã

**Última atualização:** 29 de outubro de 2026

> **Resumo:** os registros de saúde que você anota no Leviã ficam no seu aparelho; o Leviã não recebe cópia deles. Para liberar o acesso, o atendimento pelo WhatsApp guarda seu nome, telefone e objetivo em nosso servidor, e a análise opcional de foto por IA envia a foto do prato para o Google. Não vendemos dados, não exibimos anúncios e não usamos rastreamento.

## 1. Quem é o responsável

O Leviã é um aplicativo (Android e web/PWA) de registro pessoal de peso, alimentação, tratamento com medicamentos GLP-1 e diabetes. O responsável pelo tratamento dos dados descritos nesta política (controlador, na LGPD) é **Luis Fernando Paulino, da FP Tech & Art**, Brasil. Contato para privacidade e para exercer seus direitos (encarregado): **contatoapplevia@gmail.com**.

## 2. Dados em dois lugares

**No seu aparelho** ficam os registros que você escolhe fazer. **No servidor do Leviã** (Cloudflare) ficam apenas os dados necessários para liberar o acesso e controlar o uso. As seções abaixo separam os dois.

## 3. Dados que ficam só no seu aparelho

- **Perfil:** nome, como prefere ser chamado(a), pronome, sexo biológico, idade, altura, peso, meta de peso e tipo de diabetes, se informados.
- **Peso e alimentação:** pesagens, refeições, alimentos, horários, calorias e nutrientes, água, receitas e exercícios.
- **Saúde:** doses e sintomas de GLP-1, glicemias e faixa-alvo, medicações, horários e observações.
- **Fotos de pratos:** no Android, uma cópia reduzida fica em arquivo no aparelho. No PWA, a foto reduzida é guardada como texto junto da refeição, no armazenamento do navegador.
- **Preferências:** idioma, tema, e-mail para relatórios (se informado), senha e biometria do app.

Parte disso são **dados pessoais sensíveis de saúde** (LGPD, art. 5º, II). O Leviã não recebe cópia desses registros. Eles **não são criptografados** no aparelho: quem tiver acesso ao aparelho desbloqueado ou ao navegador pode lê-los. A senha do app e a biometria funcionam como trava de tela do aplicativo, não como criptografia dos dados.

## 4. Dados que ficam no servidor do Leviã

### 4.1 Atendimento pelo WhatsApp e acesso ao app

O acesso ao Leviã é liberado por um **serial** enviado pelo WhatsApp. Na conversa, pedimos seu **nome**, seu **objetivo ou dificuldade** (texto livre; pode citar saúde, como "tenho diabetes") e seu **consentimento**. Guardamos no servidor:

- nome, número de telefone, objetivo informado, data e canal do consentimento;
- a etapa da conversa e identificadores de mensagens, para não repetir respostas;
- uma conta com marcas irreversíveis (hash) do telefone e do e-mail, sem o serial em texto: do serial guardamos apenas o hash;
- os aparelhos ativados (um código aleatório por instalação, no máximo 2 por serial), as datas de uso e o período de teste ou assinatura;
- contadores técnicos para limitar abuso, que incluem o endereço IP e são apagados automaticamente depois de cerca de 31 dias.

Usamos esses dados para criar seu acesso, enviar e reemitir o serial, limitar o uso, prestar suporte e prevenir fraude. As mensagens trafegam pelo WhatsApp e seguem as regras da Meta.

**Não** enviamos ao servidor seus registros de saúde (peso, glicemia, medicações, refeições) para fazer isso.

### 4.2 Análise opcional da foto do prato por IA

Ao tocar em **Analisar com IA** e concordar com o aviso, o app envia ao servidor do Leviã: a foto reduzida (no máximo 1024 pixels), a licença do seu aparelho, o código aleatório da instalação, o idioma e dados técnicos da conexão (como o IP). O servidor confere a licença e os limites e encaminha a foto ao **Google Gemini**, que devolve a lista de alimentos estimados.

Não enviamos nome, peso, glicemia, medicações ou outros registros. O Leviã não guarda a foto; o Google pode tratá-la por tempo limitado para prestar o serviço e detectar abuso, conforme os termos da API usada. Na modalidade paga usada pelo Leviã, fotos e respostas não são usadas para treinar os modelos do Google. A resposta volta ao aparelho e nada é salvo sem a sua confirmação. A análise é opcional: você pode registrar refeições à mão.

Fotografe apenas o prato; evite rostos, documentos e outras informações pessoais.

### 4.3 Pagamentos

A cobrança ainda não está ativa. Quando for ativada, o pagamento será processado por um provedor externo (previsto: Mercado Pago), e o Leviã não receberá nem guardará número de cartão. Trataremos apenas identificador da compra, plano, valor, status e datas. Esta política será atualizada antes disso.

## 5. Base legal

- **Consentimento** (LGPD, arts. 7º, I e 11, I) para guardar nome, telefone e objetivo no atendimento e para enviar a foto à IA. Você pode revogá-lo a qualquer momento (seção 9).
- **Execução do serviço** (art. 7º, V) para liberar e manter seu acesso.
- **Legítimo interesse e segurança** (art. 7º, IX) para limitar abuso e prevenir fraude, usando só o mínimo necessário.
- **Obrigação legal** (art. 7º, II) quando a lei exigir a guarda de algum dado.

## 6. Com quem compartilhamos e transferência internacional

Usamos prestadores para operar o serviço: **Cloudflare** (hospedagem do servidor e do banco de dados), **Google** (análise da foto, apenas se você pedir), **Meta/WhatsApp** (canal de conversa) e, quando usado, um serviço de envio de e-mail. Também recebemos atualizações de aplicativo pela **Expo** e baixamos notícias públicas de sites de saúde; nenhum registro seu vai nessas requisições.

Alguns desses prestadores processam dados fora do Brasil. Fazemos isso para prestar o serviço, com o mínimo de dados necessário, conforme o art. 33 da LGPD. Não vendemos nem alugamos dados e não os usamos para publicidade.

## 7. Backup, relatórios e exportação

O arquivo de backup ou relatório é criado no seu aparelho e só sai dele para o destino que você escolher. O backup pode ser protegido com senha (AES-256-GCM); nós não temos a senha nem como recuperá-la. O identificador de instalação e a licença não entram no backup. **Atenção:** no Android as fotos dos pratos não entram no backup; no PWA elas ficam dentro do registro da refeição e **entram no arquivo**. Guarde o arquivo com cuidado, de preferência com senha.

## 8. Por quanto tempo guardamos

- **No aparelho:** até você apagar, desinstalar o app ou limpar os dados.
- **No servidor:** nome, telefone e objetivo ficam enquanto sua conta existir ou até você pedir a exclusão; contadores técnicos, cerca de 31 dias; dados de cobrança, quando houver, pelo prazo legal.
- **Foto enviada à IA:** o Leviã não a guarda; a retenção pelo Google segue os termos dele.

## 9. Seus direitos

Pelo art. 18 da LGPD você pode pedir confirmação do tratamento, acesso, correção, anonimização ou exclusão, portabilidade, informação sobre compartilhamento e a **revogação do consentimento**. Escreva para **contatoapplevia@gmail.com** informando o telefone usado no WhatsApp; podemos pedir uma confirmação de identidade para proteger sua conta. Respondemos em até 15 dias. Ao excluir sua conta, o serial e os aparelhos ativados deixam de valer. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).

## 10. Segurança

Usamos conexão cifrada (HTTPS), guardamos o serial e as marcas de telefone e e-mail apenas como hash, assinamos as licenças, limitamos tentativas e mantemos as chaves fora do código. Nenhum sistema é 100% seguro; em caso de incidente que possa causar dano relevante, avisaremos você e a ANPD conforme a lei.

## 11. Crianças e aviso de saúde

O Leviã não é destinado a menores de 18 anos. É uma ferramenta de registro e organização pessoal: não faz diagnóstico, não prescreve tratamento e não substitui médico, nutricionista ou outro profissional de saúde.

## 12. Mudanças nesta política

Se passarmos a tratar outros dados ou usar outros serviços, atualizaremos esta política antes de o recurso entrar no ar, com a data no topo.
