const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const JWT_SECRET = process.env.JWT_SECRET || "king-motorsport-secret-2026";
const JWT_EXPIRES = "7d";

// POST /auth/login
const login = async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) return res.status(400).json({ erro: "Usuário e senha obrigatórios" });

    const user = await Usuario.findOne({ usuario: usuario.toLowerCase(), ativo: true });
    if (!user) return res.status(401).json({ erro: "Usuário ou senha inválidos" });

    const senhaOk = await user.verificarSenha(senha);
    if (!senhaOk) return res.status(401).json({ erro: "Usuário ou senha inválidos" });

    const token = jwt.sign(
      { id: user._id, usuario: user.usuario, perfil: user.perfil, nome: user.nome },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      usuario: { id: user._id, nome: user.nome, usuario: user.usuario, perfil: user.perfil, primeiroAcesso: user.primeiroAcesso }
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// POST /auth/trocar-senha
const trocarSenha = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const user = await Usuario.findById(req.userId);
    if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });

    const senhaOk = await user.verificarSenha(senhaAtual);
    if (!senhaOk) return res.status(401).json({ erro: "Senha atual incorreta" });

    if (novaSenha.length < 6) return res.status(400).json({ erro: "Nova senha deve ter no mínimo 6 caracteres" });

    user.senha = novaSenha;
    user.primeiroAcesso = false;
    await user.save();

    res.json({ mensagem: "Senha alterada com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// GET /auth/me
const me = async (req, res) => {
  try {
    const user = await Usuario.findById(req.userId).select("-senha");
    res.json(user);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// GET /auth/usuarios — só admin
const listarUsuarios = async (req, res) => {
  try {
    if (req.perfil !== "admin") return res.status(403).json({ erro: "Acesso negado" });
    const usuarios = await Usuario.find().select("-senha").sort({ nome: 1 });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// POST /auth/usuarios — só admin
const criarUsuario = async (req, res) => {
  try {
    if (req.perfil !== "admin") return res.status(403).json({ erro: "Acesso negado" });
    const { nome, usuario, perfil } = req.body;
    const existe = await Usuario.findOne({ usuario: usuario.toLowerCase() });
    if (existe) return res.status(400).json({ erro: "Usuário já existe" });
    const novo = await Usuario.create({ nome, usuario, senha: "mudar1234", perfil, primeiroAcesso: true });
    res.status(201).json({ ...novo.toObject(), senha: undefined });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// PATCH /auth/usuarios/:id — só admin
const editarUsuario = async (req, res) => {
  try {
    if (req.perfil !== "admin") return res.status(403).json({ erro: "Acesso negado" });
    const { nome, perfil, ativo } = req.body;
    const user = await Usuario.findByIdAndUpdate(req.params.id, { nome, perfil, ativo }, { new: true }).select("-senha");
    res.json(user);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

// POST /auth/usuarios/:id/resetar-senha — só admin
const resetarSenha = async (req, res) => {
  try {
    if (req.perfil !== "admin") return res.status(403).json({ erro: "Acesso negado" });
    const user = await Usuario.findById(req.params.id);
    if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });
    user.senha = "mudar1234";
    user.primeiroAcesso = true;
    await user.save();
    res.json({ mensagem: "Senha resetada para mudar1234" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

// DELETE /auth/usuarios/:id — só admin
const excluirUsuario = async (req, res) => {
  try {
    if (req.perfil !== "admin") return res.status(403).json({ erro: "Acesso negado" });
    const user = await Usuario.findById(req.params.id);
    if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });
    // Não permite excluir a si mesmo
    if (user._id.toString() === req.userId) return res.status(400).json({ erro: "Você não pode excluir seu próprio usuário" });
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Usuário excluído" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

module.exports = { login, trocarSenha, me, listarUsuarios, criarUsuario, editarUsuario, resetarSenha, excluirUsuario };