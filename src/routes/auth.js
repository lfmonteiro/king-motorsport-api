const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { autenticar } = require("../middleware/auth");

router.post("/login", ctrl.login);
router.get("/me", autenticar, ctrl.me);
router.post("/trocar-senha", autenticar, ctrl.trocarSenha);
router.get("/usuarios", autenticar, ctrl.listarUsuarios);
router.post("/usuarios", autenticar, ctrl.criarUsuario);
router.patch("/usuarios/:id", autenticar, ctrl.editarUsuario);
router.post("/usuarios/:id/resetar-senha", autenticar, ctrl.resetarSenha);
router.delete("/usuarios/:id", autenticar, ctrl.excluirUsuario);

module.exports = router;
