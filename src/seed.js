// Script para criar usuários iniciais
require("dotenv").config();
const conectar = require("./database");
const Usuario = require("./models/Usuario");

const usuarios = [
  { nome: "Denis", usuario: "denis", senha: "mudar1234", perfil: "admin", primeiroAcesso: true },
  { nome: "Luiz Moraes", usuario: "luiz", senha: "mudar1234", perfil: "admin", primeiroAcesso: true },
  { nome: "Leonardo", usuario: "leonardo", senha: "mudar1234", perfil: "mecanico", primeiroAcesso: true },
];

conectar().then(async () => {
  for (const u of usuarios) {
    const existe = await Usuario.findOne({ usuario: u.usuario });
    if (!existe) {
      await Usuario.create(u);
      console.log(`✅ Usuário criado: ${u.nome} (${u.perfil})`);
    } else {
      console.log(`⚠️  Usuário já existe: ${u.usuario}`);
    }
  }
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
