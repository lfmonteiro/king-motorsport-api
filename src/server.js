require("dotenv").config();
const express = require("express");
const cors = require("cors");
const conectar = require("./database");

// ─── Rotas ────────────────────────────────────────────────────────────────────
const clientesRoutes = require("./routes/clientes");
const veiculosRoutes = require("./routes/veiculos");
const ordensRoutes = require("./routes/ordens");
const emailRoutes = require("./routes/email");
const agendamentosRoutes = require("./routes/agendamentos");
const authRoutes = require("./routes/auth");
const lancamentosRoutes = require("./routes/lancamentos");
const pushRoutes = require("./routes/push");
const { autenticar } = require("./middleware/auth");

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
    rotas: ["/clientes", "/veiculos", "/ordens", "/ordens/dashboard", "/email/os"],
  });
});

// ─── Rotas da API ─────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/push", pushRoutes);
app.use("/agendamentos", agendamentosRoutes);          // público + autenticado no mesmo router
app.use("/clientes", clientesRoutes);
app.use("/veiculos", autenticar, veiculosRoutes);

// Rota pública de recibo — sem autenticação
const { buscarReciboPublico } = require("./controllers/ordemController");
app.get("/ordens/publica/:id", buscarReciboPublico);

app.use("/ordens", autenticar, ordensRoutes);
app.use("/email", autenticar, emailRoutes);
app.use("/lancamentos", autenticar, lancamentosRoutes);

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
  agendarJobRevisao();
  app.listen(PORT, () => {
    console.log(`🚀 King Motorsport API rodando na porta ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}`);
  });
});

// ─── Job diário — lembrete de revisão por tempo ──────────────────────────────
const { notificarCliente, notificarAdmin } = require("./services/whatsappService");
const OrdemDeServico = require("./models/OrdemDeServico");

const executarLembretesRevisao = async () => {
  try {
    console.log("⏰ Verificando lembretes de revisão...");
    const MESES = 6;
    const limite = new Date();
    limite.setMonth(limite.getMonth() - MESES);

    // OS concluídas há mais de X meses que têm proximaRevisao definido
    const ordens = await OrdemDeServico.find({
      status: "concluida",
      updatedAt: { $lte: limite },
      proximaRevisao: { $exists: true, $ne: "" },
    })
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa");

    // Verifica se já houve uma OS mais recente para o mesmo veículo
    let enviados = 0;
    for (const os of ordens) {
      const osRecente = await OrdemDeServico.findOne({
        veiculoId: os.veiculoId?._id,
        createdAt: { $gt: os.updatedAt },
      });
      if (osRecente) continue; // já voltou para revisão

      const telefone = os.clienteId?.telefone;
      const nome = os.clienteId?.nome;
      const placa = os.veiculoId?.placa;
      const modelo = `${os.veiculoId?.marca || ""} ${os.veiculoId?.modelo || ""}`.trim();

      if (telefone && nome) {
        notificarCliente(telefone,
          `🔔 *King Motorsport* — Hora da revisão!\n\n` +
          `Olá, *${nome}*! Faz mais de ${MESES} meses desde a última revisão do seu veículo *${modelo} (${placa})*.\n\n` +
          `Recomendamos verificar:\n` +
          `• Óleo e filtros\n` +
          `• Freios e pneus\n` +
          `• Fluidos em geral\n\n` +
          `📅 Agende agora:\n🔗 https://kingmotorsport.pages.dev/agendar\n📞 (11) 95989-1402\n\n` +
          `_King Motorsport — Cuidando do seu veículo! 🏎️_`
        );
        enviados++;
        await new Promise(r => setTimeout(r, 1000)); // delay entre envios
      }
    }

    if (enviados > 0) {
      notificarAdmin(`📊 *Lembretes de revisão enviados:* ${enviados} clientes notificados hoje.`);
    }
    console.log(`✅ Lembretes de revisão: ${enviados} enviados.`);
  } catch (err) {
    console.error("Erro no job de revisão:", err.message);
  }
};

// Roda uma vez ao iniciar (após 30s) e depois todo dia às 9h
const agendarJobRevisao = () => {
  setTimeout(async () => {
    await executarLembretesRevisao();
    // Agendar para rodar diariamente
    const agendarProximo = () => {
      const agora = new Date();
      const proximo = new Date();
      proximo.setHours(9, 0, 0, 0);
      if (proximo <= agora) proximo.setDate(proximo.getDate() + 1);
      const ms = proximo - agora;
      console.log(`⏰ Próximo lembrete de revisão em ${Math.round(ms / 3600000)}h`);
      setTimeout(async () => { await executarLembretesRevisao(); agendarProximo(); }, ms);
    };
    agendarProximo();
  }, 30000);
};
