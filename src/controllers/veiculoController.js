const Veiculo = require("../models/Veiculo");

const listar = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.clienteId) filtro.clienteId = req.query.clienteId;
    const busca = req.query.busca;
    if (busca) {
      filtro.$or = [
        { placa: { $regex: busca, $options: "i" } },
        { modelo: { $regex: busca, $options: "i" } },
        { marca: { $regex: busca, $options: "i" } },
      ];
    }
    const veiculos = await Veiculo.find(filtro)
      .populate("clienteId", "nome telefone")
      .sort({ createdAt: -1 });
    res.json(veiculos);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const buscarPorId = async (req, res) => {
  try {
    const veiculo = await Veiculo.findById(req.params.id)
      .populate("clienteId", "nome telefone cpf email endereco");
    if (!veiculo) return res.status(404).json({ erro: "Veículo não encontrado" });
    res.json(veiculo);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

const criar = async (req, res) => {
  try {
    const veiculo = await Veiculo.create(req.body);
    const populado = await Veiculo.findById(veiculo._id)
      .populate("clienteId", "nome telefone");
    res.status(201).json(populado);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

const atualizar = async (req, res) => {
  try {
    const veiculo = await Veiculo.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate("clienteId", "nome telefone");
    if (!veiculo) return res.status(404).json({ erro: "Veículo não encontrado" });
    res.json(veiculo);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

const remover = async (req, res) => {
  try {
    const veiculo = await Veiculo.findByIdAndDelete(req.params.id);
    if (!veiculo) return res.status(404).json({ erro: "Veículo não encontrado" });
    res.json({ mensagem: "Veículo removido com sucesso" });
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };
