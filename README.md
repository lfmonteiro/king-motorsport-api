# 🔧 King Motorsport API

Backend Node.js + Express + MongoDB para o sistema de gestão da oficina.

---

## 📁 Estrutura do projeto

```
king-motorsport-api/
├── src/
│   ├── server.js              ← ponto de entrada
│   ├── database.js            ← conexão MongoDB
│   ├── models/
│   │   ├── Cliente.js
│   │   ├── Veiculo.js
│   │   └── OrdemDeServico.js
│   ├── controllers/
│   │   ├── clienteController.js
│   │   ├── veiculoController.js
│   │   └── ordemController.js
│   └── routes/
│       ├── clientes.js
│       ├── veiculos.js
│       └── ordens.js
├── ecosystem.config.js        ← configuração PM2
├── .env.example               ← modelo de variáveis de ambiente
└── package.json
```

---

## 🚀 Passo a passo para subir

### 1. Criar banco no MongoDB Atlas (gratuito)

1. Acesse https://cloud.mongodb.com e crie uma conta gratuita
2. Clique em **"Build a Database"** → escolha **M0 (Free)**
3. Escolha a região **São Paulo (sa-east-1)**
4. Em **"Security"**, crie um usuário e senha (ex: `king` / `sua_senha_forte`)
5. Em **"Network Access"**, adicione `0.0.0.0/0` para liberar acesso externo
6. Clique em **"Connect"** → **"Drivers"** → copie a connection string:
   ```
   mongodb+srv://king:sua_senha@cluster0.xxxxx.mongodb.net/king-motorsport?retryWrites=true&w=majority
   ```

---

### 2. Configurar o projeto

```bash
# Clone ou copie a pasta para seu servidor/VPS
cd king-motorsport-api

# Instale as dependências
npm install

# Crie o arquivo .env baseado no exemplo
cp .env.example .env
```

Edite o `.env` com seus dados reais:
```env
MONGODB_URI=mongodb+srv://king:SUA_SENHA@cluster0.xxxxx.mongodb.net/king-motorsport?retryWrites=true&w=majority
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

---

### 3. Testar localmente

```bash
npm run dev
# Deve aparecer:
# ✅ MongoDB conectado com sucesso
# 🚀 King Motorsport API rodando na porta 3001
```

Teste no browser: http://localhost:3001

---

### 4. Subir com PM2 (produção)

```bash
# Crie a pasta de logs
mkdir logs

# Inicie com PM2
pm2 start ecosystem.config.js

# Verificar se está rodando
pm2 status

# Ver logs em tempo real
pm2 logs king-motorsport-api

# Configurar para reiniciar automaticamente no boot
pm2 startup
pm2 save
```

---

## 📡 Rotas da API

### Health check
```
GET /
```

### Clientes
```
GET    /clientes              → lista todos (query: ?busca=nome)
GET    /clientes/:id          → busca um
POST   /clientes              → cria novo
PUT    /clientes/:id          → atualiza
DELETE /clientes/:id          → remove
```

### Veículos
```
GET    /veiculos              → lista todos (query: ?clienteId=xxx)
GET    /veiculos/:id          → busca um
POST   /veiculos              → cria novo
PUT    /veiculos/:id          → atualiza
DELETE /veiculos/:id          → remove
```

### Ordens de Serviço
```
GET    /ordens/dashboard      → resumo para o painel
GET    /ordens                → lista todas (query: ?status=aberta&clienteId=xxx)
GET    /ordens/:id            → busca uma (populada com cliente e veículo)
POST   /ordens                → cria nova OS
PUT    /ordens/:id            → atualiza OS completa
PATCH  /ordens/:id/status     → atualiza só o status
DELETE /ordens/:id            → remove
```

---

## 📦 Exemplos de payload

### Criar cliente
```json
POST /clientes
{
  "nome": "Rafael Mendes",
  "telefone": "(11) 98765-4321",
  "cpf": "123.456.789-00",
  "email": "rafael@email.com",
  "endereco": "Rua das Flores, 123 - SP"
}
```

### Criar veículo
```json
POST /veiculos
{
  "clienteId": "ID_DO_CLIENTE",
  "marca": "Honda",
  "modelo": "Civic",
  "ano": "2020",
  "placa": "ABC-1234",
  "cor": "Preto",
  "km": 62000
}
```

### Criar OS
```json
POST /ordens
{
  "clienteId": "ID_DO_CLIENTE",
  "veiculoId": "ID_DO_VEICULO",
  "descricao": "Revisão completa + troca de óleo",
  "data": "2024-06-13",
  "status": "aberta",
  "km": 62000,
  "servicos": [
    { "desc": "Troca de óleo 5W30", "valor": 120 },
    { "desc": "Revisão geral", "valor": 200 }
  ],
  "pecas": [
    { "desc": "Óleo Mobil 5L", "valor": 89 }
  ],
  "observacoes": "Próxima revisão em 10.000 km"
}
```

### Alterar status
```json
PATCH /ordens/:id/status
{
  "status": "concluida"
}
```
