const express = require("express")
const dbConnection = require("./utils/db")
const app = express()
const cors = require("cors")

require('dotenv').config()

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json())
app.use("/api/auth", require("./routes/auth"))
app.use("/api/team", require("./routes/team"))
app.use("/api/project", require("./routes/project"))

// later change this ok ?
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.listen(8080, () => {
    dbConnection()
    console.log("server is running")
})