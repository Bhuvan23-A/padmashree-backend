const express = require("express");
const db = require("../config/database");

const router = express.Router();

const normalizeValue = (value) =>
  String(value ?? "").trim();

const validateEntryData = (
  sourceData,
  enteredData
) => {
  const errors = {};

  if (
    !enteredData ||
    typeof enteredData !== "object" ||
    Array.isArray(enteredData)
  ) {
    return {
      valid: false,
      errors: {
        entered_data:
          "Entered data is required",
      },
    };
  }

  Object.entries(sourceData).forEach(
    ([field, expectedValue]) => {
      const enteredValue = normalizeValue(
        enteredData[field]
      );

      if (!enteredValue) {
        errors[field] =
          "This field is required.";
        return;
      }

      if (
        enteredValue !==
        normalizeValue(expectedValue)
      ) {
        errors[field] =
          "This value does not match the source record.";
      }
    }
  );

  Object.keys(enteredData).forEach((field) => {
    if (
      !Object.prototype.hasOwnProperty.call(
        sourceData,
        field
      )
    ) {
      errors[field] =
        "This column is not part of the source record.";
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

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

  if (!employee_id || !record_id) {
    return res.status(400).json({
      message:
        "Employee and record are required",
    });
  }

  db.get(
    `
    SELECT source_data, completed
    FROM records
    WHERE id = ?
    `,
    [record_id],
    (err, record) => {

      if (err) {
        console.log("RECORD LOOKUP ERROR:", err);

        return res.status(500).json({
          message: err.message,
        });
      }

      if (!record) {
        return res.status(404).json({
          message: "Record not found",
        });
      }

      if (record.completed) {
        return res.status(400).json({
          message:
            "This record has already been completed",
        });
      }

      let sourceData;

      try {
        sourceData = JSON.parse(
          record.source_data
        );
      } catch (parseError) {
        console.log(
          "SOURCE DATA PARSE ERROR:",
          parseError
        );

        return res.status(500).json({
          message:
            "Stored source data is invalid",
        });
      }

      const validation =
        validateEntryData(
          sourceData,
          entered_data
        );

      if (!validation.valid) {
        return res.status(400).json({
          message:
            "Please fill every column correctly before saving.",
          errors: validation.errors,
        });
      }

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

          const entryId = this.lastID;

          console.log(
            "Entry inserted successfully. Entry ID:",
            entryId
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
                entryId,
              });

            }
          );

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
