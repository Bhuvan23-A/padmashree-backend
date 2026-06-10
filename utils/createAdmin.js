const bcrypt = require("bcryptjs");
const db = require("../config/database");

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  db.run(
    `
    INSERT OR IGNORE INTO users
    (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `,
    [
      "Administrator",
      "admin@padmashree.com",
      hashedPassword,
      "admin",
    ],
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Admin account created");
      }
    }
  );
}

createAdmin();