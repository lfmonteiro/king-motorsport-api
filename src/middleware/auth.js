const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "king-motorsport-secret-2026";

const autenticar = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }
  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.perfil = decoded.perfil;
    req.nomeUsuario = decoded.nome;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
};

module.exports = { autenticar };
