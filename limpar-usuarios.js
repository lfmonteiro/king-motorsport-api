require("dotenv").config();
const conectar = require("./src/database");
const Usuario = require("./src/models/Usuario");

const idsParaRemover = [
  "6a30e59c1da58ae75868ab48", // denis (antigo)
  "6a30e59c1da58ae75868ab4b", // luiz (antigo)
  "6a30e59c1da58ae75868ab4e", // leonardo (antigo)
];

conectar().then(async () => {
  for (const id of idsParaRemover) {
    await Usuario.findByIdAndDelete(id);
    console.log(`✅ Removido: ${id}`);
  }
  const restantes = await Usuario.find().select("nome usuario perfil");
  console.log("\nUsuários restantes:");
  console.log(JSON.stringify(restantes, null, 2));
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
