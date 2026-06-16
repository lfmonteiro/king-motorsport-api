const mongoose = require("mongoose");

const lancamentoSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ["entrada", "saida"], required: true },
    valor: { type: Number, required: true, min: 0 },
    descricao: { type: String, required: true, trim: true },
    categoria: {
      type: String,
      enum: ["os", "peca", "aluguel", "salario", "combustivel", "ferramenta", "outros"],
      default: "outros"
    },
    data: { type: Date, default: Date.now },
    osId: { type: mongoose.Schema.Types.ObjectId, ref: "OrdemDeServico" }, // se veio de uma OS
    origem: { type: String, enum: ["manual", "os"], default: "manual" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lancamento", lancamentoSchema);
