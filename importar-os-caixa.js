// Script para importar todas as OS concluídas existentes para o caixa
require("dotenv").config();
const conectar = require("./src/database");
const OrdemDeServico = require("./src/models/OrdemDeServico");
const Lancamento = require("./src/models/Lancamento");
// Carrega os models necessários para o populate
require("./src/models/Cliente");
require("./src/models/Veiculo");

conectar().then(async () => {
  const ordens = await OrdemDeServico.find({ status: "concluida" })
    .populate("clienteId", "nome")
    .populate("veiculoId", "placa");

  console.log(`\n📋 ${ordens.length} OS concluídas encontradas\n`);

  let importadas = 0;
  let ignoradas = 0;

  for (const os of ordens) {
    const jaExiste = await Lancamento.findOne({ osId: os._id });
    if (jaExiste) { ignoradas++; continue; }

    const total = [
      ...(os.servicos || []),
      ...(os.pecasMecanico || [])
    ].reduce((s, i) => s + Number(i.valor || 0), 0);

    if (total === 0) { ignoradas++; continue; }

    await Lancamento.create({
      tipo: "entrada",
      valor: total,
      descricao: `OS #${String(os.numero).padStart(2, "0")} — ${os.descricao}`,
      categoria: "os",
      data: os.updatedAt,
      osId: os._id,
      origem: "os"
    });

    console.log(`✅ OS #${String(os.numero).padStart(2, "0")} — R$ ${total.toFixed(2)} — ${os.clienteId?.nome}`);
    importadas++;
  }

  console.log(`\n✅ ${importadas} OS importadas para o caixa`);
  console.log(`⏭️  ${ignoradas} OS ignoradas (já importadas ou valor zero)`);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
