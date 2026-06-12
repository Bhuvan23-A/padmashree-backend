const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../config/database");

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

/*
UPLOAD CSV
*/

router.post(
  "/upload",
  upload.single("file"),
  (req, res) => {

    const projectName = req.body.projectName;

    console.log("========== CSV UPLOAD ==========");
    console.log("Project Name:", projectName);

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    db.run(
      `INSERT INTO projects (name) VALUES (?)`,
      [projectName],
      function (err) {

        if (err) {
          console.log(err);
          return res.status(500).json({
            message: err.message,
          });
        }

        const projectId = this.lastID;

        console.log("Created Project ID:", projectId);

        const records = [];

        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on("data", (row) => {

            /*
            REMOVE EMPTY ROWS
            */

            const values = Object.values(row);

            const hasData = values.some(
              (value) =>
                value &&
                value.toString().trim() !== ""
            );

            if (hasData) {

              /*
              REMOVE EMPTY COLUMN NAMES
              */

              const cleanRow = {};

              Object.keys(row).forEach((key) => {
                const cleanKey = key.trim();
                if (cleanKey !== "") {
                  cleanRow[cleanKey] = row[key];
                }
              });

              records.push(cleanRow);
            }

          })
          .on("end", () => {

            console.log("Records Parsed:", records.length);

            /*
            FIX: INSERT RECORDS ONE AT A TIME (SEQUENTIAL)
            Previously all inserts fired at once with forEach,
            causing SQLite to skip/mix records due to async overlap.
            Now each insert waits for the previous one to finish.
            */

            const insertNext = (index) => {

              // All records inserted — send response now
              if (index >= records.length) {
                fs.unlinkSync(req.file.path);
                console.log("Upload Completed. Total inserted:", records.length);
                return res.json({
                  message: "Project Uploaded Successfully",
                  totalRecords: records.length,
                  projectId,
                });
              }

              db.run(
                `
                INSERT INTO records
                (
                  project_id,
                  source_data
                )
                VALUES (?, ?)
                `,
                [
                  projectId,
                  JSON.stringify(records[index]),
                ],
                function (err) {

                  if (err) {
                    console.log("INSERT ERROR at index", index, ":", err);
                  } else {
                    console.log(
                      `Inserted record ${index + 1}/${records.length} — DB ID: ${this.lastID}`
                    );
                  }

                  // Move to next record only after this one finishes
                  insertNext(index + 1);

                }
              );

            };

            // Kick off sequential inserts from record 0
            insertNext(0);

          });

      }
    );

  }
);

/*
GET NEXT RECORD
*/

router.get(
  "/next-record",
  (req, res) => {

    const projectId = req.query.projectId
      ? parseInt(req.query.projectId)
      : null;

    /*
    FIX: Filter by projectId if provided so records from
    old projects don't bleed into the current session.
    Falls back to global query if no projectId given.
    */

    const query = projectId
      ? `SELECT * FROM records WHERE completed = 0 AND project_id = ? ORDER BY id ASC LIMIT 1`
      : `SELECT * FROM records WHERE completed = 0 ORDER BY id ASC LIMIT 1`;

    const params = projectId ? [projectId] : [];

    db.get(query, params, (err, row) => {

      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      if (!row) {
        return res.json({
          finished: true,
        });
      }

      res.json({
        finished: false,
        recordId: row.id,
        projectId: row.project_id,
        data: JSON.parse(row.source_data),
      });

    });

  }
);

/*
GET ALL RECORDS
*/

router.get("/all-records", (req, res) => {

  db.all(
    `SELECT * FROM records ORDER BY id ASC`,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json(rows);

    }
  );

});

module.exports = router;