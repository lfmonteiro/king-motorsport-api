const axios = require("axios");

const EVOLUTION_URL = process.env.EVOLUTION_URL || "http://localhost:8081";
const EVOLUTION_KEY = process.env.EVOLUTION_KEY || "8DA8A4A3C2C7-4BC6-B68D-76D3ADBD5F88";
const INSTANCIA = "king-motorsport";
const ADMIN_NUMERO = process.env.WHATSAPP_ADMIN || "5511981001443";

const enviarMensagem = async (numero, mensagem) => {
  try {
    const num = numero.replace(/\D/g, "");
    if (!num || num.length < 10) return;

    console.log(`📱 WhatsApp → ${num}: ${mensagem.substring(0, 50)}...`);

    const resp = await axios.post(
      `${EVOLUTION_URL}/message/sendText/${INSTANCIA}`,
      { number: num, text: mensagem },
      { headers: { apikey: EVOLUTION_KEY }, timeout: 10000 }
    );

    console.log(`✅ WhatsApp enviado para ${num}`, resp.data?.status);
  } catch (err) {
    console.error(`❌ WhatsApp erro para ${numero}:`, err.response?.data || err.message);
  }
};

const notificarAdmin = (mensagem) => enviarMensagem(ADMIN_NUMERO, mensagem);
const notificarCliente = (telefone, mensagem) => {
  if (!telefone) return;
  return enviarMensagem(telefone, mensagem);
};

module.exports = { enviarMensagem, notificarAdmin, notificarCliente };
