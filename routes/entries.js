const express = require("express");
const db = require("../config/database");

const router = express.Router();

router.post("/create", (req, res) => {
  const {
    employee_id,
    respondent_name,
    phone,
    age,
    gender,
    location,
    feedback
  } = req.body;

  db.run(
    `
    INSERT INTO entries
    (
      employee_id,
      respondent_name,
      phone,
      age,
      gender,
      location,
      feedback
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      employee_id,
      respondent_name,
      phone,
      age,
      gender,
      location,
      feedback
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          message: err.message
        });
      }

      res.json({
        message: "Entry Saved Successfully",
        entryId: this.lastID
      });
    }
  );
});
router.get("/count/:employeeId", (req, res) => {
  const employeeId = req.params.employeeId;

  db.get(
    `
    SELECT COUNT(*) as total_entries
    FROM entries
    WHERE employee_id = ?
    `,
    [employeeId],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json(row);
    }
  );
});
module.exports = router;