const Agendamento = require("../models/Agendamento");
const OrdemDeServico = require("../models/OrdemDeServico");
const Cliente = require("../models/Cliente");
const Veiculo = require("../models/Veiculo");
const { notificar } = require("../services/pushService");
const { notificarAdmin, notificarCliente } = require("../services/whatsappService");

const listar = async (req, res) => {
  try {
    const { mes, ano, data } = req.query;
    let filtro = {};
    if (data) {
      const inicio = new Date(data); inicio.setHours(0, 0, 0, 0);
      const fim = new Date(data); fim.setHours(23, 59, 59, 999);
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
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const buscarPorId = async (req, res) => {
  try {
    const ag = await Agendamento.findById(req.params.id)
      .populate("clienteId", "nome telefone email")
      .populate("veiculoId", "marca modelo placa ano");
    if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado" });
    res.json(ag);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const criar = async (req, res) => {
  try {
    const ag = await Agendamento.create({ ...req.body, origem: "interno" });
    notificar("📅 Novo agendamento", `${ag.horario} — ${req.body.clienteId ? "Cliente cadastrado" : ag.nomeCliente || "Cliente"}`, ["admin"]);
    res.status(201).json(ag);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

// POST /agendamentos/publico — público (cliente)
// Auto-cadastra cliente e veículo se não existirem
const criarPublico = async (req, res) => {
  try {
    const { nomeCliente, telefoneCliente, emailCliente, placaVeiculo, modeloVeiculo, anoVeiculo, kmVeiculo, data, horario, duracao, descricao, observacoes } = req.body;
    if (!nomeCliente || !data || !horario) {
      return res.status(400).json({ erro: "Nome, data e horário são obrigatórios" });
    }

    // Auto-cadastro: cria/atualiza cliente
    let clienteId = null;
    if (telefoneCliente) {
      let cliente = await Cliente.findOne({ telefone: telefoneCliente.replace(/\D/g, "") });
      if (!cliente) {
        cliente = await Cliente.create({ nome: nomeCliente, telefone: telefoneCliente.replace(/\D/g, ""), email: emailCliente || undefined });
      }
      clienteId = cliente._id;
    }

    // Auto-cadastro: cria/atualiza veículo
    let veiculoId = null;
    if (clienteId && placaVeiculo) {
      let veiculo = await Veiculo.findOne({ placa: placaVeiculo.toUpperCase().replace(/[^A-Z0-9]/g, "") });
      if (!veiculo) {
        veiculo = await Veiculo.create({
          clienteId,
          marca: modeloVeiculo || "Não informado",
          modelo: modeloVeiculo || "Não informado",
          placa: placaVeiculo.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          ano: anoVeiculo ? Number(anoVeiculo) : undefined,
          km: kmVeiculo ? Number(kmVeiculo) : 0,
        });
      } else if (kmVeiculo) {
        // Atualiza KM se veículo já existe
        await Veiculo.findByIdAndUpdate(veiculo._id, { km: Number(kmVeiculo) });
      }
      veiculoId = veiculo._id;
    }

    const ag = await Agendamento.create({
      nomeCliente, telefoneCliente, emailCliente, placaVeiculo, modeloVeiculo, anoVeiculo, kmVeiculo,
      data, horario, duracao, descricao, observacoes,
      origem: "publico", status: "aguardando",
      clienteId: clienteId || undefined,
      veiculoId: veiculoId || undefined,
    });

    notificar(
      "📅 Agendamento online recebido!",
      `${nomeCliente} · ${horario} · ${placaVeiculo || modeloVeiculo || "Veículo não informado"}`,
      ["admin"]
    );
    notificarAdmin(
      `🏁 *King Motorsport* — Novo agendamento online!\n\n` +
      `👤 *Cliente:* ${nomeCliente}\n` +
      `📞 *Telefone:* ${telefoneCliente || "Não informado"}\n` +
      `🚗 *Veículo:* ${modeloVeiculo || "Não informado"} — ${placaVeiculo || "Placa não informada"}\n` +
      (kmVeiculo ? `📍 *KM atual:* ${Number(kmVeiculo).toLocaleString("pt-BR")} km\n` : "") +
      `📅 *Data:* ${new Date(data).toLocaleDateString("pt-BR")}\n` +
      `🕐 *Horário:* ${horario}\n` +
      `🔧 *Serviço:* ${descricao || "Não informado"}`
    );

    res.status(201).json(ag);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

const atualizarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ag = await Agendamento.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate("clienteId", "nome telefone").populate("veiculoId", "marca modelo placa");
    if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado" });

    const statusLabel = { "aguardando": "Aguardando", "confirmado": "Confirmado", "cancelado": "Cancelado", "convertido": "Convertido" }[status] || status;
    const nome = ag.clienteId?.nome || ag.nomeCliente || "Cliente";
    const telefone = ag.clienteId?.telefone || ag.telefoneCliente;
    const dataFmt = new Date(ag.data).toLocaleDateString("pt-BR");

    // Se confirmando — verifica/cria cliente automaticamente
    if (status === "confirmado" && !ag.clienteId) {
      const telLimpo = ag.telefoneCliente?.replace(/\D/g, "");
      if (telLimpo) {
        let clienteNovo = await Cliente.findOne({ telefone: telLimpo });
        if (!clienteNovo) {
          clienteNovo = await Cliente.create({
            nome: ag.nomeCliente,
            telefone: telLimpo,
            email: ag.emailCliente || undefined,
          });
        } else if (ag.emailCliente && !clienteNovo.email) {
          await Cliente.findByIdAndUpdate(clienteNovo._id, { email: ag.emailCliente });
        }
        await Agendamento.findByIdAndUpdate(ag._id, { clienteId: clienteNovo._id });
      }
    }

    notificar(`📅 Agendamento ${statusLabel}`, `${nome} · ${ag.horario}`, ["admin"]);

    if (status === "confirmado" && telefone) {
      notificarCliente(telefone,
        `🏁 *King Motorsport* — Agendamento confirmado!\n\n` +
        `Olá, *${nome}*! Seu agendamento foi *confirmado*.\n\n` +
        `📅 *Data:* ${dataFmt}\n` +
        `🕐 *Horário:* ${ag.horario}\n` +
        `🔧 *Serviço:* ${ag.descricao || "Serviço automotivo"}\n\n` +
        `📍 Rua Djalma Pessolato, 203 — São Paulo/SP\n` +
        `📞 (11) 95989-1402`
      );
    }

    if (status === "cancelado" && telefone) {
      notificarCliente(telefone,
        `🏁 *King Motorsport* — Agendamento cancelado\n\n` +
        `Olá, *${nome}*. Infelizmente seu agendamento do dia *${dataFmt}* às *${ag.horario}* foi cancelado.\n\n` +
        `Entre em contato para reagendar:\n📞 (11) 95989-1402`
      );
    }

    res.json(ag);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

const converterEmOS = async (req, res) => {
  try {
    const ag = await Agendamento.findById(req.params.id)
      .populate("clienteId").populate("veiculoId");
    if (!ag) return res.status(404).json({ erro: "Agendamento não encontrado" });
    if (ag.status === "convertido") return res.status(400).json({ erro: "Agendamento já foi convertido" });

    let clienteId = ag.clienteId?._id;
    let veiculoId = ag.veiculoId?._id;

    // Se já tem clienteId/veiculoId do auto-cadastro, usa direto
    if (!clienteId && ag.telefoneCliente) {
      let cliente = await Cliente.findOne({ telefone: ag.telefoneCliente.replace(/\D/g, "") });
      if (!cliente) cliente = await Cliente.create({ nome: ag.nomeCliente, telefone: ag.telefoneCliente.replace(/\D/g, "") });
      clienteId = cliente._id;
    }

    if (!veiculoId && clienteId && ag.placaVeiculo) {
      let veiculo = await Veiculo.findOne({ placa: ag.placaVeiculo.toUpperCase().replace(/[^A-Z0-9]/g, "") });
      if (!veiculo) veiculo = await Veiculo.create({
        clienteId,
        marca: ag.modeloVeiculo || "Não informado",
        modelo: ag.modeloVeiculo || "Não informado",
        placa: ag.placaVeiculo.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        ano: ag.anoVeiculo ? Number(ag.anoVeiculo) : undefined,
        km: ag.kmVeiculo ? Number(ag.kmVeiculo) : 0,
      });
      veiculoId = veiculo._id;
    }

    if (!clienteId || !veiculoId) {
      return res.status(400).json({ erro: "Para converter, o agendamento precisa ter cliente e veículo vinculados" });
    }

    const preOS = await OrdemDeServico.create({
      clienteId, veiculoId,
      descricao: ag.descricao || "Agendamento convertido em OS",
      data: ag.data, status: "aberta",
      km: ag.kmVeiculo ? Number(ag.kmVeiculo) : undefined,
      observacoes: `Gerada a partir de agendamento de ${ag.horario}. ${ag.observacoes || ""}`.trim(),
    });

    ag.status = "convertido";
    ag.osId = preOS._id;
    await ag.save();

    notificar("🔧 Agendamento convertido em OS", `OS criada para ${ag.nomeCliente || ag.clienteId?.nome}`, ["admin"]);

    res.json({ mensagem: "Pré-OS criada com sucesso!", os: preOS, agendamento: ag });
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const remover = async (req, res) => {
  try {
    await Agendamento.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Agendamento removido" });
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

module.exports = { listar, buscarPorId, criar, criarPublico, atualizarStatus, converterEmOS, remover };
