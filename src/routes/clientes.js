const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/clienteController");

router.get("/", ctrl.listar);          // GET  /clientes
router.get("/:id", ctrl.buscarPorId); // GET  /clientes/:id
router.post("/", ctrl.criar);         // POST /clientes
router.put("/:id", ctrl.atualizar);   // PUT  /clientes/:id
router.delete("/:id", ctrl.remover);  // DELETE /clientes/:id

module.exports = router;
