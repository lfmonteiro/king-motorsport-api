const express = require("express");
const router = express.Router();
const { enviarOS } = require("../controllers/emailController");

router.post("/os", enviarOS); // POST /email/os

module.exports = router;
