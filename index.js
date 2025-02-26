const express = require("express");
const cors = require("cors")
const dotenv = require("dotenv")
const app = express();
const authRoute = require("./routes/authRoute")
app.use(express.json())


const mongoose = require("mongoose");

const MongoDB = "mongodb+srv://ajamanka:Amadou567@ajshoestore.jumg8.mongodb.net/?retryWrites=true&w=majority&appName=ajshoestore"

mongoose.connect(MongoDB
).then(() => console.log("Connected to MongoDB")
).catch((err) => console.error("MongoDB connection error:", err));

app.use(cors({
  origin: ["http://localhost:3000", "https://ajshoestore.vercel.app"],
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true,
}));

app.get("/", (req, res) => {
  res.send("Hello, AJ Shoe Store Express.js Backend!");
});
app.use("/api/auth", authRoute)

PORT = 5000
app.listen((PORT), (req, res) =>{
  console.log(`server runing on port ${PORT}`);
  
})
