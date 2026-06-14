const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/veiculoController");

router.get("/", ctrl.listar);          // GET  /veiculos?clienteId=xxx
router.get("/:id", ctrl.buscarPorId); // GET  /veiculos/:id
router.post("/", ctrl.criar);         // POST /veiculos
router.put("/:id", ctrl.atualizar);   // PUT  /veiculos/:id
router.delete("/:id", ctrl.remover);  // DELETE /veiculos/:id

module.exports = router;
