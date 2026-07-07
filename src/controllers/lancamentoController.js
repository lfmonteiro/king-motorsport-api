const Lancamento = require("../models/Lancamento");
const OrdemDeServico = require("../models/OrdemDeServico");

// GET /lancamentos?inicio=2026-06-01&fim=2026-06-30
const listar = async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    let filtro = {};
    if (inicio && fim) {
      filtro.data = {
        $gte: new Date(inicio + "T00:00:00"),
        $lte: new Date(fim + "T23:59:59")
      };
    }
    const lancamentos = await Lancamento.find(filtro)
      .populate("osId", "numero descricao")
      .sort({ data: -1 });
    const entradas = lancamentos.filter(l => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
    const saidas = lancamentos.filter(l => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);
    res.json({ lancamentos, entradas, saidas, saldo: entradas - saidas });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// POST /lancamentos
const criar = async (req, res) => {
  try {
    const l = await Lancamento.create(req.body);
    res.status(201).json(l);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// POST /lancamentos/importar-os
const importarOS = async (req, res) => {
  try {
    const { osId } = req.body;
    const os = await OrdemDeServico.findById(osId);
    if (!os) return res.status(404).json({ erro: "OS não encontrada" });
    if (os.status !== "concluida") return res.status(400).json({ erro: "OS ainda não foi concluída" });
    const jaImportada = await Lancamento.findOne({ osId });
    if (jaImportada) return res.status(400).json({ erro: "Esta OS já foi importada para o caixa" });
    const total = [...(os.servicos || []), ...(os.pecasMecanico || [])].reduce((s, i) => s + i.valor, 0);
    const l = await Lancamento.create({
      tipo: "entrada",
      valor: total,
      descricao: `OS #${String(os.numero).padStart(2, "0")} — ${os.descricao}`,
      categoria: "os",
      data: os.updatedAt,
      osId: os._id,
      origem: "os"
    });
    res.status(201).json(l);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// DELETE /lancamentos/:id
const remover = async (req, res) => {
  try {
    const l = await Lancamento.findById(req.params.id);
    if (!l) return res.status(404).json({ erro: "Lançamento não encontrado" });
    if (l.origem === "os") return res.status(400).json({ erro: "Lançamentos de OS não podem ser excluídos" });
    await Lancamento.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Lançamento removido" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// DELETE /lancamentos/admin/:id — admin pode excluir qualquer lançamento
const removerAdmin = async (req, res) => {
  try {
    if (req.perfil !== "admin") return res.status(403).json({ erro: "Acesso negado" });
    const l = await Lancamento.findByIdAndDelete(req.params.id);
    if (!l) return res.status(404).json({ erro: "Lançamento não encontrado" });
    res.json({ mensagem: "Lançamento removido pelo admin" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

module.exports = { listar, criar, importarOS, remover, removerAdmin };
