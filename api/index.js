const express = require("express");
const cors = require("cors")
const dotenv = require("dotenv")
const app = express();
const authRoute = require("./routes/authRoute")

const MongoDB = "Connection String"

app.use(cors({
    origin: ["http://localhost:3001", "https://ajshoestore.vercel.app"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credential: true,
}))

app.use("/api", authRoute)
const PORT = 5000;
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hello, Express.js Backend!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
