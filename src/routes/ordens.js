const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/ordemController");

router.get("/dashboard", ctrl.dashboard);        // GET  /ordens/dashboard
router.get("/", ctrl.listar);                    // GET  /ordens?status=aberta
router.get("/:id", ctrl.buscarPorId);            // GET  /ordens/:id
router.post("/", ctrl.criar);                    // POST /ordens
router.put("/:id", ctrl.atualizar);              // PUT  /ordens/:id
router.patch("/:id/status", ctrl.atualizarStatus); // PATCH /ordens/:id/status
router.delete("/:id", ctrl.remover);             // DELETE /ordens/:id

module.exports = router;
