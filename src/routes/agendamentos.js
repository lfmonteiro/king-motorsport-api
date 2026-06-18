const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/agendamentoController");
const { autenticar } = require("../middleware/auth");

router.post("/publico", ctrl.criarPublico);                        // POST /agendamentos/publico (público)
router.get("/", autenticar, ctrl.listar);                          // GET  /agendamentos
router.get("/:id", autenticar, ctrl.buscarPorId);                  // GET  /agendamentos/:id
router.post("/", autenticar, ctrl.criar);                          // POST /agendamentos (interno)
router.patch("/:id/status", autenticar, ctrl.atualizarStatus);     // PATCH /agendamentos/:id/status
router.post("/:id/converter", autenticar, ctrl.converterEmOS);     // POST /agendamentos/:id/converter
router.delete("/:id", autenticar, ctrl.remover);                   // DELETE /agendamentos/:id

module.exports = router;