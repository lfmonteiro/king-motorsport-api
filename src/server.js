require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conectar = require("./database");

// ─── Rotas ────────────────────────────────────────────────────────────────────
const clientesRoutes = require("./routes/clientes");
const veiculosRoutes = require("./routes/veiculos");
const ordensRoutes = require("./routes/ordens");

const app = express();

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// ─── Rota de health check ─────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    sistema: "King Motorsport API",
    versao: "1.0.0",
    rotas: ["/clientes", "/veiculos", "/ordens", "/ordens/dashboard"],
  });
});

// ─── Rotas da API ─────────────────────────────────────────────────────────────
app.use("/clientes", clientesRoutes);
app.use("/veiculos", veiculosRoutes);
app.use("/ordens", ordensRoutes);

// ─── Handler de rotas não encontradas ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: `Rota ${req.method} ${req.path} não encontrada` });
});

// ─── Handler de erros globais ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Erro:", err.message);
  res.status(500).json({ erro: "Erro interno no servidor" });
});

// ─── Inicialização ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

conectar().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 King Motorsport API rodando na porta ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}`);
  });
});
