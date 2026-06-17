const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Envia notificação para perfis específicos
const notificar = async (titulo, corpo, perfis = ["admin"], dados = {}) => {
  try {
    const subs = await PushSubscription.find({ perfil: { $in: perfis } });
    const payload = JSON.stringify({ titulo, corpo, dados });

    const promises = subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.findByIdAndDelete(sub._id);
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error("Erro ao enviar notificação push:", err.message);
  }
};

module.exports = { notificar };
