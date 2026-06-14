const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const enviarOS = async (req, res) => {
  const { os, emailDestino } = req.body;

  if (!emailDestino) {
    return res.status(400).json({ erro: "Email de destino é obrigatório" });
  }

  const cliente = os.clienteId;
  const veiculo = os.veiculoId;
  const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totalMaoObra = (os.servicos || []).reduce((s, i) => s + Number(i.valor || 0), 0);
  const totalPecasMecanico = (os.pecasMecanico || []).reduce((s, i) => s + Number(i.valor || 0), 0);
  const total = totalMaoObra + totalPecasMecanico;

  const linhasPecasC = (os.pecasCliente || []).map(p =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#666;">${p.desc} <em>(fornecida pelo cliente)</em></td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:#666;">—</td></tr>`
  ).join("");

  const linhasServicos = (os.servicos || []).map(s =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${s.desc}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(s.valor)}</td></tr>`
  ).join("");

  const linhasPecasM = (os.pecasMecanico || []).map(p =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${p.desc}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${fmt(p.valor)}</td></tr>`
  ).join("");

  const statusLabel = { aberta: "Aberta", "em-andamento": "Em Andamento", concluida: "Concluída", cancelada: "Cancelada" }[os.status] || os.status;
  const statusColor = os.status === "concluida" ? "#2ECC71" : os.status === "aberta" ? "#F1C40F" : "#C9A84C";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

<tr><td style="background:#111;padding:28px 32px;text-align:center;">
  <h1 style="color:#C9A84C;margin:0;font-size:24px;letter-spacing:4px;">KING MOTORSPORT</h1>
  <p style="color:#7A7570;margin:4px 0 0;font-size:12px;letter-spacing:2px;">SERVIÇOS AUTOMOTIVOS</p>
</td></tr>

<tr><td style="padding:28px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <p style="margin:0 0 4px;color:#7A7570;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Ordem de Serviço</p>
        <h2 style="margin:0;color:#111;font-size:28px;font-weight:900;">#${String(os.numero).padStart(2, "0")}</h2>
      </td>
      <td align="right">
        <span style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor};border-radius:20px;padding:4px 14px;font-size:11px;font-weight:800;text-transform:uppercase;">${statusLabel}</span>
      </td>
    </tr>
  </table>

  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr>
      <td width="50%" style="padding-right:16px;">
        <p style="margin:0 0 4px;color:#7A7570;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Cliente</p>
        <p style="margin:0;color:#111;font-size:14px;font-weight:700;">${cliente?.nome || "-"}</p>
        <p style="margin:2px 0 0;color:#555;font-size:13px;">${cliente?.telefone || ""}</p>
      </td>
      <td width="50%">
        <p style="margin:0 0 4px;color:#7A7570;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Veículo</p>
        <p style="margin:0;color:#111;font-size:14px;font-weight:700;">${veiculo?.marca} ${veiculo?.modelo} ${veiculo?.ano}</p>
        <p style="margin:2px 0 0;color:#C9A84C;font-size:13px;font-weight:700;">${veiculo?.placa || ""}</p>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr>
      <td width="50%" style="padding-right:16px;">
        <p style="margin:0 0 4px;color:#7A7570;font-size:11px;font-weight:700;text-transform:uppercase;">Data</p>
        <p style="margin:0;color:#111;font-size:13px;">${new Date(os.data).toLocaleDateString("pt-BR")}</p>
      </td>
      ${os.km ? `<td width="50%"><p style="margin:0 0 4px;color:#7A7570;font-size:11px;font-weight:700;text-transform:uppercase;">KM Entrada</p><p style="margin:0;color:#111;font-size:13px;">${Number(os.km).toLocaleString("pt-BR")} km</p></td>` : ""}
    </tr>
  </table>

  ${os.descricao ? `<div style="background:#f9f9f9;border-left:3px solid #C9A84C;padding:12px 16px;border-radius:4px;margin-bottom:20px;">
    <p style="margin:0 0 4px;color:#7A7570;font-size:11px;font-weight:700;text-transform:uppercase;">Defeito / Reclamação</p>
    <p style="margin:0;color:#111;font-size:13px;">${os.descricao}</p>
  </div>` : ""}

  ${linhasPecasC || linhasServicos || linhasPecasM ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    <tr style="background:#f5f5f5;">
      <th style="padding:8px;text-align:left;font-size:11px;color:#7A7570;text-transform:uppercase;">Serviços e Peças</th>
      <th style="padding:8px;text-align:right;font-size:11px;color:#7A7570;text-transform:uppercase;">Valor</th>
    </tr>
    ${linhasPecasC}${linhasServicos}${linhasPecasM}
  </table>` : ""}

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:10px;margin-bottom:20px;">
    <tr><td style="padding:12px 16px 4px;color:#7A7570;font-size:12px;">Mão de obra</td><td style="padding:12px 16px 4px;color:#fff;font-size:12px;text-align:right;">${fmt(totalMaoObra)}</td></tr>
    <tr><td style="padding:4px 16px;color:#7A7570;font-size:12px;">Peças (mecânico)</td><td style="padding:4px 16px;color:#fff;font-size:12px;text-align:right;">${fmt(totalPecasMecanico)}</td></tr>
    <tr><td style="padding:8px 16px;border-top:1px solid #333;color:#C9A84C;font-size:14px;font-weight:800;">TOTAL</td><td style="padding:8px 16px;border-top:1px solid #333;color:#FFD770;font-size:20px;font-weight:900;text-align:right;">${fmt(total)}</td></tr>
  </table>

  ${os.garantia || os.proximaRevisao ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    ${os.garantia ? `<tr><td style="padding:4px 0;color:#555;font-size:13px;">🛡️ Garantia: <strong>${os.garantia}</strong></td></tr>` : ""}
    ${os.proximaRevisao ? `<tr><td style="padding:4px 0;color:#555;font-size:13px;">📅 Próxima revisão: <strong>${os.proximaRevisao}</strong></td></tr>` : ""}
  </table>` : ""}

  ${os.observacoes ? `<div style="background:#f9f9f9;padding:12px 16px;border-radius:4px;margin-bottom:20px;">
    <p style="margin:0 0 4px;color:#7A7570;font-size:11px;font-weight:700;text-transform:uppercase;">Observações</p>
    <p style="margin:0;color:#555;font-size:13px;">${os.observacoes}</p>
  </div>` : ""}

</td></tr>

<tr><td style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
  <p style="margin:0 0 4px;color:#111;font-size:13px;font-weight:700;">King Motorsport</p>
  <p style="margin:0;color:#7A7570;font-size:12px;">Rua Djalma Pessolato, 203 – São Paulo/SP · +55 (11) 95989-1402</p>
  <p style="margin:4px 0 0;color:#C9A84C;font-size:12px;">kingmotorsportbr@gmail.com</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;

  try {
    const result = await resend.emails.send({
      from: "King Motorsport <onboarding@resend.dev>",
      to: emailDestino,
      subject: `OS #${String(os.numero).padStart(2, "0")} — ${cliente?.nome} · ${veiculo?.placa}`,
      html,
    });
    console.log("Resend result:", JSON.stringify(result));
    if (result.error) {
      console.error("Resend error:", result.error);
      return res.status(500).json({ erro: result.error.message || "Erro no Resend" });
    }
    res.json({ mensagem: "Email enviado com sucesso!", id: result.data?.id });
  } catch (err) {
    console.error("Erro ao enviar email:", err.message);
    res.status(500).json({ erro: "Falha ao enviar email: " + err.message });
  }
};

module.exports = { enviarOS };