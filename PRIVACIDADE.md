# Política de Privacidade — Leviã

**Última atualização:** 7 de outubro de 2026  
**Versão do app:** 0.4.0

## 1. Quem somos

O Leviã é um aplicativo de registro pessoal de peso, alimentação, tratamento com medicamentos GLP-1 e diabetes. Para dúvidas ou pedidos relacionados à privacidade, entre em contato pelo e-mail **contatoapplevia@gmail.com**.

## 2. Quais dados o app guarda

O Leviã guarda no armazenamento interno do seu aparelho somente as informações que você registra ou configura:

- **Perfil:** nome, como prefere ser chamado(a), pronome, sexo biológico, idade, altura, peso, meta de peso e tipo de diabetes, se informados.
- **Peso e alimentação:** pesagens, refeições, alimentos, horários, calorias, proteínas, carboidratos, gorduras, fibras, água, receitas e exercícios.
- **Fotos dos pratos:** se você fotografar ou escolher uma foto, uma cópia reduzida pode ficar guardada junto da refeição no aparelho.
- **GLP-1:** doses, dosagem, local de aplicação, sintomas, apetite e configuração da caneta.
- **Diabetes:** glicemias, faixa-alvo, lembretes e notas.
- **Medicações:** nome, dose, tipo de uso, horários e observações.
- **Preferências:** idioma, tema e opções do app.
- **Identificador de instalação:** um código aleatório, sem seu nome e sem dados do aparelho, criado quando você usa a análise de foto por IA. Ele serve para controlar a cota gratuita.
- **E-mail para relatórios:** se informado, fica salvo no aparelho e apenas preenche o destinatário quando você escolhe gerar e enviar um relatório pelo seu próprio aplicativo de e-mail.

Alguns desses dados são dados pessoais sensíveis de saúde, nos termos da LGPD. Eles são tratados para o funcionamento do app, conforme as escolhas feitas por você.

## 3. Onde os dados ficam

Os registros ficam no armazenamento interno do aplicativo, no seu aparelho. O Leviã não tem cadastro, login nem servidor próprio recebendo seus registros de saúde.

Se o backup automático do Android estiver ativado na sua conta Google, o próprio sistema poderá incluir os dados do app no backup da sua conta, conforme a política do Google.

## 4. Quando o app usa a internet

O Leviã se conecta à internet somente para:

- **Notícias:** baixar artigos públicos de sites de saúde, como tuasaude.com. Esses sites recebem uma requisição comum de leitura, incluindo o endereço IP, mas nenhum registro de saúde do app é enviado.
- **Atualizações:** verificar e baixar correções pelos servidores da Expo, que podem receber informações técnicas como versão do app e sistema operacional, nunca seus registros.
- **Google Play:** instalação e atualizações, conforme a política do Google.
- **Análise opcional de foto por IA:** somente quando você toca para analisar e concorda com o envio.

### 4.1 Análise opcional da foto do prato por IA

Ao tocar em **Analisar com IA**, o Leviã envia para o servidor do Leviã na Cloudflare:

- a foto reduzida do prato, com no máximo 1024 pixels no lado maior;
- o identificador aleatório da instalação;
- o idioma do app;
- dados técnicos da conexão, como o endereço IP.

O Leviã não envia junto seu nome, peso, glicemia, medicações ou outros registros de saúde. A Cloudflare confere as cotas e encaminha a foto ao Google Gemini para identificar alimentos e estimar quantidades. A foto não é guardada pelo worker do Leviã; são mantidos apenas os contadores necessários para controlar o uso, por até 8 dias para a instalação e por até 2 horas para o controle por IP.

O Google pode processar a foto e a resposta por tempo limitado para prestar o serviço e detectar abuso, conforme os termos da API utilizada. Na modalidade paga usada pelo Leviã, fotos e respostas não são usadas para treinar os modelos do Google.

A resposta volta para o aparelho e você confere, corrige ou descarta as sugestões antes de salvar a refeição. A análise depende do seu consentimento, pode ser recusada e não é necessária para registrar refeições manualmente.

Fotografe apenas o prato. Não inclua rostos, documentos ou outras informações pessoais na imagem.

## 5. Notificações, câmera, fotos e calendário

- Lembretes de dose, medicação, glicemia e refeições são agendados no próprio aparelho.
- Câmera e galeria são usadas somente quando você aciona esses recursos. As fotos ficam no aparelho e só saem dele se você pedir a análise por IA ou escolher compartilhá-las.
- O calendário é usado somente se você ativar a opção de adicionar horários de medicação. O Leviã cria eventos, mas não lê seus outros eventos.
- Ao gerar um backup ou relatório, o arquivo é criado no aparelho e só sai dele para o destino que você escolher no compartilhamento do sistema.
- Backups podem ser protegidos com senha. A senha não é enviada nem guardada pelo Leviã.
- Senha e biometria do app são tratadas no dispositivo; o Leviã não recebe sua digital nem seu rosto.

## 6. O que não fazemos

O Leviã não vende seus dados, não exibe anúncios e não usa ferramentas de rastreamento ou estatísticas de uso. Não acessa localização, contatos ou microfone. Não compartilha seus registros de saúde com terceiros; a única exceção é o envio opcional da foto para a análise descrita na seção 4.1.

## 7. Retenção e exclusão

Os dados ficam no aparelho até você apagá-los. Você pode excluir registros dentro do app. Desinstalar o Leviã ou limpar os dados do app remove as informações armazenadas no aparelho. Os contadores técnicos da análise por IA expiram conforme os prazos descritos na seção 4.1.

## 8. Seus direitos

Você pode consultar, corrigir e excluir seus dados dentro do app. Para dúvidas ou solicitações relacionadas à privacidade e à LGPD, escreva para **contatoapplevia@gmail.com**.

## 9. Crianças e aviso de saúde

O Leviã não é destinado a menores de 18 anos. Ele é uma ferramenta de registro e organização pessoal: não diagnostica, não prescreve tratamento e não substitui médico, nutricionista ou outro profissional de saúde.

## 10. Alterações nesta política

Se uma versão futura passar a enviar outros dados para fora do aparelho ou usar outros serviços, esta política será atualizada antes do lançamento, explicando quais dados são enviados, para quem e por quê.

**Versão 0.4.0 — 7 de outubro de 2026**
