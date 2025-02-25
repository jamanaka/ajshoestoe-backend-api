const express = require("express");
const cors = require("cors")
const dotenv = require("dotenv")
const app = express();
const authRoute = require("../routes/authRoute")

const mongoose = require("mongoose");

const MongoDB = "mongodb+srv://ajamanka:Amadou567@ajshoestore.jumg8.mongodb.net"

mongoose
  .connect(MongoDB)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


app.use(cors({
    origin: ["http://localhost:3001", "https://ajshoestore.vercel.app"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credential: true,
}))

app.use("/api", authRoute)
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hello, Express.js Backend!");
});