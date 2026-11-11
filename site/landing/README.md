# Landing page do Leviã (www.leviapp.org)

Site estático (Vite + React + Tailwind) publicado no Cloudflare Workers (assets), projeto `levia-landing`.
O app (PWA) fica em `leviapp.org`; esta página fica em `www.leviapp.org`.

## Trocar os links
Tudo em `src/config.ts`: número do bot no WhatsApp, links de checkout da Hotmart (`LINK_CHECKOUT_MENSAL` e
`LINK_CHECKOUT_ANUAL`; enquanto estiverem entre colchetes o botão mostra "Checkout em breve") e link de ativação.

## Publicar
```bash
cd site/landing
npm ci
npm run build
npx wrangler deploy
```
Não guarde chaves ou tokens nesta pasta: ela é só conteúdo público.
