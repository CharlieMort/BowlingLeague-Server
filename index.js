const express = require("express");
const app = express();
const cors = require("cors");
const sqlite = require("sqlite3");

const PORT = 5000;

app.use(express.json());
app.use(cors());

app.get("/players", (req, res) => {
    const db = new sqlite.Database("db.db");
    db.all("SELECT * FROM Players;", (err, rows) => {
        res.send(rows);
    })
    db.close();
})

app.post("/create-player", (req, res) => {
    const db = new sqlite.Database("db.db");
    let totalScore = req.body.totalScore?req.body.totalScore:0;
    db.run(`INSERT INTO Players(name, totalScore) VALUES ("${req.body.name}", ${totalScore});`, (err) => {
        if (err) {
            console.log(err);
            res.send(err);
        }
        else {
            res.send("Player Added");
        }
    });
    db.close();
})

app.post("/add-game", (req, res) => {
    const db = new sqlite.Database("db.db");
    let playerID;
    db.all(`SELECT playerID FROM Players WHERE name="${req.body.name}";`, (err, rows) => {
        if (!rows[0]) {
            console.log("player not found " + req.body.name);
            res.send("Player Not Found");
            return;
        } else {
            playerID = rows[0].playerID;
            db.run(`INSERT INTO Games(playerID, scoreCard) VALUES(${rows[0].playerID}, "${req.body.scoreCard}")`, (err) => {
                if (err) {
                    console.log(err);
                    res.send("FAILED");
                    return;
                }
            });
            res.send("Game Added");
        }
    });
    db.close();
})

app.get("/games", (req, res) => {
    const db = new sqlite.Database("db.db");
    db.all(`SELECT * FROM Games;`, (err, rows) => {
        res.send(rows);
    })
    db.close();
})

app.listen(PORT, () => console.log(`Server Listening On Port ${PORT}`));