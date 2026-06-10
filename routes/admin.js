const express = require("express");
const db = require("../config/database");

const router = express.Router();

router.get("/stats", (req, res) => {
  db.all(
    `
    SELECT
      users.id,
      users.name,
      users.email,
      COUNT(entries.id) as total_entries
    FROM users
    LEFT JOIN entries
      ON users.id = entries.employee_id
    WHERE users.role = 'employee'
    GROUP BY users.id
    ORDER BY total_entries DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      res.json(rows);
    }
  );
});

module.exports = router;