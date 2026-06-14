const OrdemDeServico = require("../models/OrdemDeServico");

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
    // Busca populada para retornar ao frontend
    const populada = await OrdemDeServico.findById(ordem._id)
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa ano");
    res.status(201).json(populada);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// PUT /ordens/:id — atualiza OS (inclusive status)
const atualizar = async (req, res) => {
  try {
    const ordem = await OrdemDeServico.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
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
const atualizarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const statusValidos = ["aberta", "em-andamento", "concluida", "cancelada"];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    const ordem = await OrdemDeServico.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ordem) return res.status(404).json({ erro: "Ordem não encontrada" });
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

// GET /ordens/dashboard — resumo para o painel
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
        .reduce((s, o) => s + o.total, 0),
    };

    res.json(resumo);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, atualizarStatus, remover, dashboard };
