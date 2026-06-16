const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { autenticar } = require("../middleware/auth");

router.post("/login", ctrl.login);                                    // POST /auth/login (público)
router.get("/me", autenticar, ctrl.me);                              // GET  /auth/me
router.post("/trocar-senha", autenticar, ctrl.trocarSenha);          // POST /auth/trocar-senha
router.get("/usuarios", autenticar, ctrl.listarUsuarios);            // GET  /auth/usuarios (admin)
router.post("/usuarios", autenticar, ctrl.criarUsuario);             // POST /auth/usuarios (admin)
router.patch("/usuarios/:id", autenticar, ctrl.editarUsuario);       // PATCH /auth/usuarios/:id (admin)
router.post("/usuarios/:id/resetar-senha", autenticar, ctrl.resetarSenha); // POST reset senha (admin)

module.exports = router;
