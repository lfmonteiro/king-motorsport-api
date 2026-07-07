const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  subscription: { type: Object, required: true },
  perfil: { type: String, enum: ["admin", "mecanico"], default: "admin" },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
  criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
