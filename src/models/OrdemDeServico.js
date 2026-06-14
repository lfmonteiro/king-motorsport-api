const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  { desc: { type: String, required: true, trim: true }, valor: { type: Number, required: true, min: 0 } },
  { _id: false }
);

const ordemSchema = new mongoose.Schema(
  {
    numero: { type: Number, unique: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true },
    veiculoId: { type: mongoose.Schema.Types.ObjectId, ref: "Veiculo", required: true },
    descricao: { type: String, required: [true, "Descrição é obrigatória"], trim: true },
    data: { type: Date, default: Date.now },
    status: { type: String, enum: ["aberta", "em-andamento", "concluida", "cancelada"], default: "aberta" },
    km: { type: Number },
    tecnico: { type: String, trim: true },
    // Separação fiel ao recibo real da King Motorsport
    servicos: [itemSchema],           // mão de obra
    pecasCliente: [itemSchema],       // peças fornecidas pelo cliente
    pecasMecanico: [itemSchema],      // peças fornecidas pelo mecânico
    garantia: { type: String, trim: true },
    proximaRevisao: { type: String, trim: true },
    observacoes: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ordemSchema.virtual("total").get(function () {
  const somaServicos = (this.servicos || []).reduce((s, i) => s + i.valor, 0);
  const somaPecasC = (this.pecasCliente || []).reduce((s, i) => s + i.valor, 0);
  const somaPecasM = (this.pecasMecanico || []).reduce((s, i) => s + i.valor, 0);
  return somaServicos + somaPecasC + somaPecasM;
});

ordemSchema.pre("save", async function (next) {
  if (this.isNew) {
    const ultima = await mongoose.model("OrdemDeServico").findOne().sort({ numero: -1 });
    this.numero = ultima ? ultima.numero + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("OrdemDeServico", ordemSchema);