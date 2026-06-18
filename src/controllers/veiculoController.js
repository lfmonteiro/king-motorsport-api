const Veiculo = require("../models/Veiculo");

// GET /veiculos — lista todos (filtrando por clienteId ou busca por placa/modelo)
const listar = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.clienteId) filtro.clienteId = req.query.clienteId;
    if (req.query.busca) {
      filtro.$or = [
        { placa: new RegExp(req.query.busca.replace(/[^a-zA-Z0-9]/g, ""), "i") },
        { modelo: new RegExp(req.query.busca, "i") },
        { marca: new RegExp(req.query.busca, "i") },
      ];
    } else if (req.query.placa) {
      filtro.placa = new RegExp(req.query.placa, "i");
    }
    const veiculos = await Veiculo.find(filtro)
      .populate("clienteId", "nome telefone")
      .sort({ createdAt: -1 });
    res.json(veiculos);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

// GET /veiculos/:id
const buscarPorId = async (req, res) => {
  try {
    const veiculo = await Veiculo.findById(req.params.id).populate("clienteId", "nome telefone");
    if (!veiculo) return res.status(404).json({ erro: "Veículo não encontrado" });
    res.json(veiculo);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

// POST /veiculos
const criar = async (req, res) => {
  try {
    const veiculo = await Veiculo.create(req.body);
    res.status(201).json(veiculo);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

// PUT /veiculos/:id
const atualizar = async (req, res) => {
  try {
    const veiculo = await Veiculo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!veiculo) return res.status(404).json({ erro: "Veículo não encontrado" });
    res.json(veiculo);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

// DELETE /veiculos/:id
const remover = async (req, res) => {
  try {
    const veiculo = await Veiculo.findByIdAndDelete(req.params.id);
    if (!veiculo) return res.status(404).json({ erro: "Veículo não encontrado" });
    res.json({ mensagem: "Veículo removido com sucesso" });
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };
