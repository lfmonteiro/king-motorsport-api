const express = require("express");
const router = express.Router();
const PushSubscription = require("../models/PushSubscription");
const { autenticar } = require("../middleware/auth");

// GET /push/vapid-public-key — retorna a chave pública (público)
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /push/subscribe — salva subscription do usuário (autenticado)
router.post("/subscribe", autenticar, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ erro: "Subscription obrigatória" });

    await PushSubscription.findOneAndUpdate(
      { usuarioId: req.usuario.id },
      {
        usuarioId: req.usuario.id,
        perfil: req.usuario.perfil,
        subscription
      },
      { upsert: true, new: true }
    );

    res.json({ mensagem: "Subscription salva com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /push/unsubscribe — remove subscription (autenticado)
router.delete("/unsubscribe", autenticar, async (req, res) => {
  try {
    await PushSubscription.findOneAndDelete({ usuarioId: req.usuario.id });
    res.json({ mensagem: "Subscription removida!" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
