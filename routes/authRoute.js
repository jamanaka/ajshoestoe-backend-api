const { CreateUser, Login, GetUser } = require("../controllers/authController");
const express = require("express");

const router = express.Router();

router.post("/create-user", CreateUser);
router.post("/login", Login);
router.get("/users", GetUser);

module.exports = router;