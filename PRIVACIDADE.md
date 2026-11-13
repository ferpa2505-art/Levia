# Política de Privacidade — Leviã

**Última atualização:** 12 de novembro de 2026

> **Resumo:** os registros de saúde que você anota no Leviã ficam no seu aparelho; o Leviã não recebe cópia deles. Para liberar o acesso, o atendimento pelo WhatsApp guarda seu nome, telefone e objetivo em nosso servidor, e a análise opcional de foto por IA envia a foto do prato para o Google. Não vendemos dados e não exibimos anúncios. O pixel da Meta na página de vendas só funciona com o seu consentimento (seção 4.4). Por segurança, também guardamos por 180 dias um registro dos acessos às rotas restritas da nossa equipe, que inclui o endereço IP de quem as chamou (seção 4.5).

## 1. Quem é o responsável

O Leviã é um aplicativo (Android e web/PWA) de registro pessoal de peso, alimentação, tratamento com medicamentos GLP-1 e diabetes. O responsável pelo tratamento dos dados descritos nesta política (controlador, na LGPD) é **Luis Fernando Paulino, da FP Tech & Art**, Brasil. Contato para privacidade e para exercer seus direitos (encarregado): **contato@leviapp.org**.

## 2. Dados em dois lugares

**No seu aparelho** ficam os registros que você escolhe fazer. **No servidor do Leviã** (Cloudflare) ficam apenas os dados necessários para liberar o acesso e controlar o uso. As seções abaixo separam os dois.

## 3. Dados que ficam só no seu aparelho

- **Perfil:** nome, como prefere ser chamado(a), pronome, sexo biológico, idade, altura, peso, meta de peso e tipo de diabetes, se informados.
- **Peso e alimentação:** pesagens, refeições, alimentos, horários, calorias e nutrientes, água, receitas e exercícios.
- **Meus alimentos:** alimentos e bebidas digitados por você, com os valores informados, para reutilizar em outros registros.
- **Gráficos:** a última configuração escolhida, como período, refeições e nutrientes.
- **Saúde:** doses e sintomas de GLP-1, glicemias e faixa-alvo, medicações, horários e observações.
- **Fotos de pratos:** no Android, uma cópia reduzida fica em arquivo no aparelho. No PWA, a foto reduzida é guardada como texto junto da refeição, no armazenamento do navegador.
- **Preferências:** idioma, tema, e-mail para relatórios (se informado), senha e biometria do app.

Parte disso são **dados pessoais sensíveis de saúde** (LGPD, art. 5º, II). O Leviã não recebe cópia desses registros. Depois que você cria a senha do app, eles são **cifrados no aparelho** (AES-256-GCM) com uma chave de dados aleatória criada no seu aparelho. Como essa chave fica protegida depende de onde você usa o Leviã:

- **No celular (Android):** a chave de dados é protegida por uma chave guardada no cofre do sistema do aparelho (Android Keystore). Quem copiar só o armazenamento do app, por exemplo de um backup, não consegue abrir os registros sem essa chave do sistema. A senha do app funciona como trava do app, com limite de tentativas; ela não é a chave dos dados.
- **No navegador (PWA):** o navegador não tem cofre do sistema. A chave de dados é protegida por uma chave derivada da **sua senha** (Argon2id). Nesse caso a proteção contra quem copiar o armazenamento do navegador **depende de a senha ser longa e difícil de adivinhar**: uma senha numérica curta, como um PIN de 4 a 10 dígitos, pode ser descoberta por quem tiver uma cópia dos dados do navegador. Prefira o celular para os registros mais sensíveis ou use uma senha longa.

Nada disso protege contra quem usa o aparelho **desbloqueado** com o app aberto, contra quem já sabe a senha, contra programas maliciosos com acesso total ao aparelho, nem contra uma cópia feita antes de você criar a senha: durante o cadastro, os registros ficam em texto no aparelho até essa etapa.

- **Senha esquecida, sem biometria ativada:** os dados ficam inacessíveis e não conseguimos recuperá-los. A única forma de restaurar é um backup feito antes.
- **Biometria ativada (celular):** a chave de dados fica protegida pelo sistema do aparelho e é liberada pela biometria. Você consegue trocar a senha sem perder os dados.
- Seu e-mail e a informação de que o cadastro foi concluído ficam guardados sem cifra, no armazenamento do app, para que o app saiba se deve pedir o cadastro.

## 4. Dados que ficam no servidor do Leviã

### 4.1 Atendimento pelo WhatsApp e acesso ao app

O acesso ao Leviã é liberado por um **serial** enviado pelo WhatsApp. O atendimento é feito pelo **LEVI, um assistente virtual** (não é uma pessoa), em português (Brasil ou Portugal), inglês, espanhol ou italiano, à sua escolha. Primeiro pedimos o seu **consentimento**; só depois perguntamos seu **nome**, seu **e-mail** (opcional) e seu **objetivo**, que você escolhe em uma lista (por exemplo, emagrecer ou controlar diabetes, o que pode revelar uma condição de saúde). Guardamos no servidor:

- nome, número de telefone, e-mail (se informado), objetivo escolhido, data e canal do consentimento;
- a etapa da conversa e identificadores de mensagens, para não repetir respostas;
- uma conta com marcas irreversíveis (hash) do telefone e do e-mail, sem o serial em texto: do serial guardamos apenas o hash;
- os aparelhos ativados (um código aleatório por instalação, no máximo 2 por serial), as datas de uso e o período de teste ou assinatura;
- contadores técnicos para limitar abuso, que incluem o endereço IP e são apagados automaticamente depois de cerca de 31 dias.

**Lembretes:** se você parar de responder, o LEVI pode enviar até 3 mensagens (30 segundos, 3 minutos e, no dia seguinte às 19h no fuso do país do seu número); quem já consentiu também pode receber um vídeo de apresentação. Responda **PARAR** e não escrevemos mais.

**Atendimento humano:** se o LEVI não conseguir ajudar, a conversa pode ser passada a uma pessoa da equipe, que poderá ler as mensagens trocadas.

**Exclusão:** responda **APAGAR** para excluir seu cadastro, sua conta e o serial.

Usamos esses dados para criar seu acesso, enviar e reemitir o serial, limitar o uso, prestar suporte e prevenir fraude. As mensagens trafegam pelo WhatsApp e seguem as regras da Meta.

**Não** enviamos ao servidor seus registros de saúde (peso, glicemia, medicações, refeições) para fazer isso.

### 4.2 Análise opcional da foto do prato por IA

Ao tocar em **Analisar com IA** e concordar com o aviso, o app envia ao servidor do Leviã: a foto reduzida (no máximo 1024 pixels), a licença do seu aparelho, o código aleatório da instalação, o idioma e dados técnicos da conexão (como o IP). O servidor confere a licença e os limites e encaminha a foto ao **Google Gemini**, que devolve a lista de alimentos estimados.

Não enviamos nome, peso, glicemia, medicações ou outros registros. O Leviã não guarda a foto; o Google pode tratá-la por tempo limitado para prestar o serviço e detectar abuso, conforme os termos da API usada. Na modalidade paga usada pelo Leviã, fotos e respostas não são usadas para treinar os modelos do Google. A resposta volta ao aparelho e nada é salvo sem a sua confirmação. A análise é opcional: você pode registrar refeições à mão.

Fotografe apenas o prato; evite rostos, documentos e outras informações pessoais.

### 4.3 Pagamentos

A assinatura é vendida pela **Hotmart**, que processa o pagamento: o Leviã não recebe nem guarda número de cartão. Da Hotmart recebemos o identificador da compra, o plano, o valor, o status, as datas e os dados do comprador informados no checkout (nome, e-mail e telefone/WhatsApp), para liberar, renovar ou revogar o seu acesso e enviar o serial do plano. A Hotmart também trata os seus dados conforme a política dela.

### 4.4 Pixel de medição na página de vendas

Na página **www.leviapp.org**, se você aceitar no aviso de cookies, carregamos o pixel da **Meta** (Facebook e Instagram). Ele registra a visita à página, dados técnicos do navegador (incluindo endereço IP aproximado) e o clique no botão de assinatura, para medir o desempenho de campanhas. A compra é registrada pela Hotmart, que pode usar o mesmo identificador. **Nenhum dado de saúde é enviado**, e o pixel não é carregado se você recusar ou não responder. Você pode rever a escolha em “Preferências de cookies”, no rodapé do site. Base legal: consentimento (LGPD, art. 7º, I).

### 4.5 Registro de segurança das rotas administrativas

O servidor tem rotas restritas à equipe, por exemplo para publicar e medir a Página do Leviã no Facebook. Cada acesso a elas, autorizado ou não, gera um registro de segurança com:

- a rota e o método chamados;
- o **endereço IP** de quem chamou;
- o resultado (código e motivo, como "autorizado" ou "não autorizado");
- um detalhe técnico curto, como o identificador do post publicado ou o código de erro da Meta;
- a data e a hora.

**Não guardamos** senhas ou tokens, cabeçalhos de autenticação, o corpo da requisição nem o texto publicado. Esse registro não contém dados de saúde nem dados de quem usa o app. A maior parte dele é da própria equipe; o IP de quem tenta acessar sem autorização também é registrado, com um limite de quantidade por IP e por período para que o registro não seja inundado.

Finalidade: segurança, prevenção de fraude e rastreabilidade das ações administrativas. Base legal: legítimo interesse e segurança (LGPD, art. 7º, IX). Prazo: 180 dias, apagados automaticamente todos os dias. As mesmas linhas aparecem nos registros operacionais da Cloudflare, que seguem a retenção do plano de hospedagem dela.

### 4.6 Envio opcional de alimento por e-mail

Ao salvar um alimento digitado por você, o app pode perguntar se deseja sugeri-lo à equipe do Leviã. Se aceitar, o app abre seu aplicativo de e-mail com o nome do alimento, os valores informados por 100 g, a medida usada, o idioma e a versão do app, para **contatoapplevia@gmail.com**. Você revisa e confirma o envio no seu aplicativo de e-mail; nenhum registro de saúde acompanha a sugestão.

## 5. Base legal

- **Consentimento** (LGPD, arts. 7º, I e 11, I) para guardar nome, telefone e objetivo no atendimento, para enviar a foto à IA, para o pixel de medição da página de vendas (seção 4.4) e para enviar sugestões de alimentos por e-mail (seção 4.6). Você pode revogá-lo a qualquer momento (seção 9).
- **Execução do serviço** (art. 7º, V) para liberar e manter seu acesso.
- **Legítimo interesse e segurança** (art. 7º, IX) para limitar abuso, prevenir fraude e registrar o acesso às rotas administrativas (seção 4.5), usando só o mínimo necessário.
- **Obrigação legal** (art. 7º, II) quando a lei exigir a guarda de algum dado.

## 6. Com quem compartilhamos e transferência internacional

Usamos prestadores para operar o serviço: **Cloudflare** (hospedagem do servidor e do banco de dados), **Hetzner** (servidor, na Finlândia, que mantém a conexão com o WhatsApp), **Google** (análise da foto, apenas se você pedir), **Meta/WhatsApp** (canal de conversa; a Meta também recebe a medição de anúncios da seção 4.4, só com consentimento, e o conteúdo que a equipe publica na Página do Leviã no Facebook, sem dados de quem usa o app), **Hotmart** (pagamentos) e, quando usado, um serviço de envio de e-mail. Também recebemos atualizações de aplicativo pela **Expo** e baixamos notícias públicas de sites de saúde; nenhum registro seu vai nessas requisições.

Alguns desses prestadores processam dados fora do Brasil. Fazemos isso para prestar o serviço, com o mínimo de dados necessário, conforme o art. 33 da LGPD. Não vendemos nem alugamos dados; o pixel de medição da seção 4.4 não recebe dados de saúde.

## 7. Backup, relatórios e exportação

O arquivo de backup ou relatório é criado no seu aparelho e só sai dele para o destino que você escolher. O backup pode ser protegido com senha (AES-256-GCM); nós não temos a senha nem como recuperá-la. O identificador de instalação e a licença não entram no backup. **Atenção:** no Android as fotos dos pratos não entram no backup; no PWA elas ficam dentro do registro da refeição e **entram no arquivo**. Guarde o arquivo com cuidado, de preferência com senha.

## 8. Por quanto tempo guardamos

- **No aparelho:** até você apagar, desinstalar o app ou limpar os dados.
- **No servidor:** nome, telefone e objetivo ficam enquanto sua conta existir ou até você pedir a exclusão; conversas não concluídas, cerca de 3 dias; contadores técnicos, cerca de 31 dias; registro de segurança das rotas administrativas (seção 4.5), 180 dias; dados de cobrança, quando houver, pelo prazo legal.
- **Foto enviada à IA:** o Leviã não a guarda; a retenção pelo Google segue os termos dele.

## 9. Seus direitos

Pelo art. 18 da LGPD você pode pedir confirmação do tratamento, acesso, correção, anonimização ou exclusão, portabilidade, informação sobre compartilhamento e a **revogação do consentimento**. Escreva para **contato@leviapp.org** informando o telefone usado no WhatsApp; podemos pedir uma confirmação de identidade para proteger sua conta. Respondemos em até 15 dias. Ao excluir sua conta, o serial e os aparelhos ativados deixam de valer. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).

## 10. Segurança

Usamos conexão cifrada (HTTPS), guardamos o serial e as marcas de telefone e e-mail apenas como hash, assinamos as licenças, limitamos tentativas, registramos o acesso às rotas administrativas (seção 4.5) e mantemos as chaves fora do código. Nenhum sistema é 100% seguro; em caso de incidente que possa causar dano relevante, avisaremos você e a ANPD conforme a lei.

## 11. Crianças e aviso de saúde

O Leviã não é destinado a menores de 18 anos. É uma ferramenta de registro e organização pessoal: não faz diagnóstico, não prescreve tratamento e não substitui médico, nutricionista ou outro profissional de saúde.

## 12. Mudanças nesta política

Se passarmos a tratar outros dados ou usar outros serviços, atualizaremos esta política antes de o recurso entrar no ar, com a data no topo.

---

Leia também os [Termos de Serviço](https://leviapp.org/termos).
