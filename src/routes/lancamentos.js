const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/lancamentoController");

router.get("/", ctrl.listar);
router.post("/", ctrl.criar);
router.post("/importar-os", ctrl.importarOS);
router.delete("/admin/:id", ctrl.removerAdmin);
router.delete("/:id", ctrl.remover);

module.exports = router;
