const express= require("express");
const fs=require('fs');
const sharp=require('sharp');
const moment = require('moment');
const crypto = require('crypto');

const ejs=require('ejs');
const {Client}= require("pg");
const path = require('path');
const sass = require('sass');
const formidable = require('formidable');
const nodemailer = require('nodemailer');
const random = require('random');
var app=express();
app.set("view engine","ejs");

var client = new Client({user: "postgres", password: "admin", host: "localhost", port: "5432", database:"ralutickets"});
client.connect();


app = express();

console.log(__dirname);
app.set("view engine", "ejs");
app.use("/resurse", express.static(__dirname + "/resurse"))

function creeazaImagini() {
    var buf = fs.readFileSync(__dirname+"/resurse/json/galerie_statica.json").toString("utf-8");
    obImagini = JSON.parse(buf); //global
    for(let imag of obImagini.imagini) {
        let nume_imag, extensie;
        [nume_imag, extensie] = imag.cale_imagine.split(".")// "abc.de".split(".") ---> ["abc","de"]
        let dim_mic=150
        
        imag.mic=`${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
        imag.mare=`${obImagini.cale_galerie}/${imag.cale_imagine}`;
        if (!fs.existsSync(imag.mic))
            sharp(__dirname+"/"+imag.mare).resize(dim_mic).toFile(__dirname+"/"+imag.mic);
    }
}
creeazaImagini();
imaginiValideStatica = [];
imaginiValideAnimata = [];
d = new Date();

function filtreazaImaginiStatica() {
    imaginiValideStatica = [];
    let nr = 0;
    for(let imag of obImagini.imagini) {
        nr += 1;
        let oraInceput = imag.timp.slice(0,5);
        let oraSfarsit = imag.timp.slice(6,11);
        startDate = moment(oraInceput, "hh:ss");
        endDate = moment(oraSfarsit, "hh:ss");
        if(startDate.isBefore(d) && endDate.isAfter(d)) {
            if(nr <= 10) {
                imaginiValideStatica.push(imag);
            }
        }
    }
}

nrImagAleatoare = 0

function filtreazaImaginiDinamica() {
    imaginiValideAnimata = [];
    let nr = 1;
    let i = 0;
    while(nr %2 == 1) {
        nr = random.int((min = 6), (max = 12));
    }
    for(let imag of obImagini.imagini) {
        i += 1;
        let oraInceput = imag.timp.slice(0,5);
        let oraSfarsit = imag.timp.slice(6,11);
        startDate = moment(oraInceput, "hh:ss");
        endDate = moment(oraSfarsit, "hh:ss");
        if(startDate.isBefore(d) && endDate.isAfter(d)) {
            if(i <= nr) {
                imaginiValideAnimata.push(imag);
            }
        }
        nrImagAleatoare = imaginiValideAnimata.length;
    }
}

app.get("*/galerie_animata.css", function(req, res) {
    res.setHeader("Content-Type", "text/css");
    let sirScss = fs.readFileSync(path.join(__dirname, "resurse", "scss", "galerie_animata.scss")).toString('utf-8');
    let rezScss = ejs.render(sirScss, { nrImag: nrImagAleatoare });
    fs.writeFileSync(path.join(__dirname, "temp", "galerie_animata.scss"), rezScss); 

    let cale_css = path.join(__dirname, "temp/galerie_animata.css");
    let cale_scss = path.join(__dirname, "temp/galerie_animata.scss");
    sass.render({ file: cale_scss, sourceMap: true }, function(err, rezCompilare) {
        if (err) {
            console.log(`eroare: ${err.message}`);
            res.end();
            return;
        }
        fs.writeFileSync(cale_css, rezCompilare.css, function(err) {
            if (err) { console.log(err); }
        });
        res.sendFile(cale_css);
    })
});

app.get("*/galerie_animata.css.map",function(req, res){
    res.sendFile(path.join(__dirname,"temp/galerie_animata.css.map"));
});

app.get("/*map",function(req, res){
});

app.get(["/","/index"], function(req, res) {
    filtreazaImaginiStatica();
    filtreazaImaginiDinamica();
    res.render("pagini/index", {ip: req.ip, imaginiStatica: imaginiValideStatica, imaginiAnimata: imaginiValideAnimata}); //calea e relativa la folderul views
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
                res.status(403).render("pagini/eroare-generala", {errMsg: err.message, errCode: err.code});
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

console.log("Serverul a pornit");