const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(
  __dirname,
  "../database.sqlite"
);

const db = new sqlite3.Database(
  dbPath,
  (err) => {
    if (err) {
      console.error(
        "Database connection failed",
        err
      );
    } else {
      console.log(
        "SQLite Database Connected"
      );
    }
  }
);

db.serialize(() => {

  /*
  USERS
  */

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  /*
  ENTRIES
  */

  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      record_id INTEGER,
      entered_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /*
  PROJECTS
  */

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /*
  RECORDS
  */

  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      source_data TEXT,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /*
  AUTO CREATE ADMIN
  */

  db.get(
    `
    SELECT * FROM users
    WHERE role = 'admin'
    LIMIT 1
    `,
    [],
    async (err, admin) => {

      if (err) {
        console.log(err);
        return;
      }

      if (!admin) {

        const hashedPassword =
          await bcrypt.hash(
            "admin123",
            10
          );

        db.run(
          `
          INSERT INTO users
          (
            name,
            email,
            password,
            role
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            "Admin",
            "admin@padmashree.com",
            hashedPassword,
            "admin"
          ],
          function(err) {

            if(err) {
              console.log(
                "Admin creation error:",
                err
              );
            } else {
              console.log(
                "Default Admin Created"
              );
              console.log(
                "Email: admin@padmashree.com"
              );
              console.log(
                "Password: admin123"
              );
            }

          }
        );

      }

    }
  );

});

module.exports = db;