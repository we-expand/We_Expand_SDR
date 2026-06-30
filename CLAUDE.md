# We Expand SDR — Estado Atual (2026-06-25)

## 📊 Resumo Executivo
MVP de SDR automatizado (Sales Development Rep) a partir do ImobHunter. **Projeto R$0** (antes era R$0 estrito; agora com Groq grátis continua zero). Stack: Vite + React + Tailwind v4 + Supabase pago + Groq (IA).

**Status**: Fase 1 completa e testada ponta a ponta. Importação automática (Apollo CSV → Groq scoring → banco real) funciona. Falta: fluxo LinkedIn paste, refinamento geográfico (cidades), email/telefone visível no card.

---

## 🏗️ Arquitetura & Stack

- **Frontend**: SPA Vite (React 19 + Tailwind v4)
- **Backend**: Serverless functions em `api/` (Vercel convention, mas dev roda via plugin Vite)
- **Database**: Supabase pago (`imob_hunter` project, id `evdyqlrssgsktctjruuq`)
- **IA**: Groq (llama-3.3-70b-versatile, free tier, sem cartão)
- **APIs externas**: Apollo (free tier, CSV export apenas), Supabase, Groq
- **Deploy**: Pendente (não feito git init ainda)

---

## ✅ O que foi feito (Fase 1)

### Frontend
- **3 telas**: Buscar (demo), Importar leads, Meus leads
- **SearchConfig**: Filtros por cargo/empresa/país + busca booleana (AND/OR/NOT, parênteses, "frases exatas")
- **LeadQueue**: Exibe leads com score, sinais, mensagem, 4 botões de outreach (Email/LinkedIn/WhatsApp/Instagram)
- **ImportLeads**: Textarea pra colar CSV do Apollo, feedback visual (inseridos/atualizados/falhados)
- **LeadCard**: Avatar com iniciais, score em destaque, links de LinkedIn/website, botão "🤖 Analisar com IA" (manual)

### Backend & Database
- **Tabela `leads`**: `id, name, title, company, country, city, company_type, linkedin_url, website, email, phone, source, raw_text, hot_signals (jsonb), score, outreach_message, status, title_history (jsonb), name_normalized (generated), created_at, updated_at`
- **RLS habilitado** (sem políticas permissivas, só service_role acessa)
- **Dedup by name**: Coluna gerada `name_normalized` (lower+trim+espaços), índice único. Atualiza cargo/empresa se existir, move cargo antigo pra `title_history`
- **Funções SQL**: `upsert_lead()` (insert or update atômico, com parâmetro novo `p_city`)
- **Migrations aplicadas**:
  - `create_leads_table`
  - `enable_rls_leads`
  - `add_name_dedup_and_title_history`
  - `add_city_and_verification_columns` (city, email_valid, email_domain_has_mx, phone_valid)
  - `add_city_to_upsert_lead` (função atualizada)
  - `fix_upsert_lead_search_path` (security fix)

### APIs (`api/`)
- **`import-apollo-csv.js`**: Parse CSV, mapeia colunas (First/Last Name, Title, Company, LinkedIn, Email, Country), chama `upsert_lead`, e então **chama Groq automaticamente pra cada lead** pra scoring
- **`score-leads.js`**: Recebe `{ids}`, chama `enrichLead()` pra cada um (scoring + verificação), atualiza banco
- **`leads.js`**: Lista leads reais (ordenado por score desc, depois created_at desc)
- **Helpers**:
  - `_lib/groq.js`: `scoreLeadWithGroq(lead)` (score + hot_signals + outreach_message) + `extractLeadsFromText(rawText)` (parser IA pra texto LinkedIn)
  - `_lib/enrich.js`: `enrichLead(supabase, lead)` (valida email, verifica MX, valida phone, chama Groq, atualiza banco) — **NOVO**
  - `_lib/supabase.js`: `getSupabaseAdmin()`
  - `_lib/csv.js`: `parseCsv()`, `mapApolloRecord()`

### Vite Dev Setup
- **`vite-plugins/apiMiddleware.js`**: Plugin que intercepta `/api/*` e executa funções serverless direto (zero Vercel dev setup)
- **`vite.config.js`**: Carrega `.env.local`, ativa plugin

### Env Vars (`.env.local`, covered by `.gitignore`)
```
APOLLO_API_KEY=<redacted — ver .env.local local>
GEMINI_API_KEY=<redacted, bloqueado, não usar>
SUPABASE_URL=https://evdyqlrssgsktctjruuq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<redacted — ver .env.local local>
GROQ_API_KEY=<redacted — ver .env.local local>
```

---

## 📋 O que falta (Fase 2+)

### Crítico (próximas sessões)
1. **Refinamento geográfico (cidades)**
   - SearchConfig: Expandir país → dropdown/multiselect de cidades
   - Mapeamento país-cidades (JSON fixture ou banco)
   - App.jsx: Filtro por city (similar ao país)
   - LeadCard: Exibir city + country

2. **Email & telefone visível**
   - LeadCard: Mostrar email (com icon 📧), telefone (com icon 📞)
   - Email/phone verification badges (✅ validado, ❌ inválido, ⚠️ MX desconhecido)
   - Botão "copiar email" / "copiar telefone"

3. **Fluxo LinkedIn paste**
   - ImportLeads nova aba: "Colar de LinkedIn"
   - Textarea que aceita texto solto (copiar a página inteira)
   - Groq extrai dados estruturados via `extractLeadsFromText()`
   - Mesmo fluxo de scoring/import do Apollo

### Nice-to-have
- HubSpot sync (ainda não implementado, Free tier é MCP-available)
- Envio real de outreach (agora é só "copiar mensagem")
- Analytics / dashboard de conversão

---

## 🚀 Como continuar (próxima sessão)

### Setup
```bash
cd /Users/clebercouto/Projects/we-expand/sdr
npm install  # se falta algo
npm run dev  # roda em http://localhost:5173
```

### Git (Primeiro, a fazer — NUNCA auto-commit)
```bash
git init
git add -A
git commit -m "MVP SDR: busca demo + importação real Apollo CSV + scoring Groq"
git remote add origin <seu-repo>
git push -u origin main
```

### Próximas frentes de código
1. **Cidades**: Criar arquivo `src/data/countryCities.js` (mapa país → cidades)
2. **Email/phone display**: Editar `LeadQueue.jsx` LeadCard — adicionar linhas pra email/phone com badges
3. **LinkedIn paste**: Criar nova sub-aba em `ImportLeads` ou screen separada; chamar `extractLeadsFromText()`

### Testes rápidos
- Import CSV Apollo: vai direto pra Groq (funciona)
- Botão "Analisar com IA": reprocessa um lead (funciona)
- Busca demo: filtra por cargo/empresa/país/keyword (funciona)

---

## ⚠️ Notas importantes

### Orçamento = R$0
- Groq: free tier, sem limite de requisições formal (~500+ por dia), perfeito pra MVP
- Gemini: bloqueado (limit: 0, é region/account lock, não adianta retry)
- Claude API: não precisamos mais (Groq resolve)
- Supabase: conta paga do Cleber (capacidade ilimitada dentro do plano pago)

### Decisões travadas
- **Humano-no-loop**: Cleber copia mensagem gerada, envia com 1 clique (não automatiza envio em rede social)
- **Sourcing manual-assistido**: Cleber busca no Apollo/LinkedIn normal (sem bot), cola CSV/texto, IA normaliza
- **Sem scraping**: Recusamos crawler de LinkedIn/Instagram (ToS violation, risco banimento)
- **Dedup por nome completo**: Risco de colisão aceitável (Cleber ciente)

### Git/Deploy
- Pasta `sdr` ainda **NÃO é repo git** (nenhum `.git/`)
- Cleber precisa rodar `git init` + commit quando pronto
- Deploy na Vercel: precisa ter env vars lá também (SUPABASE_*, GROQ_*, APOLLO_*)

---

## 📝 Referências rápidas

| Recurso | Localização |
|---------|-------------|
| Componentes React | `src/components/` |
| API serverless | `api/` |
| Mock data (demo) | `src/data/mockLeads.js` |
| Boolean search engine | `src/lib/booleanSearch.js` |
| Adapter DB→React | `src/lib/leadAdapter.js` |
| Groq + extract | `api/_lib/groq.js` |
| Email/phone validation | `api/_lib/enrich.js` |
| Supabase auth | `api/_lib/supabase.js` |
| Migrations aplicadas | Via Supabase console (ou vê em `mcp__83c18f44...execute_sql`) |
| Memory (auto-save) | `/Users/clebercouto/.claude/projects/-Users-clebercouto-Projects-we-expand/memory/` |

---

## 💡 Dicas pra próxima sessão

- Sempre rodar `npm run dev` antes de editar (hot reload funciona)
- Testar no browser: importar CSV fake, clicar "Meus leads", confirmar que Groq pontuou
- Não esquecer: env vars em `.env.local` + git init quando pronto
- Se quebrar algo, o preview do Claude Code mostra erros em tempo real
- Memória automática já tem tudo salvo em `.md` files — próxima sessão lê tudo automaticamente

---

**Última atualização**: 2026-06-25 (após implementação Groq + city/verification columns)

**Próximo focus**: Refinamento geográfico (cidades) + email/telefone visual + fluxo LinkedIn paste
