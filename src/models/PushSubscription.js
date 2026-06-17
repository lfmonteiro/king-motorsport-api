const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  perfil: { type: String, enum: ["admin", "mecanico"], required: true },
  subscription: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
