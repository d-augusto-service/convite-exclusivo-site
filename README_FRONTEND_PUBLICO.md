# CONVITE EXCLUSIVO — Página Pública do Convidado (Etapa 2)

JavaScript modular puro (sem build step, sem npm). Abre diretamente num
servidor estático — o Supabase JS é importado via CDN (ESM) com versão
fixada.

## 1. Configurar

Edita `js/config.js` e substitui pelos dados do teu projeto Supabase
(Project Settings > API):

```js
export const CONFIGURACAO = {
  SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'a-tua-anon-key-aqui',
};
```

## 2. Correr localmente

Módulos ES exigem `http://`, não `file://`. No VS Code, usa a extensão
**Live Server** (botão "Go Live") ou, com Node instalado:

```bash
npx serve frontend-publico
```

Depois abre, por exemplo:

```
http://localhost:3000/?c=TOKEN_DE_TESTE
```

(usa um token que tenhas criado com `database/04_dados_teste_OPCIONAL.sql`)

## 3. Formato do link do convite

Dois formatos são suportados ao mesmo tempo, para funcionar em
qualquer alojamento:

- Bonito: `https://teudominio.com/convite/TOKEN`
- Simples: `https://teudominio.com/?c=TOKEN`

O ficheiro `404.html` existe para o formato bonito funcionar em
alojamento 100% estático (GitHub Pages, por exemplo), onde não há
configuração de rotas do lado do servidor — ver comentários dentro
dele.

## 4. Publicar (GitHub Pages, gratuito)

1. Sobe esta pasta (`frontend-publico`) para um repositório GitHub.
2. Repositório > Settings > Pages > Source: branch principal, pasta `/ (root)`.
3. Garante que `index.html` e `404.html` ficam na raiz do que é publicado.
4. O GitHub Pages serve automaticamente `404.html` para caminhos como
   `/convite/ABC123`, que redireciona para `index.html?p=...`.

Qualquer outro alojamento estático gratuito (Netlify, Vercel, Cloudflare
Pages) também funciona da mesma forma — nenhum deles é obrigatório.

## 5. O que esta etapa faz

- Lê o token do URL, chama `rpc_obter_convite` (Etapa 1) e preenche a
  página com os dados reais do evento — nada está fixo no HTML.
- Mostra um ecrã de erro elegante se o link for inválido, revogado ou
  não encontrado (nunca mostra um erro técnico cru).
- Contagem decrescente real, calculada no fuso de Luanda (UTC+1 fixo).
- Formulário de confirmação completo, com validação no cliente E no
  servidor (a validação do cliente é só conforto — a segurança real
  está nas funções SQL da Etapa 1).
- Impede duplicação: se o convidado já respondeu, o formulário
  aparece pré-preenchido e uma nova submissão faz UPDATE, não um novo
  registo (`unique(invitation_id)` na base de dados).
- Respeita `prefers-reduced-motion` (desativa animações decorativas).
- Responsivo mobile-first; testado visualmente em larguras pequenas
  via CSS (ver nota de testes).

## 6. Meu Convite Digital (PNG / PDF / E-mail)

Depois de confirmar presença, o convidado vê um cartão do convite
(mesmo visual Black & Gold) com os seus dados, e pode:

- Guardar como PNG (usa partilha nativa em telemóvel, download em
  computador) — bibliotecas `html2canvas` e `jspdf`, carregadas por
  CDN só quando o cartão é revelado (não pesa no carregamento inicial).
- Descarregar em PDF (mesma composição visual do PNG).
- Enviar por e-mail — isto chama a Edge Function
  `enviar-convite-email`; configura-a seguindo
  `supabase/functions/enviar-convite-email/README.md`. Sem essa
  configuração, PNG e PDF continuam a funcionar — só o e-mail fica
  indisponível com um aviso claro.

Ver `docs/MEU_CONVITE_DIGITAL.md` para o detalhe completo (o que foi
testado, o que falta testar, limitações).

## O que esta etapa NÃO faz (ainda)

- Não existe nenhum painel administrativo — isso é a Etapa 3.
- O link de cada convidado ainda tem de ser criado manualmente no SQL
  Editor do Supabase (ver `database/04_dados_teste_OPCIONAL.sql`) até
  a Etapa 3 trazer o ecrã "Meus Convites Digitais".
