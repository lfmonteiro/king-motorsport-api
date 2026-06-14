const Cliente = require("../models/Cliente");

// GET /clientes — lista todos
const listar = async (req, res) => {
  try {
    const { busca } = req.query;
    const filtro = busca
      ? { $or: [{ nome: new RegExp(busca, "i") }, { telefone: new RegExp(busca, "i") }] }
      : {};
    const clientes = await Cliente.find(filtro).sort({ nome: 1 });
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// GET /clientes/:id — busca um
const buscarPorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// POST /clientes — cria novo
const criar = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// PUT /clientes/:id — atualiza
const atualizar = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, {
      new: true,       // retorna o documento atualizado
      runValidators: true,
    });
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    res.json(cliente);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// DELETE /clientes/:id — remove
const remover = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    res.json({ mensagem: "Cliente removido com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };
