const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const entryRoutes = require("./routes/entries");
const adminRoutes = require("./routes/admin");
require("dotenv").config();
require("./config/database");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/employees", employeeRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "Padmashree Infotech Backend Running Successfully"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});