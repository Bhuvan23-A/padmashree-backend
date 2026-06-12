const express = require("express");
const db = require("../config/database");

const router = express.Router();

/*
SAVE EMPLOYEE ENTRY
*/

router.post("/create", (req, res) => {

  console.log("========== NEW ENTRY ==========");
  console.log("REQUEST BODY:");
  console.log(req.body);

  const {
    employee_id,
    record_id,
    entered_data,
  } = req.body;

  db.run(
    `
    INSERT INTO entries
    (
      employee_id,
      record_id,
      entered_data
    )
    VALUES (?, ?, ?)
    `,
    [
      employee_id,
      record_id,
      JSON.stringify(entered_data),
    ],
    function (err) {

      if (err) {
        console.log("INSERT ERROR:", err);

        return res.status(500).json({
          message: err.message,
        });
      }

      console.log(
        "Entry inserted successfully. Entry ID:",
        this.lastID
      );

      /*
      MARK RECORD COMPLETED
      */

      db.run(
        `
        UPDATE records
        SET completed = 1
        WHERE id = ?
        `,
        [record_id],
        function (err) {

          if (err) {
            console.log(
              "UPDATE ERROR:",
              err
            );

            return res.status(500).json({
              message: err.message,
            });
          }

          console.log(
            "Rows updated:",
            this.changes
          );

          console.log(
            "Record completed:",
            record_id
          );

          res.json({
            message:
              "Entry Saved Successfully",
            entryId:
              this.lastID,
          });

        }
      );

    }
  );

});

/*
EMPLOYEE COUNT
*/

router.get(
  "/count/:employeeId",
  (req, res) => {

    const employeeId =
      req.params.employeeId;

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

  }
);

module.exports = router;