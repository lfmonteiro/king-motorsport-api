# Central Workflow 4.9 — Registro de Sessão
**Data:** 19/06/2026  
**Sistema:** Central de Aprovações Protheus + Node.js  
**Versão base:** v4.8 → desenvolvimento v4.9

---

## 1. Documentos de Entrada

### 1.1 Resumo Técnico v4.8 (colado no início)

Documento completo com toda a infraestrutura, credenciais, status dos arquivos Protheus, mapeamento de rotas Node.js, funcionalidades do dashboard e roadmap até v5.0.

**Infraestrutura principal:**

| Serviço | Endereço |
|---------|----------|
| Protheus AppServer REST | http://10.0.0.124:40001 |
| Protheus WebApp | https://10.0.0.124:10001/webapp/ |
| Node.js Workflow | http://10.0.0.124:3000 |
| Evolution API WhatsApp | http://localhost:8081 |
| Ngrok (dinâmico) | https://masculine-plenty-suave.ngrok-free.dev |
| Dashboard usuário | http://10.0.0.124:3000/dashboard |
| Dashboard admin | http://10.0.0.124:3000/dashboard?key=admin123 |

**Inicialização:** `cd C:\Workflow_node && node start-all.js`  
**PM2:** `pm2 restart workflow-node` após alterar server.js  
**Logs:** `pm2 logs workflow-node --lines 30`

---

## 2. Análise do Sistema — Entendimento Geral

### O que é o sistema
Uma **Central de Aprovações** que integra o Protheus (TOTVS) com um middleware Node.js para disparar e gerenciar aprovações de **Solicitações de Compra (SC)** e **Pedidos de Compra (PC)**, com notificações por **e-mail + WhatsApp** (via Evolution API) e um **dashboard** de acompanhamento. Está na **v4.8**, com a grande maioria dos fluxos validados em produção.

### Arquitetura em camadas

**Protheus** → Pontos de Entrada (`mt110stts`, `wfw120p`, `avalcot`, `avalcopc`, `mt120fim`) → Roteador central (`central_workflow.prw`) → REST (`rest_workflow_pc`, `rest_workflow_sc`)

**Node.js** (`server.js`, 2319 linhas) → roteamento de workflow, proxies de aprovar/rejeitar, notificações, dashboard

**Ngrok** → expõe o Node para os links clicáveis nas mensagens

### Fluxo do modal de itens
```
abrirDetalhes()  [frontend, dentro do server.js]
   → fetch GET /dashboard/detalhes?numero=...&tipo=...&filial=...   [rota Node]
       → GET /rest/dashboardWF/itensSC|itensPC   [Protheus, rest_dashboard_wf.prw]
```

### Decisões de arquitetura importantes
- REST **não carrega funções `U_` de outros fontes** → SQL inline
- SY1 usa **`Y1_USER`** (código interno) e **`Y1_FILIAL` vazio** (sem filtro de filial)
- Solicitante de PC vem do **`solicitantes.json`**, não da `SYS_USR`

---

## 3. Análise do `rest_dashboard_wf.prw`

### Arquivo enviado pelo usuário
Arquivo Protheus com 491 linhas — endpoints REST do dashboard.

### Descoberta principal
O resumo v4.8 apontava `GetQueryString()` como causa raiz do problema. **Isso não é mais verdade nesta versão do arquivo.** O código já foi migrado para o padrão **WSDATA**:

```advpl
WSDATA numSC  AS STRING
WSDATA numPed AS STRING
WSDATA filial AS STRING
```

E o consumo nos endpoints:
```advpl
Local cNumSC   := AllTrim(Self:numSC)    // itensSC
Local cNumPed  := AllTrim(Self:numPed)   // itensPC
```

### Causa raiz real — mismatch de nome de parâmetro

O frontend/Node envia:
```
/dashboard/detalhes?numero=MTZ117&tipo=SC&filial=01
```

O parâmetro chama-se **`numero`** — mas o WSDATA espera **`numSC`** ou **`numPed`**. Resultado: `Self:numSC` chega **vazio**, a query vira `WHERE C1_NUM = ''`, e o array de itens volta `[]`.

> O endpoint `/dados` que "funciona" **não lê nenhum parâmetro** — por isso nunca foi prova de que o WSDATA funcionava. Ele simplesmente não usa WSDATA.

### Diagnóstico rápido (sem alterar código)

Chamar direto no navegador com o nome que o código espera:
```
https://masculine-plenty-suave.ngrok-free.dev/rest/dashboardWF/itensSC?numSC=MTZ117&filial=01
```
Se retornar itens → confirmado: problema só no nome do parâmetro.

### Correção proposta — alinhar tudo em `numero`

**1) Declaração WSDATA (linhas 14-16) — adicionar `numero`:**
```advpl
WSDATA numero AS STRING
WSDATA numSC  AS STRING
WSDATA numPed AS STRING
WSDATA filial AS STRING
```

**2) `itensSC` (linha 411):**
```advpl
Local cNumSC   := AllTrim(Self:numero)
```

**3) `itensPC` (linha 452):**
```advpl
Local cNumPed  := AllTrim(Self:numero)
```

> Após a edição: recompilar o `.prw` e atualizar o RPO. Não é necessário `pm2 restart` — isso é só para o Node.js.

### Ponto a confirmar no server.js
A rota `/dashboard/detalhes` precisa repassar `numero` e `filial` corretamente:
- `tipo == "SC"` → `GET /rest/dashboardWF/itensSC?numero=<num>&filial=<fil>`
- `tipo` PCDIR/PCNFC → `GET /rest/dashboardWF/itensPC?numero=<num>&filial=<fil>`

---

## 4. Pergunta — Qual arquivo gera o dashboard em tela?

**Resposta:** É o **`server.js`**.

A rota `GET /dashboard` dentro do `server.js` monta e serve todo o HTML/CSS/JS do frontend (estrutura das abas, cards KPI, gráficos e função `abrirDetalhes()` do modal).

O `rest_dashboard_wf.prw` **não gera tela** — ele só devolve JSON.

---

## 5. Problema — Multi-filial não suportado

### Contexto
O usuário criou uma SC pela **Filial 02**. O pedido bloqueou (ficou Pendente/Violeta), mas **não disparou email nem WhatsApp**.

### Conclusão
O sistema **não está preparado para múltiplas filiais**.

### Evidência nos logs
```
[WORKFLOW SC] Solicitacao: FIL01
```
O campo `Solicitacao` está vindo como **`FIL01`** — código está enviando a filial 01 como identificador, possivelmente porque `xFilial()` retorna a filial padrão e não a filial do contexto da operação.

### Onde estão os pontos cegos

| Ponto | Problema |
|---|---|
| `aprovadores.json` | Sem distinção por filial — estrutura flat |
| `solicitantes.json` | Sem vínculo de filial — falha silenciosa se solicitante da Filial 02 não cadastrado |
| PEs (`mt110stts.prw` / `wfw120p.prw`) | `xFilial()` pode estar retornando Filial 01 independente do contexto |
| `central_workflow.prw` | Payload JSON enviado ao Node pode não conter a filial correta |
| `server.js` | Sem lógica de roteamento por filial |

### O que precisa ser ajustado para suportar multi-filial

| Ponto | Ajuste necessário |
|---|---|
| `mt110stts.prw` / `wfw120p.prw` | Garantir filial real do documento, não `xFilial()` genérico |
| `central_workflow.prw` | Passar filial correta no payload JSON ao Node |
| `server.js` | Rotear aprovador/solicitante por filial |
| `aprovadores.json` | Estrutura por filial: `{ "01": {...}, "02": {...} }` |
| `solicitantes.json` | Idem — ou buscar solicitante via query no Protheus pela filial |
| Dashboard | Filtrar dados por filial (hoje traz tudo junto) |

### Problema secundário identificado no log
```
[WHATSAPP] Erro ao enviar para 5511981001443: Request failed with status code 500
```
A **Evolution API** retornou erro 500. Possível desconexão do WhatsApp na instância `workflow-protheus`. Verificar em `http://localhost:8081`.

---

## 6. Pergunta — Porta do Ngrok

**Resposta:** O Ngrok não tem porta fixa — usa URL dinâmica:

```
https://masculine-plenty-suave.ngrok-free.dev
```

Faz túnel para o Node.js na porta **3000** internamente (`http://10.0.0.124:3000`). A URL muda a cada reinicialização do Ngrok.

> **Dica:** Para URL permanente, o plano gratuito do Ngrok permite um domínio estático. Configurar no `start-all.js` com `--domain=seu-dominio.ngrok-free.app`.

---

## 7. Roadmap da Sessão

### v4.9 — Em desenvolvimento
- [ ] Corrigir itens no modal — ajuste WSDATA (`numero` → `Self:numSC` / `Self:numPed`)
- [ ] Verificar rota `/dashboard/detalhes` no `server.js`
- [ ] Suporte a multi-filial (aprovadores, solicitantes, PEs, Node)
- [ ] Investigar erro 500 na Evolution API (WhatsApp desconectado?)

### Próximos passos acordados
1. Usuário enviará o `server.js` para análise da rota `/dashboard/detalhes` e função `abrirDetalhes()`
2. Ajuste completo ponta a ponta para fechar a v4.9

---

## 8. Arquivos Analisados nesta Sessão

| Arquivo | Origem | Resultado |
|---------|--------|-----------|
| Resumo técnico v4.8 | Colado pelo usuário | Lido e analisado — base do contexto |
| `rest_dashboard_wf.prw` | Upload | Causa raiz do modal identificada — mismatch de nome de parâmetro |
| Logs PM2 (`pm2 logs`) | Colado pelo usuário | Evidência do problema de filial (`FIL01`) e erro WhatsApp (500) |

---

*Sessão registrada em 19/06/2026 — Central Workflow v4.9*
