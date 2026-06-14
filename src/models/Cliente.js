const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
    },
    telefone: {
      type: String,
      trim: true,
    },
    cpf: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    endereco: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // cria automaticamente createdAt e updatedAt
  }
);

module.exports = mongoose.model("Cliente", clienteSchema);
