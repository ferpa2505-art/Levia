import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * O build usa viteSingleFile: script e estilo entram inline no index.html. Isso obrigaria a CSP a
 * liberar 'unsafe-inline' para script — ou seja, qualquer injeção de <script> passaria.
 *
 * Em vez disso, depois do build calculamos o sha256 de cada <script> inline e trocamos
 * 'unsafe-inline' do script-src pelos hashes em dist/_headers. O Cloudflare lê esse arquivo, então
 * o que vai ao ar já é a versão com hash. Como o bundle muda a cada build, o hash tem de ser
 * calculado a cada build — feito aqui, e não à mão, para nunca sair de sincronia com o HTML.
 */
function cspComHashes(): Plugin {
  return {
    name: "csp-hashes-inline",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");

      // Sem src = inline. Inclui o JSON-LD de propósito: é dado, não executa, mas hashear é inócuo
      // e evita depender de como cada navegador trata blocos de dados.
      // </script[^>]*> e não </script>: a tag de fechamento aceita espaço antes do '>' (</script >).
      // Sem isso, um fechamento com espaço engoliria o script seguinte e o hash sairia errado.
      const hashes = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script[^>]*>/gi)]
        .filter((m) => !/\bsrc\s*=/i.test(m[1]))
        .map((m) => `'sha256-${crypto.createHash("sha256").update(m[2], "utf8").digest("base64")}'`);

      const arquivo = path.join(dist, "_headers");
      const linhas = fs.readFileSync(arquivo, "utf8").split(/\r?\n/);
      const alvo = linhas.findIndex((l) => /^\s*Content-Security-Policy:/i.test(l));
      if (alvo === -1) throw new Error("dist/_headers sem Content-Security-Policy: CSP não endurecida");

      linhas[alvo] = linhas[alvo].replace(/script-src ([^;]+)/i, (_tudo, diretiva: string) => {
        const semInline = diretiva.replace(/'unsafe-inline'/g, "").replace(/\s+/g, " ").trim();
        return `script-src ${[...hashes, semInline].filter(Boolean).join(" ")}`;
      });

      const direcao = linhas[alvo].match(/script-src [^;]+/i)?.[0] ?? "";
      if (/'unsafe-inline'/.test(direcao) || !/sha256-/.test(direcao)) {
        throw new Error(`script-src não endureceu como esperado: ${direcao}`);
      }
      if (hashes.length === 0) throw new Error("nenhum script inline encontrado: o hash não seria aplicado");

      fs.writeFileSync(arquivo, linhas.join("\r\n"), "utf8");
      console.log(`[csp] ${hashes.length} hash(es) inline aplicados em dist/_headers`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), cspComHashes()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
