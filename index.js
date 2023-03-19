const express = require("express");
const app = express();
const cors = require("cors");
const sqlite = require("sqlite3");

const PORT = 5000;

app.use(express.json());
app.use(cors());

function getValueForBowl(bowl) {
    let bowls = bowl.split("");
    let score = 0;
    for (let i = 0; i<bowls.length; i++) {
        let num = parseInt(bowls[i]);
        if (num) {
            score += num;
        }
        else {
            if (bowls[i] == "/") {
                score = 10;
            }
            else if (bowls[i] == "X") {
                score += 10;
            }
        }
    }
    return score;
}

function calculateBowl(scoreCard) {
    let scores = scoreCard.split(".");
    let score = 0;
    console.log(scores);
    for (let i = 0; i<scores.length; i++) {
        if (scores[i].length === 3) {
            score += getValueForBowl(scores[i]);
        }
        else if (scores[i][0] == "X") {
            score += 10;
            score += getValueForBowl(scores[i+1]);
            if (scores[i+1] == "X-") {
                score += getValueForBowl(scores[i+2][0]);
            }
            else if (scores[i+1] == "XXX") {
                score -= 10;
            }
        }
        else if (scores[i][1] === "/") {
            score += 10;
            if (i+1 < scores.length) {
                score += getValueForBowl(scores[i+1][0]);
            }
        }
        else {
            score += getValueForBowl(scores[i]);
        }
        console.log(score);
    }
    return score;
}

app.get("/players", (req, res) => {
    const db = new sqlite.Database("db.db");
    db.all("SELECT * FROM Players ORDER BY totalScore DESC;", (err, rows) => {
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
    db.all(`SELECT * FROM Players WHERE name="${req.body.name}";`, (err, rows) => {
        if (!rows[0]) {
            console.log("player not found " + req.body.name);
            res.send("Player Not Found");
            return;
        } else {
            playerID = rows[0].playerID;
            let scoreCard = req.body.scoreCard;
            let totalScore = calculateBowl(scoreCard);
            db.run(`INSERT INTO Games(playerID, scoreCard, score, date, gameNum) VALUES(${rows[0].playerID}, "${req.body.scoreCard}", ${totalScore}, "${req.body.date}", ${req.body.gameNum})`, (err) => {
                if (err) {
                    console.log(err);
                    res.send("FAILED");
                    return;
                }
                db.run(`UPDATE Players SET totalScore = ${rows[0].totalScore+totalScore} WHERE playerID = ${playerID};`, (err) => {
                    if (err) {
                        console.log(err);
                        res.send("FAILED but almost got there");
                        return;
                    }
                    res.send("Game Addded");
                });
            });
            
        }
    });
    db.close();
})

app.get("/games", (req, res) => {
    const db = new sqlite.Database("db.db");
    db.all(`SELECT * FROM Games;`, (err, rows) => {
        res.send(rows);
        console.log(rows[0]);
    })
    db.close();
})

app.get("/games-with-name", (req, res) => {
    const db = new sqlite.Database("db.db");
    db.all(`SELECT Games.date, Games.gameID, Games.score, Games.scoreCard, Players.name FROM Games 
            JOIN Players 
            ON Games.playerID = Players.playerID 
            ORDER BY Games.score DESC;`, (err, rows) => {
                res.send(rows);
            })
    db.close();
})

function updateTotals() {
    const db = new sqlite.Database("db.db");
    let scores = {};
    db.all("SELECT playerID, score FROM Games;", (err, rows) => {
        rows.map((score) => {
            if (!scores.hasOwnProperty(score.playerID)) scores[score.playerID] = score.score;
            else scores[score.playerID] += score.score;
        })
        for (const id in scores) {
            db.run(`UPDATE Players SET totalScore=${scores[id]} WHERE playerID = ${id}`);
        }
    })
    db.close();
}

app.put("/update-totals", (req, res) => {
    updateTotals();
    res.send("Should be donezo");
});

app.post("/del-game", (req, res) => {
    console.log(req.body.gameID);
    const db = new sqlite.Database("db.db");
    db.run(`DELETE FROM Games WHERE gameID = ${req.body.gameID};`, (err) => {
        if (err) {
            console.log(err);
        }
    });
    res.send("Deleted");
    updateTotals();
    db.close();
})

app.listen(PORT, () => console.log(`Server Listening On Port ${PORT}`));