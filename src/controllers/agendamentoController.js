const Agendamento = require("../models/Agendamento");
const OrdemDeServico = require("../models/OrdemDeServico");
const Cliente = require("../models/Cliente");
const Veiculo = require("../models/Veiculo");

// GET /agendamentos?mes=6&ano=2026
const listar = async (req, res) => {
  try {
    const { mes, ano, data } = req.query;
    let filtro = {};

    if (data) {
      const inicio = new Date(data);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(data);
      fim.setHours(23, 59, 59, 999);
      filtro.data = { $gte: inicio, $lte: fim };
    } else if (mes && ano) {
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 0, 23, 59, 59);
      filtro.data = { $gte: inicio, $lte: fim };
    }

    const agendamentos = await Agendamento.find(filtro)
      .populate("clienteId", "nome telefone")
      .populate("veiculoId", "marca modelo placa")
      .sort({ data: 1, horario: 1 });

    res.json(agendamentos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// GET /agendamentos/:id
const buscarPorId = async (req, res) => {
  try {
    const ag = await Agendamento.findById(req.params.id)
      .populate("clienteId", "nome telefone email")
      .populate("veiculoId", "marca modelo placa ano");
    if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado" });
    res.json(ag);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// POST /agendamentos — interno (mecânico)
const criar = async (req, res) => {
  try {
    const ag = await Agendamento.create({ ...req.body, origem: "interno" });
    res.status(201).json(ag);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// POST /agendamentos/publico — público (cliente)
const criarPublico = async (req, res) => {
  try {
    const { nomeCliente, telefoneCliente, placaVeiculo, modeloVeiculo, data, horario, duracao, descricao, observacoes } = req.body;
    if (!nomeCliente || !data || !horario) {
      return res.status(400).json({ erro: "Nome, data e horário são obrigatórios" });
    }
    const ag = await Agendamento.create({
      nomeCliente, telefoneCliente, placaVeiculo, modeloVeiculo,
      data, horario, duracao, descricao, observacoes,
      origem: "publico", status: "aguardando"
    });
    res.status(201).json(ag);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// PATCH /agendamentos/:id/status
const atualizarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ag = await Agendamento.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate("clienteId", "nome").populate("veiculoId", "marca modelo placa");
    if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado" });
    res.json(ag);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// POST /agendamentos/:id/converter — converte em pré-OS
const converterEmOS = async (req, res) => {
  try {
    const ag = await Agendamento.findById(req.params.id)
      .populate("clienteId")
      .populate("veiculoId");

    if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado" });
    if (ag.status === "convertido") return res.status(400).json({ erro: "Agendamento já foi convertido" });

    let clienteId = ag.clienteId?._id;
    let veiculoId = ag.veiculoId?._id;

    // Se for agendamento público, tenta encontrar ou criar cliente/veículo
    if (ag.origem === "publico") {
      if (ag.telefoneCliente) {
        let cliente = await Cliente.findOne({ telefone: ag.telefoneCliente });
        if (!cliente) {
          cliente = await Cliente.create({ nome: ag.nomeCliente, telefone: ag.telefoneCliente });
        }
        clienteId = cliente._id;
      }

      if (clienteId && ag.placaVeiculo) {
        let veiculo = await Veiculo.findOne({ placa: ag.placaVeiculo.toUpperCase() });
        if (!veiculo) {
          veiculo = await Veiculo.create({
            clienteId,
            marca: ag.modeloVeiculo || "Não informado",
            modelo: ag.modeloVeiculo || "Não informado",
            placa: ag.placaVeiculo.toUpperCase(),
          });
        }
        veiculoId = veiculo._id;
      }
    }

    if (!clienteId || !veiculoId) {
      return res.status(400).json({ erro: "Para converter, o agendamento precisa ter cliente e veículo vinculados" });
    }

    // Cria a pré-OS
    const preOS = await OrdemDeServico.create({
      clienteId,
      veiculoId,
      descricao: ag.descricao || "Agendamento convertido em OS",
      data: ag.data,
      status: "aberta",
      observacoes: `Gerada a partir de agendamento de ${ag.horario}. ${ag.observacoes || ""}`.trim(),
    });

    // Atualiza agendamento como convertido
    ag.status = "convertido";
    ag.osId = preOS._id;
    await ag.save();

    res.json({ mensagem: "Pré-OS criada com sucesso!", os: preOS, agendamento: ag });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// DELETE /agendamentos/:id
const remover = async (req, res) => {
  try {
    await Agendamento.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Agendamento removido" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

module.exports = { listar, buscarPorId, criar, criarPublico, atualizarStatus, converterEmOS, remover };
