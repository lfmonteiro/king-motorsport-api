const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    usuario: { type: String, required: true, unique: true, trim: true, lowercase: true },
    senha: { type: String, required: true },
    perfil: { type: String, enum: ["admin", "mecanico"], default: "mecanico" },
    ativo: { type: Boolean, default: true },
    primeiroAcesso: { type: Boolean, default: true }, // força troca de senha
  },
  { timestamps: true }
);

// Hash da senha antes de salvar
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

// Compara senha
usuarioSchema.methods.verificarSenha = async function (senha) {
  return bcrypt.compare(senha, this.senha);
};

module.exports = mongoose.model("Usuario", usuarioSchema);
