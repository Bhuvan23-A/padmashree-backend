const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const db = require("../config/database");

const router = express.Router();

const upload = multer({
  dest: "uploads/"
});

/*
UPLOAD CSV
*/

router.post(
  "/upload",
  upload.single("file"),
  (req, res) => {

    const projectName = req.body.projectName;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    db.run(
      `
      INSERT INTO projects (name)
      VALUES (?)
      `,
      [projectName],
      function (err) {

        if (err) {
          return res.status(500).json({
            message: err.message
          });
        }

        const projectId = this.lastID;

        const records = [];

        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on("data", (row) => {
            records.push(row);
          })
          .on("end", () => {

            records.forEach((record) => {

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
                  JSON.stringify(record)
                ]
              );

            });

            fs.unlinkSync(req.file.path);

            res.json({
              message: "Project Uploaded Successfully",
              totalRecords:
                records.length,
              projectId
            });

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

    db.get(
      `
      SELECT *
      FROM records
      WHERE completed = 0
      LIMIT 1
      `,
      [],
      (err, row) => {

        if (err) {
          return res.status(500).json({
            message: err.message
          });
        }

        if (!row) {
          return res.json({
            finished: true
          });
        }

        res.json({
          finished: false,
          recordId: row.id,
          data: JSON.parse(
            row.source_data
          )
        });

      }
    );

  }
);

module.exports = router;