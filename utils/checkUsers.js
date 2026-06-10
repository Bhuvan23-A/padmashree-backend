const db = require("../config/database");

db.all("SELECT * FROM users", [], (err, rows) => {
  if (err) {
    console.log(err);
  } else {
    console.table(rows);
  }
});