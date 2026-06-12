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
        `
        INSERT INTO projects (name)
        VALUES (?)
        `,
        [projectName],
        function (err) {

          if (err) {
            console.log(err);

            return res.status(500).json({
              message: err.message,
            });
          }

          const projectId = this.lastID;

          console.log(
            "Created Project ID:",
            projectId
          );

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

                  const cleanKey =
                    key.trim();

                  if (cleanKey !== "") {
                    cleanRow[cleanKey] =
                      row[key];
                  }

                });

                records.push(cleanRow);
              }

            })
            .on("end", () => {

              console.log(
                "Records Parsed:",
                records.length
              );

              let inserted = 0;

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
                    JSON.stringify(record),
                  ],
                  function (err) {

                    if (err) {
                      console.log(
                        "INSERT ERROR:",
                        err
                      );
                    } else {
                      inserted++;
                    }

                  }
                );

              });

              fs.unlinkSync(
                req.file.path
              );

              console.log(
                "Upload Completed"
              );

              res.json({
                message:
                  "Project Uploaded Successfully",
                totalRecords:
                  records.length,
                projectId,
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
        ORDER BY id ASC
        LIMIT 1
        `,
        [],
        (err, row) => {

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
            data: JSON.parse(
              row.source_data
            ),
          });

        }
      );

    }
  );

  router.get("/all-records", (req, res) => {
  db.all(
    `
    SELECT *
    FROM records
    ORDER BY id ASC
    `,
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