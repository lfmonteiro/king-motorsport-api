const mongoose = require("mongoose");

const veiculoSchema = new mongoose.Schema(
  {
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: [true, "Cliente é obrigatório"],
    },
    marca: {
      type: String,
      required: [true, "Marca é obrigatória"],
      trim: true,
    },
    modelo: {
      type: String,
      required: [true, "Modelo é obrigatório"],
      trim: true,
    },
    ano: {
      type: String,
      trim: true,
    },
    placa: {
      type: String,
      required: [true, "Placa é obrigatória"],
      trim: true,
      uppercase: true,
    },
    cor: {
      type: String,
      trim: true,
    },
    km: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Veiculo", veiculoSchema);
