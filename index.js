const express = require('express');
const {Client} = require('pg');

var client = new Client({user: "raluca_pascu", password: "parola", host: "localhost", port: "5432", database:"ralutickets"});
client.connect();


app = express();

console.log(__dirname);
app.set("view engine", "ejs");
app.use("/resurse", express.static(__dirname + "/resurse"))

app.get(["/","/index"], function(req, res) {
    console.log(req.url)
    res.render("pagini/index", {ip: req.ip}); //calea e relativa la folderul views
})

app.get('/produse', function(req, res) {
    client.query("SELECT * FROM produs", function(err, rez) {
        res.render("pagini/produse", {produse: rez.rows});
    });
})

app.get("/ceva", function(req, res) {
    console.log(req.url)
    res.write("Pagina 2");
    res.end();
})

app.get('/favicon.ico' , function(req , res){/*code*/});

app.get("/info-covid", function(req, res) {
    console.log(req.url)
    res.render("pagini/info-covid");
})

app.get("/*.ejs",function(req, res) {
    res.render("pagini" + req.url, function(err,rezultatRender){
        if(err) {
            console.log(err.message);
            if(err.message.includes("Failed to lookup")) {
                res.status(403).render("pagini/403");
                return;
            }
            else {
                res.render("pagini/eroare-generala", {errMsg: err.message, errCode: err.code});
                return;
        }
    }
        res.send(rezultatRender);
    });
});

app.get("/*",function(req, res) {
    res.render("pagini" + req.url, function(err,rezultatRender){
        if(err) {
            if(err.message.includes("Failed to lookup")) {
                res.status(404).render("pagini/404");
                return;
            }
            else {
                res.render("pagini/eroare-generala", {errMsg: err.message, errCode: err.code});
                return;
        }
    }
        res.send(rezultatRender);
    });
});

app.listen(8080);

console.log("Serverul a pornit")