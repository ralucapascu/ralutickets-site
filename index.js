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
const { route } = require("express/lib/application");
var app=express();
app.set("view engine","ejs");

// var client = new Client({user: "raluca", password: "parola", host: "localhost", port: "5432", database:"raluticketsdb"});
var client = new Client({user: "cqeevgxnkchzyk", password: "82d4385f38150637a889dc24580e3a30cd90cb50787e30d5ba616fb9a4e15375", 
host: "ec2-52-86-249-217.compute-1.amazonaws.com", port: "5432", database:"d9t59g9hcsjf3r", ssl: {
    rejectUnauthorized: false
  }});
client.connect();

var optiuni_categ_eveniment=[];
client.query("select * from unnest(enum_range(null::tip_eveniment))", function(errCateg, rezCateg) {
    for(let elem of rezCateg.rows) {
        optiuni_categ_eveniment.push(elem.unnest);
    }
});

var optiuni_categ_varsta = [];
client.query("select * from unnest(enum_range(null::tip_varsta))", function(errCateg, rezCateg) {
    for(let elem of rezCateg.rows) {
        optiuni_categ_varsta.push(elem.unnest);
    }
});

console.log(__dirname);
app.set("view engine", "ejs");
app.use("/resurse", express.static(__dirname + "/resurse"))

function getMonthName(month) {
    switch (month) {
        case 0:
            return "Ianuarie";
        case 1:
            return "Februarie";
        case 2:
            return "Martie";
        case 3:
            return "Aprilie";
        case 4: 
            return "Mai";
        case 5:
            return "Iunie";
        case 6:
            return "Iulie";
        case 7:
            return "August";
        case 8:
            return "Septembrie";
        case 9:
            return "Octombrie";
        case 10:
            return "Noiembrie";
        case 11:
            return "Decembrie";
        default:
            return "Month not found"
    }
}

function getDayName(day) {
    switch (day) {
        case 1:
            return "Luni";
        case 2:
            return "Marti";
        case 3:
            return "Miercuri";
        case 4: 
            return "Joi";
        case 5:
            return "Vineri";
        case 6:
            return "Sambata";
        case 7:
            return "Duminica";
        default:
            return "Day not found"
    }
}

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
        startDate = moment(oraInceput, "hh:mm");
        endDate = moment(oraSfarsit, "hh:mm");
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
    while(nr % 2 == 1) {
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

app.get(["/favicon.ico"], function(req , res){/*code*/});

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

app.get(["/","/index"], async function(req, res) {
    filtreazaImaginiStatica();
    filtreazaImaginiDinamica();
    // const rezultat = await getEventType();
    // console.log(rezultat);
    res.render("pagini/index", {ip: req.ip, imaginiStatica: imaginiValideStatica, imaginiAnimata: imaginiValideAnimata,
    optiuni_categ_eveniment: optiuni_categ_eveniment}); //calea e relativa la folderul views
})

var evenimente = [];
var bilete = [];

app.get('/evenimente', function(req, res) {
    var conditie="";
    const subcategorii = new Set();
    const tari = new Set();
    if(req.query.tip)
        conditie +=` where categ_eveniment='${req.query.tip}'`;

    client.query("SELECT * FROM bilet", function(err, rez) {
        bilete = rez.rows;
    })

    client.query(`SELECT * FROM eveniment ${conditie}`, function(err, rez) {
        var formatted_date;
        evenimente = rez.rows;
        var pret_min_max = 0;
        for (let row of evenimente) {
            formatted_date = moment(row.data_eveniment, "YYYY-MM-DD hh:mm:ss");
            an_eveniment = formatted_date.year();
            zi_eveniment = formatted_date.date();
            nume_zi_eveniment = getDayName(formatted_date.day());
            nume_luna_eveniment = getMonthName(formatted_date.month());
            row.an_eveniment = an_eveniment;
            row.zi_eveniment = zi_eveniment;
            row.nume_zi_eveniment = nume_zi_eveniment;
            row.nume_luna_eveniment = nume_luna_eveniment;
            subcategs = row.subcateg_eveniment.split(",");
            for (let subcateg of subcategs) {
                subcategorii.add(subcateg);
            }
            tari.add(row.tara);
            var bilete_eveniment = [];
            for(bilet of bilete) {
                if(bilet.id_eveniment === row.id_eveniment) {
                    bilete_eveniment.push(bilet);
                }
            }
            pret_min = bilete_eveniment[0].pret_bilet;
            for(let i = 1 ; i < bilete_eveniment.length; i++) {
                if(bilete_eveniment[i].pret_bilet < pret_min) {
                    pret_min = bilete_eveniment[i].pret_bilet;
                }
            }
            row.pret_min = pret_min;
            if(row.pret_min > pret_min_max) {
                pret_min_max = row.pret_min;
            }
        }
        res.render("pagini/evenimente", {optiuni_categ_eveniment: optiuni_categ_eveniment, optiuni_categ_varsta: optiuni_categ_varsta, 
            evenimente: rez.rows, subcategorii: subcategorii, tari: tari, pret_min_max: pret_min_max});
    })
})

app.get("/eveniment/:id", function(req, res){
    var eveniment;
    var bilete_ev = [];
    for(let ev of evenimente) {
        if(ev.id_eveniment === parseInt(req.params.id)) {
            eveniment = ev;
            break;
        }
    }
    for(let bilet of bilete) {
        if(bilet.id_eveniment === parseInt(req.params.id)) {
            bilete_ev.push(bilet);
        }
    }
    console.log(bilete_ev, eveniment);
    res.render("pagini/eveniment", {optiuni_categ_eveniment: optiuni_categ_eveniment, eveniment: eveniment, bilete: bilete_ev});
})

app.get("/ceva", function(req, res) {
    console.log(req.url)
    res.write("Pagina 2");
    res.end();
})

app.get("/info-covid", function(req, res) {
    console.log(req.url)
    res.render("pagini/info-covid");
})

app.get("/*.ejs",function(req, res) {
    res.render("pagini" + req.url, function(err,rezultatRender){
        if(err) {
            console.log(err.message);
            if(err.message.includes("Failed to lookup")) {
                res.status(403).render("pagini/403", {optiuni_categ_eveniment: optiuni_categ_eveniment});
                return;
            }
            else {
                res.status(403).render("pagini/eroare-generala", {errMsg: err.message, errCode: err.code, optiuni_categ_eveniment: optiuni_categ_eveniment});
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
                res.status(404).render("pagini/404", {optiuni_categ_eveniment: optiuni_categ_eveniment});
                return;
            }
            else {
                res.render("pagini/eroare-generala", {errMsg: err.message, errCode: err.code, optiuni_categ_eveniment: optiuni_categ_eveniment});
                return;
        }
    }
        res.send(rezultatRender);
    });
});

var s_port=process.env.PORT || 5000;
app.listen(s_port);

console.log("Serverul a pornit");