# REVOADA RJ - Metas STAFF

Projeto leve para gerenciamento de metas da staff do GTA RP REVOADA RJ, com painel web + bot do Discord. Persistência em JSON com backup automático e rotação mensal.

## Stack
- Node.js (CommonJS)
- discord.js (bot)
- Vercel Serverless (API em `api/`)
- Front-end puro em `public/`
- Storage em JSON via `StorageProvider`

## Estrutura
```
api/
src/bot/
src/services/
src/storage/
public/
data/ (dev)
```

## Requisitos
- Node.js 18+
- Token de bot Discord
- App OAuth2 Discord

## Variáveis de ambiente
Obrigatórias:

```
DISCORD_BOT_TOKEN=
GUILD_ID=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=
SESSION_SECRET=
ADMIN_API_KEY=
CH_TICKETS_ACEITOS_ID=
CH_TICKETS_NEGADOS_ID=
CH_REVISAO_ID=
CH_BANS_ID=
STAFF_ROLES_METAS=ROLE_ID_ESTAGIARIO,ROLE_ID_SUPORTE,ROLE_ID_MOD,ROLE_ID_ADM
STAFF_ALLOWED_ROLES=ROLE_ID_1,ROLE_ID_2
META_FALLBACK_ENABLED=true
INTERNAL_BOT_KEY=
STAFF_SYNC_URL=https://SEU_VERCEL_URL/api/internal/staffs/sync
```

Regras novas de metas:
```
CH_REVISAO_ALLOWED_CHANNELS=1447610409803583561,1447610616343822569
REVISAO_KEYWORDS=✅ RELATÓRIO REVISÃO-ACEITO,🏷 TICKET-REVISÃO NEGADO
META_REVISAO_REQUIRES_KEYWORD=true
META_REVISAO_COUNT_BOTS=true

CH_DENUNCIA_ALLOWED_CHANNELS=1447610409803583561,1447610286516342794
DENUNCIA_KEYWORDS=🛠 TICKET-DENÚNCIA NEGADO,📛 RELATÓRIO ADV/BAN
META_DENUNCIA_REQUIRES_KEYWORD=true
META_DENUNCIA_COUNT_BOTS=true

CH_BANHACK_CHANNEL_ID=1447610776419565668
BANHACK_KEYWORDS=👻 BAN HACK
META_BANHACK_REQUIRES_KEYWORD=true
META_BANHACK_COUNT_BOTS=true
```

Produção (Vercel Blob):
```
STORAGE_PROVIDER=vercel_blob
VERCEL_BLOB_READ_WRITE_TOKEN=
```

## Como rodar local
1. Instale dependências:
```
npm install
```

2. Configure `.env` com as variáveis acima.

3. Registre os slash commands:
```
npm run register:commands
```

4. Inicie o bot:
```
npm run bot
```

5. Para simular a API localmente, use `vercel dev` (recomendado) ou qualquer servidor estático + `node` para testar endpoints.

## Deploy no Vercel
- Faça deploy do repositório.
- Configure as ENV vars no painel do Vercel.
- Configure `STORAGE_PROVIDER=vercel_blob` e `VERCEL_BLOB_READ_WRITE_TOKEN`.
- O bot precisa rodar separado do Vercel (ex.: VPS/Render/Fly). O painel web e APIs ficam no Vercel.

## Fluxo de autenticação (performance)
- Login via Discord OAuth2.
- Validação de permissões **somente** para o usuário logado usando:
  `GET /users/@me/guilds/{GUILD_ID}/member`
- Não há listagem de membros (sem `guild.members.fetch()` em massa), evitando custo em servidores grandes.

## Lista de Staffs (event-driven)
- A lista é mantida pelo bot via `guildMemberUpdate`.
- Sempre baseada nos roles definidos em `STAFF_ROLES_METAS`.
- O bot envia updates para `/api/internal/staffs/sync`.
- O site lê a lista via `/api/staffs` (JSON local/Blob), sem consultar o Discord.

## Backup e rotação
- Backup automático a cada 30 minutos: `backups/metas-ativo-YYYY-MM-DD-HH-mm.json`
- Rotação mensal: `historico/metas-YYYY-MM.json` + reset de `metas-ativo.json` e `processadas.json`
- Comando admin no bot: `/rotacionar_mes`

## Endpoints
```
GET  /api/resumo?mes=YYYY-MM|atual
GET  /api/ranking?tipo=&cargo=&mes=YYYY-MM|atual
GET  /api/usuario?id=&mes=YYYY-MM|atual
GET  /api/historico?mes=YYYY-MM
GET  /api/metas?mes=YYYY-MM|atual
GET  /api/meses-disponiveis
GET  /api/staffs
POST /api/internal/staffs/sync
POST /api/internal/staffs/upsert
GET  /api/config
POST /api/config
POST /api/admin/rotacionar
```

## Config global
Exemplo de configuração salva em storage:
```
{
  "metaFallbackEnabled": true,
  "fallbackTags": {
    "TICKET_ACEITO": ["[TICKET ACEITO]"],
    "TICKET_NEGADO": ["[TICKET NEGADO]"],
    "BAN": ["[BAN]"],
    "REVISAO": ["[REVISAO]"]
  },
  "enabledMetaTypes": {
    "TICKET_ACEITO": true,
    "TICKET_NEGADO": true,
    "BAN": true,
    "REVISAO": true
  },
  "updatedAt": 1738190000,
  "version": 3
}
```

## Checklist de testes manuais
- Alterar tema → refresh → permanece
- Alterar fonte → refresh → permanece
- Alterar densidade → refresh → permanece
- Salvar tags fallback → recarregar config → permanece
- Usuário sem permissão → erro claro
- Bot com INTERNAL_BOT_KEY → consegue ler `/api/config`
- Trocar mês no dashboard e ranking → dados mudam
- Staffs aparecem após mudança de role (guildMemberUpdate)

## Observações
- `data/` é usado apenas em dev (Storage local).
- Alertas no front-end são próprios (toasts), sem `alert()`.
```