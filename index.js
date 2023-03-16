const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const sqlite = require("sqlite3");

const PORT = 5000;

app.use(express.json());
app.use(cors());



app.get("/", (req, res) => {
    console.log("COCK AND BALLS");
    res.send("MY FUCKING BALLS");
});

app.get("/players", (req, res) => {
    const db = new sqlite.Database("db.db");
    db.all("SELECT * FROM Players;", (err, rows) => {
        res.send(rows);
    })
    db.close();
})

app.post("/create-player", (req, res) => {
    const db = new sqlite.Database("db.db");
    db.run(`INSERT INTO Players(name, totalScore) VALUES ("${req.body.name}", "${req.body.score}");`, (err) => {
        if (err) {
            console.log(err);
            res.send("no penis");
        }
        else {
            res.send("big willy moment");
            console.log("we won son");
        }
    });
    db.close();
})

app.listen(PORT, () => console.log(`Server Listening On Port ${PORT}`));