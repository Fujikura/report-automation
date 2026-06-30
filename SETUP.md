# 🚀 Automação de Relatório WhatsApp - Guia de Setup

## Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn
- Credenciais de acesso ao site https://rctretail.net/ts/index.php

## 📋 Instalação

### 1. Clone ou copie os arquivos
```bash
# Crie uma pasta para o projeto
mkdir whatsapp-report-automation
cd whatsapp-report-automation

# Copie os arquivos:
# - server.js
# - package.json
```

### 2. Instale as dependências
```bash
npm install
```

Isso vai instalar:
- **express** - servidor web
- **cors** - permitir chamadas do painel
- **playwright** - automação do browser

⏳ Primeira execução pode levar alguns minutos (Playwright baixa o navegador)

### 3. Configure as credenciais

**Opção A: Usando arquivo .env (recomendado e seguro) ⭐**

1. Crie um arquivo `.env` na pasta do projeto:
   ```
   REPORT_USERNAME=seu_usuario
   REPORT_PASSWORD=sua_senha
   REPORT_URL=https://rctretail.net/ts/index.php
   PORT=3001
   ```

2. Ou copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   # Edite o .env com suas credenciais
   ```

3. O servidor vai ler automaticamente as credenciais do `.env` quando iniciar

**Opção B: Variáveis de ambiente do sistema**
```bash
# Linux/Mac:
export REPORT_USERNAME="seu_usuario"
export REPORT_PASSWORD="sua_senha"
npm start

# Windows PowerShell:
$env:REPORT_USERNAME="seu_usuario"
$env:REPORT_PASSWORD="sua_senha"
npm start
```

**Opção C: Digite no painel**
Deixe em branco no `.env` e o painel vai pedir credenciais a cada uso

⚠️ **IMPORTANTE: Nunca faça commit do arquivo `.env` com suas credenciais!**
Adicione `.env` ao `.gitignore`

### 4. Inicie o servidor
```bash
npm start
```

Você deve ver:
```
🚀 Servidor rodando em http://localhost:3001
📡 Endpoint: POST http://localhost:3001/api/submit-report
```

✅ Servidor pronto!

---

## 🔌 Como usar

### 1. Acesse o painel React
Abra o arquivo `painel.html` no seu navegador (duplo clique ou arrastar para browser)

### 2. Credenciais
Na primeira vez, o painel vai verificar se as credenciais estão no `.env`

Se configuradas no `.env`: Não precisa preencher nada
Se não configuradas: Clique em "Mostrar" na seção de configuração e preencha

### 3. Upload do arquivo
- Arraste o arquivo .txt exportado do WhatsApp
- Revise os dados na tabela

### 4. Selecione o mês
- O painel automaticamente agrupa os registros por mês
- Use o dropdown "📅 Selecione um mês" para escolher qual mês preencher
- Mostra quantos registros tem naquele mês

### 5. Selecione os registros do mês
- Por padrão, todos os registros do mês estão selecionados
- Você pode desselecionar registros específicos se quiser

### 6. Clique em "Preencher Site"
O servidor vai:
1. ✅ Fazer login no site (usando credenciais do .env)
2. ✅ Navegar para o projeto PS_012-20D
3. ✅ Preencher cada registro do mês selecionado
4. ✅ Submeter os formulários
5. ✅ Retornar o status

### 7. Repita para próximos meses
Mude o dropdown para o próximo mês e clique "Preencher Site" novamente

---

## 📊 Fluxo da automação

```
Painel React (browser)
        ↓
    [Upload .txt]
        ↓
  [Parse dados]
        ↓
  [Preview tabela]
        ↓
  [Botão "Preencher"]
        ↓
    POST /api/submit-report
        ↓
Servidor Node.js (localhost:3001)
        ↓
  [Playwright browser]
        ↓
  [Login no site]
        ↓
  [Clica projeto]
        ↓
  [Loop: preenche cada registro]
        ↓
  [Retorna sucesso/erro]
        ↓
Painel exibe resultado ✅
```

---

## 🧪 Testando

### Verificar se o servidor está rodando
```bash
curl http://localhost:3001/api/health
```

Resposta esperada:
```json
{"status":"ok","server":"running"}
```

### Testar com curl (avançado)
```bash
curl -X POST http://localhost:3001/api/submit-report \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_usuario",
    "password": "sua_senha",
    "records": [
      {
        "date": "30/06/2026",
        "entrada": "09:00",
        "almoco": "12:30",
        "retorno": "14:00",
        "saida": "18:00",
        "descricao": "HOME OFFICE"
      }
    ]
  }'
```

---

## 🐛 Troubleshooting

### "Error: connect ECONNREFUSED 127.0.0.1:3001"
→ O servidor não está rodando. Execute `npm start`

### "Timeout waiting for navigation"
→ O site pode estar lento. Aumente os timeouts em server.js:
```javascript
await page.goto(..., { waitUntil: 'networkidle', timeout: 30000 });
```

### "Login failed"
→ Credenciais incorretas. Verifique no site manualmente

### "Cannot find element"
→ HTML do site mudou. Pode ser necessário atualizar os seletores em server.js

---

## 🔒 Segurança

⚠️ **NÃO faça isso em produção:**
- Armazenar senhas em código
- Expor o servidor na internet sem autenticação

✅ **Melhorias para produção:**
```bash
# Use variáveis de ambiente
REPORT_USERNAME=xxx npm start

# Use .env com dotenv
npm install dotenv
# Crie .env com REPORT_USERNAME=xxx

# Use autenticação JWT
npm install jsonwebtoken
```

---

## 📝 Ajustes comuns

### Mudar porta do servidor
```bash
PORT=3002 npm start
```

### Modo debug (ver navegador aberto)
No server.js, mude:
```javascript
const browser = await chromium.launch({ headless: false }); // ← mude para false
```

### Adicionar delay entre registros
No server.js, após submitir cada registro:
```javascript
await page.waitForTimeout(2000); // 2 segundos
```

---

## 📞 Próximos passos

1. ✅ Teste com um arquivo pequeno (2-3 dias)
2. ✅ Verifique se os dados foram preenchidos no site
3. ✅ Se tudo ok, envie mês completo
4. ✅ Agende para rodar mensalmente com cron (Linux/Mac) ou Task Scheduler (Windows)

### Agendar no Linux/Mac
```bash
# Crontab: rodar todo dia 1º do mês às 9h
0 9 1 * * cd ~/whatsapp-report-automation && npm start
```

---

Qualquer dúvida, é só me chamar! 🚀
