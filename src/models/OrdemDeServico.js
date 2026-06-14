const mongoose = require("mongoose");

// Sub-schemas para itens da OS
const itemSchema = new mongoose.Schema(
  {
    desc: { type: String, required: true, trim: true },
    valor: { type: Number, required: true, min: 0 },
  },
  { _id: false } // não gera _id para cada item da lista
);

const ordemSchema = new mongoose.Schema(
  {
    numero: {
      type: Number,
      unique: true, // número sequencial da OS: 0001, 0002...
    },
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
    },
    veiculoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veiculo",
      required: true,
    },
    descricao: {
      type: String,
      required: [true, "Descrição é obrigatória"],
      trim: true,
    },
    data: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["aberta", "em-andamento", "concluida", "cancelada"],
      default: "aberta",
    },
    km: {
      type: Number,
    },
    servicos: [itemSchema],
    pecas: [itemSchema],
    observacoes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: calcula o total automaticamente (sem salvar no banco)
ordemSchema.virtual("total").get(function () {
  const somaServicos = (this.servicos || []).reduce((s, i) => s + i.valor, 0);
  const somaPecas = (this.pecas || []).reduce((s, i) => s + i.valor, 0);
  return somaServicos + somaPecas;
});

// Gera número sequencial antes de salvar
ordemSchema.pre("save", async function (next) {
  if (this.isNew) {
    const ultima = await mongoose.model("OrdemDeServico").findOne().sort({ numero: -1 });
    this.numero = ultima ? ultima.numero + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("OrdemDeServico", ordemSchema);
