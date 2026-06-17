const OrdemDeServico = require("../models/OrdemDeServico");
const Lancamento = require("../models/Lancamento");

// GET /ordens — lista todas (com filtros opcionais)
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
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// GET /ordens/:id
const buscarPorId = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.findById(req.params.id)
      .populate("clienteId", "nome telefone cpf email endereco")
      .populate("veiculoId", "marca modelo placa ano cor km");

    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });
    res.json(ordem);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// POST /ordens — cria nova OS
const criar = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.create(req.body);
    const populada = await OrdemDeServico.findById(ordem._id)
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa ano");
    res.status(201).json(populada);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// PUT /ordens/:id — atualiza OS
const atualizar = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    })
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa ano");

    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });
    res.json(ordem);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// PATCH /ordens/:id/status — atualiza só o status
// Se status = "concluida", cria lançamento automático no caixa
const atualizarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const statusValidos = ["aberta", "em-andamento", "concluida", "cancelada"];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }

    const ordem = await OrdemDeServico.findById(req.params.id)
      .populate("clienteId", "nome")
      .populate("veiculoId", "marca modelo placa");

    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });

    const statusAnterior = ordem.status;
    ordem.status = status;
    await ordem.save();

    // Se concluída e ainda não tinha lançamento, cria entrada no caixa
    if (status === "concluida" && statusAnterior !== "concluida") {
      const jaExiste = await Lancamento.findOne({ osId: ordem._id });
      if (!jaExiste) {
        const total = [
          ...(ordem.servicos || []),
          ...(ordem.pecasMecanico || [])
        ].reduce((s, i) => s + Number(i.valor || 0), 0);

        if (total > 0) {
          await Lancamento.create({
            tipo: "entrada",
            valor: total,
            descricao: `OS #${String(ordem.numero).padStart(2, "0")} — ${ordem.descricao}`,
            categoria: "os",
            data: new Date(),
            osId: ordem._id,
            origem: "os"
          });
        }
      }
    }

    res.json(ordem);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// DELETE /ordens/:id
const remover = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.findByIdAndDelete(req.params.id);
    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });
    res.json({ mensagem: "Ordem removida com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// GET /ordens/dashboard
const dashboard = async (req, res) => {
  try {
    const [totalClientes, totalVeiculos, ordens] = await Promise.all([
      require("../models/Cliente").countDocuments(),
      require("../models/Veiculo").countDocuments(),
      OrdemDeServico.find(),
    ]);

    const resumo = {
      totalClientes,
      totalVeiculos,
      totalOS: ordens.length,
      abertas: ordens.filter((o) => o.status === "aberta").length,
      emAndamento: ordens.filter((o) => o.status === "em-andamento").length,
      concluidas: ordens.filter((o) => o.status === "concluida").length,
      faturamento: ordens
        .filter((o) => o.status === "concluida")
        .reduce((s, o) => {
          const maoObra = (o.servicos || []).reduce((a, i) => a + i.valor, 0);
          const pecasMec = (o.pecasMecanico || []).reduce((a, i) => a + i.valor, 0);
          return s + maoObra + pecasMec;
        }, 0),
    };

    res.json(resumo);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, atualizarStatus, remover, dashboard };