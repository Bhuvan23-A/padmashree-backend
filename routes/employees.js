const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/database");

const router = express.Router();

router.post("/create", async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `
    INSERT INTO users
    (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `,
    [name, email, hashedPassword, "employee"],
    function (err) {
      if (
        err.message.includes("UNIQUE")
      ) {
        return res.status(400).json({
          message:
            "Employee email already exists",
        });
      }

      return res.status(400).json({
        message: err.message,
      });

      res.json({
        message: "Employee created",
        employeeId: this.lastID,
      });
    }
  );
});

module.exports = router;