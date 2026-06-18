const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/clienteController");
const { autenticar } = require("../middleware/auth");

router.post("/cadastro-publico", ctrl.cadastroPublico); // público
router.get("/", autenticar, ctrl.listar);
router.get("/:id", autenticar, ctrl.buscarPorId);
router.post("/", autenticar, ctrl.criar);
router.put("/:id", autenticar, ctrl.atualizar);
router.delete("/:id", autenticar, ctrl.remover);

module.exports = router;
