const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/agendamentoController");

router.get("/", ctrl.listar);                          // GET  /agendamentos?mes=6&ano=2026
router.get("/:id", ctrl.buscarPorId);                  // GET  /agendamentos/:id
router.post("/", ctrl.criar);                          // POST /agendamentos (interno)
router.post("/publico", ctrl.criarPublico);            // POST /agendamentos/publico (cliente)
router.patch("/:id/status", ctrl.atualizarStatus);     // PATCH /agendamentos/:id/status
router.post("/:id/converter", ctrl.converterEmOS);     // POST /agendamentos/:id/converter
router.delete("/:id", ctrl.remover);                   // DELETE /agendamentos/:id

module.exports = router;
