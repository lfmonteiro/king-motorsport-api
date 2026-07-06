const OrdemDeServico = require("../models/OrdemDeServico");
const Lancamento = require("../models/Lancamento");
const { notificar } = require("../services/pushService");
const { notificarAdmin, notificarCliente } = require("../services/whatsappService");

const listar = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.clienteId) filtro.clienteId = req.query.clienteId;
    if (req.query.veiculoId) filtro.veiculoId = req.query.veiculoId;
    if (req.query.status) filtro.status = req.query.status;
    const ordens = await OrdemDeServico.find(filtro)
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa ano")
      .sort({ createdAt: -1 });
    res.json(ordens);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const buscarPorId = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.findById(req.params.id)
      .populate("clienteId", "nome telefone cpf email endereco")
      .populate("veiculoId", "marca modelo placa ano cor km");
    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });
    res.json(ordem);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const criar = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.create(req.body);
    const populada = await OrdemDeServico.findById(ordem._id)
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa ano");

    notificar(
      "🔧 Nova OS criada",
      `OS #${String(populada.numero).padStart(2, "0")} — ${populada.clienteId?.nome} · ${populada.veiculoId?.placa}`,
      ["admin"]
    );
    notificar(
      "🔧 Nova OS disponível",
      `OS #${String(populada.numero).padStart(2, "0")} — ${populada.descricao}`,
      ["mecanico"]
    );

    // WhatsApp para admin
    notificarAdmin(
      `🏁 *King Motorsport* — Nova OS criada!\n\n` +
      `📋 *OS #${String(populada.numero).padStart(2, "0")}*\n` +
      `👤 *Cliente:* ${populada.clienteId?.nome}\n` +
      `🚗 *Veículo:* ${populada.veiculoId?.marca} ${populada.veiculoId?.modelo} — ${populada.veiculoId?.placa}\n` +
      `🔧 *Serviço:* ${populada.descricao}\n\n` +
      `🔗 https://kingmotorsport.netlify.app`
    );

    res.status(201).json(populada);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

const atualizar = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    })
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa ano");
    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });
    res.json(ordem);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

const atualizarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const statusValidos = ["aberta", "em-andamento", "concluida", "cancelada"];
    if (!statusValidos.includes(status)) return res.status(400).json({ erro: "Status inválido" });

    const ordem = await OrdemDeServico.findById(req.params.id)
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa");
    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });

    const statusAnterior = ordem.status;
    ordem.status = status;
    await ordem.save();

    const statusLabel = { "aberta": "Aberta", "em-andamento": "Em Andamento", "concluida": "Concluída", "cancelada": "Cancelada" }[status];

    notificar(`🔄 OS #${String(ordem.numero).padStart(2, "0")} — ${statusLabel}`, `${ordem.clienteId?.nome} · ${ordem.veiculoId?.placa}`, ["admin"]);
    notificar(`🔄 OS #${String(ordem.numero).padStart(2, "0")} — ${statusLabel}`, `${ordem.descricao}`, ["mecanico"]);

    // Se concluída — lançamento + WhatsApp para cliente
    if (status === "concluida" && statusAnterior !== "concluida") {
      const jaExiste = await Lancamento.findOne({ osId: ordem._id });
      if (!jaExiste) {
        const total = [...(ordem.servicos || []), ...(ordem.pecasMecanico || [])]
          .reduce((s, i) => s + Number(i.valor || 0), 0);

        if (total > 0) {
          await Lancamento.create({
            tipo: "entrada", valor: total,
            descricao: `OS #${String(ordem.numero).padStart(2, "0")} — ${ordem.descricao}`,
            categoria: "os", data: new Date(), osId: ordem._id, origem: "os"
          });
          notificar("💰 Caixa atualizado", `OS #${String(ordem.numero).padStart(2, "0")} concluída — entrada registrada`, ["admin"]);
        }

        // WhatsApp para o cliente
        const telefone = ordem.clienteId?.telefone;
        if (telefone) {
          const totalFmt = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          const linkRecibo = `https://kingmotorsport.pages.dev/recibo/${ordem._id}`;
          notificarCliente(telefone,
            `🏁 *King Motorsport* — Veículo pronto!\n\n` +
            `Olá, *${ordem.clienteId?.nome}*! Seu veículo *${ordem.veiculoId?.placa}* está pronto para retirada.\n\n` +
            `📋 *OS #${String(ordem.numero).padStart(2, "0")}*\n` +
            `🔧 *Serviço:* ${ordem.descricao}\n` +
            `💰 *Total:* ${totalFmt}\n\n` +
            `📄 *Seu recibo:*\n${linkRecibo}\n\n` +
            `📍 Rua Djalma Pessolato, 203 — São Paulo/SP\n` +
            `📞 (11) 95989-1402\n\n` +
            `_Agradecemos a preferência! 🏎️_`
          );
        }
      }
    }

    res.json(ordem);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const remover = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.findByIdAndDelete(req.params.id);
    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });
    res.json({ mensagem: "Ordem removida com sucesso" });
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const dashboard = async (req, res) => {
  try {
    const [totalClientes, totalVeiculos, ordens] = await Promise.all([
      require("../models/Cliente").countDocuments(),
      require("../models/Veiculo").countDocuments(),
      OrdemDeServico.find(),
    ]);
    const resumo = {
      totalClientes, totalVeiculos,
      totalOS: ordens.length,
      abertas: ordens.filter((o) => o.status === "aberta").length,
      emAndamento: ordens.filter((o) => o.status === "em-andamento").length,
      concluidas: ordens.filter((o) => o.status === "concluida").length,
      faturamento: ordens.filter((o) => o.status === "concluida").reduce((s, o) => {
        return s + (o.servicos || []).reduce((a, i) => a + i.valor, 0) + (o.pecasMecanico || []).reduce((a, i) => a + i.valor, 0);
      }, 0),
    };
    res.json(resumo);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const buscarReciboPublico = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.findById(req.params.id)
      .populate("clienteId", "nome telefone cpf email endereco")
      .populate("veiculoId", "marca modelo placa ano cor km");
    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });
    res.json(ordem);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

module.exports = { listar, buscarPorId, criar, atualizar, atualizarStatus, remover, dashboard, buscarReciboPublico };
