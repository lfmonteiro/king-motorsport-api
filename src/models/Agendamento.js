const mongoose = require("mongoose");

const agendamentoSchema = new mongoose.Schema(
  {
    // Agendamento interno (mecânico) — vinculado a cliente/veículo cadastrado
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente" },
    veiculoId: { type: mongoose.Schema.Types.ObjectId, ref: "Veiculo" },

    // Agendamento público (cliente) — dados avulsos
    nomeCliente: { type: String, trim: true },
    telefoneCliente: { type: String, trim: true },
    placaVeiculo: { type: String, trim: true },
    modeloVeiculo: { type: String, trim: true },

    // Dados do agendamento
    data: { type: Date, required: true },
    horario: { type: String, required: true }, // "09:00"
    duracao: { type: Number, default: 60 },    // minutos
    descricao: { type: String, trim: true },
    observacoes: { type: String, trim: true },

    // Status do agendamento
    status: {
      type: String,
      enum: ["aguardando", "confirmado", "cancelado", "convertido"],
      default: "aguardando"
    },

    // Origem
    origem: {
      type: String,
      enum: ["interno", "publico"],
      default: "interno"
    },

    // Referência à OS gerada (quando convertido)
    osId: { type: mongoose.Schema.Types.ObjectId, ref: "OrdemDeServico" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agendamento", agendamentoSchema);
