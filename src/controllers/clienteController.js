const Cliente = require("../models/Cliente");
const Veiculo = require("../models/Veiculo");

// GET /clientes — lista todos
const listar = async (req, res) => {
  try {
    const { busca } = req.query;
    const filtro = busca
      ? { $or: [{ nome: new RegExp(busca, "i") }, { telefone: new RegExp(busca, "i") }] }
      : {};
    const clientes = await Cliente.find(filtro).sort({ nome: 1 });
    res.json(clientes);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

// GET /clientes/:id
const buscarPorId = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    res.json(cliente);
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

// POST /clientes
const criar = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

// PUT /clientes/:id
const atualizar = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    res.json(cliente);
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

// DELETE /clientes/:id
const remover = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndDelete(req.params.id);
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    res.json({ mensagem: "Cliente removido com sucesso" });
  } catch (err) { res.status(500).json({ erro: err.message }); }
};

// POST /clientes/cadastro-publico — público (sem autenticação)
const cadastroPublico = async (req, res) => {
  try {
    const { nome, telefone, email, cpf, endereco, marca, modelo, ano, placa, cor, km } = req.body;
    if (!nome || !telefone) return res.status(400).json({ erro: "Nome e telefone são obrigatórios" });

    const telLimpo = telefone.replace(/\D/g, "");

    // Verifica se cliente já existe pelo telefone
    let cliente = await Cliente.findOne({ telefone: telLimpo });
    if (!cliente) {
      cliente = await Cliente.create({
        nome, telefone: telLimpo,
        email: email || undefined,
        cpf: cpf || undefined,
        endereco: endereco || undefined,
      });
    } else {
      // Atualiza dados faltantes
      const upd = {};
      if (email && !cliente.email) upd.email = email;
      if (cpf && !cliente.cpf) upd.cpf = cpf;
      if (endereco && !cliente.endereco) upd.endereco = endereco;
      if (Object.keys(upd).length > 0) await Cliente.findByIdAndUpdate(cliente._id, upd);
    }

    // Cria veículo se placa + marca + modelo informados
    if (placa && marca && modelo) {
      const placaLimpa = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const veiculoExiste = await Veiculo.findOne({ placa: placaLimpa });
      if (!veiculoExiste) {
        await Veiculo.create({
          clienteId: cliente._id,
          marca, modelo,
          ano: ano ? Number(ano) : undefined,
          placa: placaLimpa,
          cor: cor || undefined,
          km: km ? Number(km) : 0,
        });
      }
    }

    res.status(201).json({ mensagem: "Cadastro realizado com sucesso!" });
  } catch (err) { res.status(400).json({ erro: err.message }); }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover, cadastroPublico };
