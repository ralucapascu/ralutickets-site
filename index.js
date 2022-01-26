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
const session = require("express-session");
const html_to_pdf = require('html-pdf-node');
var QRCode = require('qrcode');
const helmet=require('helmet');
var app=express();
app.set("view engine","ejs");

const http=require('http')
const socket = require('socket.io');
const { Console } = require('console');
const server = new http.createServer(app);  
var io = socket(server)
io = io.listen(server);
io.on("connection", function (socket)  {  
    console.log("Conectare!");
    //if(!conexiune_index)
    //    conexiune_index=socket
    socket.on('disconnect', function() {conexiune_index=null;console.log('Deconectare')});
});

parolaCriptare="curs_tehnici_web";

// d=new Date(); d.setDate(1); zi=d.getDay();d.setDate(1+(7-zi+3)%7); //2022-01-05T08:36:28.646Z
//console.log(d);

console.log((new Date()).getDay());

var client;
if(process.env.SITE_ONLINE){
    protocol="https://";
    numeDomeniu="cryptic-island-75584.herokuapp.com"
    client = new Client({user: "cqeevgxnkchzyk", password: "82d4385f38150637a889dc24580e3a30cd90cb50787e30d5ba616fb9a4e15375", 
    host: "ec2-52-86-249-217.compute-1.amazonaws.com", port: "5432", database:"d9t59g9hcsjf3r", ssl: {
        rejectUnauthorized: false
      }});
}
else{
    client = new Client({user: "raluca", password: "parola", host: "localhost", port: "5432", database:"raluticketsdb"});
    protocol="http://";
    numeDomeniu="localhost:8080";
}
client.connect();

app.use(helmet.frameguard());  //task 22, look cursul 12


//pagini speciale pentru care cererile post nu se preiau cu formidable
app.use(["/produse_cos","/cumpara", "/sterge_poza"],express.json({limit:'2mb'}));//obligatoriu de setat pt request body de tip json
//trec mai jos paginile cu cereri post pe care vreau sa le tratez cu req.body si nu cu formidable
app.use(["/contact"], express.urlencoded({extended:true}));

//crearea sesiunii (obiectul de tip request capata proprietatea session si putem folosi req.session)
app.use(session({
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
  }));

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
app.use("/resurse", express.static(__dirname + "/resurse"));
app.use("/poze_uploadate", express.static(__dirname + "/poze_uploadate"));

app.use("/*", function(req,res,next) {
    res.locals.utilizator=req.session.utilizator;
    res.locals.optiuni_categ_eveniment = optiuni_categ_eveniment;
    next();
});

sirAlphaNum="";
v_intervale=[[66, 68],[70,72],[74, 78], [80, 84], [86, 90]];
for (let interval of v_intervale){
    for (let i=interval[0];i<=interval[1];i++)
        sirAlphaNum+=String.fromCharCode(i);
}
console.log(sirAlphaNum);

function genereazaToken(lungime){
    sirAleator="";
    for(let i=0;i<lungime; i++){
        sirAleator+= sirAlphaNum[ Math.floor( Math.random()* sirAlphaNum.length) ];
    }
    return sirAleator
}

async function trimiteMail(username, email, token1, token2){
	var transp= nodemailer.createTransport({
		service: "gmail",
		secure: false,
		auth:{//date login 
			user:"test.tweb.node@gmail.com",
			pass:"tehniciweb"
		},
		tls:{
			rejectUnauthorized:false
		}
	});
	//genereaza html
	await transp.sendMail({
		from:"test.tweb.node@gmail.com",
		to:email,
		subject:"Mesaj înregistrare",
		text:"Pe " + numeDomeniu + " ai username-ul " + username +", începând de azi, "+ new Date(),
		html:`<h1>Salut!</h1><p>` + "Pe " + numeDomeniu + " ai username-ul " + username +", începând de azi, <span style='color: purple; text-decoration: underline'>"+ new Date() + `</span></p> <p><a href='http://${numeDomeniu}/confirmare_mail/${token1}/${username}/${token2}'>Click aici pentru confirmare</a></p>`,
	})
	console.log("trimis mail");
}

async function trimiteMailStergere(nume, prenume, email){
	var transp= nodemailer.createTransport({
		service: "gmail",
		secure: false,
		auth:{//date login 
			user:"test.tweb.node@gmail.com",
			pass:"tehniciweb"
		},
		tls:{
			rejectUnauthorized:false
		}
	});
	//genereaza html
	await transp.sendMail({
		from:"test.tweb.node@gmail.com",
		to:email,
		subject:"Mesaj stergere",
		text:"Nu ne mai plăcea cum arăți, [prenume nume], așa că ți-am șters poza. Sorry! ",
		html:`<h1>Salut!</h1><p>` + "Nu ne mai plăcea cum arăți, " + nume + " "+ prenume + ", așa că ți-am șters poza. Sorry!</p>"
	})
	console.log("trimis mail");
}


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
d = moment();

function filtreazaImaginiStatica() {
    imaginiValideStatica = [];
    let nr = 0;
    for(let imag of obImagini.imagini) {
        let oraInceput = imag.timp.slice(0,5);
        let oraSfarsit = imag.timp.slice(6,11);
        startDate = moment(oraInceput, "hh:mm");
        endDate = moment(oraSfarsit, "hh:mm");
        // console.log(startDate, endDate, d, startDate.isBefore(d), endDate.isAfter(d));
        if(startDate.isBefore(d) && endDate.isAfter(d)) {
            if(nr < 10) {
                imaginiValideStatica.push(imag);
                nr += 1;
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
        let oraInceput = imag.timp.slice(0,5);
        let oraSfarsit = imag.timp.slice(6,11);
        startDate = moment(oraInceput, "hh:ss");
        endDate = moment(oraSfarsit, "hh:ss");
        if(startDate.isBefore(d) && endDate.isAfter(d)) {
            if(i < nr) {
                imaginiValideAnimata.push(imag);
                i += 1;
            }
        }
    }
    nrImagAleatoare = imaginiValideAnimata.length;
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
    optiuni_categ_eveniment: optiuni_categ_eveniment, mesajLogin:req.session.mesajLogin}); //calea e relativa la folderul views
    req.session.mesajLogin=null;
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
        console.log(err, rez);
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
});

app.get("/confirmare_mail/:token1/:user/:token2", function(req,res){
    var token = '' + req.params.token1 + '/' + req.params.user + '/' + req.params.token2;
    var queryUpdate=`update utilizatori set confirmat_mail=true where username = '${req.params.user}' and cod= '${token}' `;
    client.query(queryUpdate, function(err, rez){
        if (err){
            console.log(err);
            res.render("pagini/eroare",{err:"Eroare baza date"});
            return;
        }
        if (rez.rowCount>0){
            res.render("pagini/confirmare",  {optiuni_categ_eveniment: optiuni_categ_eveniment});
        }
        else{
            res.render("pagini/eroare",{err:"Eroare link"});
        }
    });

});

app.post("/inreg", function(req, res){
    var formular= new formidable.IncomingForm();
    var username;
    var filePath = '';
    formular.parse(req,function(err, campuriText, campuriFile){
        var eroare="";
        if (!campuriText.username)
            eroare+="Username-ul nu poate fi necompletat. ";
        if (!campuriText.nume)
            eroare+="Numele nu poate fi necompletat. ";
        if (!campuriText.prenume)
            eroare+="Prenumele nu poate fi necompletat. ";
        if (!campuriText.parola)
            eroare+="Parola nu poate fi necompletata. ";
        if (!campuriText.rparola)
            eroare+="Parola trebuie sa fie rescrisa. ";
        if (!campuriText.email)
            eroare+="Email-ul nu poate fi necompletat. ";

        if(campuriText.parola !== campuriText.rparola)
            eroare+="Parola a fost reintrodusa gresit! ";

        if (!campuriText.problema_vedere)
        campuriText.problema_vedere = 'false';

        if ( !campuriText.parola.match("^(?=.*[a-z])(?=.*[A-Z])(?=.{2,}[0-9])(?=.*[.]).*$"))
            eroare+="Parola trebuie sa contina minim o litera mare, o litera mica, un punct si 2 cifre! ";

        if ( !campuriText.username.match("^[A-Za-z0-9]+$"))
            eroare+="Username-ul trebuie sa contina doar litere mici/mari si cifre. ";
        
        if ( !campuriText.nume.match("^[A-Z][a-z]+$"))
            eroare+="Numele trebuie sa contina doar o litera mare la inceput si in rest doar litere mici. ";
        if ( !campuriText.nume.match("^[A-Z][a-z]+$"))
            eroare+="Prenumele trebuie sa contina doar o litera mare la inceput si in rest doar litere mici. ";

        if (eroare!=""){
            res.render("pagini/inregistrare",{err:eroare, optiuni_categ_eveniment: optiuni_categ_eveniment});
            return;
        }

        queryVerifUtiliz=` select * from utilizatori where username= '${campuriText.username}' `;
        console.log(queryVerifUtiliz)
        
        client.query(queryVerifUtiliz, function(err, rez){
            if (err){
                console.log(err);
                res.render("pagini/inregistrare",{err:"Eroare baza date", optiuni_categ_eveniment: optiuni_categ_eveniment});
            }
            
            else{
                if (rez.rows.length==0){
                    var criptareParola=crypto.scryptSync(campuriText.parola,parolaCriptare,32).toString('hex');
                    var token2=genereazaToken(80);
                    var dataCurenta = new Date();
                    var token1 = '' + dataCurenta.getFullYear() + dataCurenta.getMonth() + dataCurenta.getDay() + dataCurenta.getHours() + dataCurenta.getMinutes() + dataCurenta.getSeconds();
                    var token = '' + token1 + '/' + campuriText.username + '/' + token2;
                    var queryUtiliz=`insert into utilizatori (username, nume, prenume, parola, email, culoare_chat, problema_vedere, fotografie, cod) values 
                    ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::boolean, $8::text, $9::text)`; 
                
                    console.log(queryUtiliz, criptareParola);
                    client.query(queryUtiliz,  [campuriText.username, campuriText.nume, campuriText.prenume, criptareParola, campuriText.email, 
                        campuriText.culoareText, campuriText.problema_vedere, filePath, token], function(err, rez){ //TO DO parametrizati restul de query
                        if (err){
                            console.log(err);
                            res.render("pagini/inregistrare",{err:"Eroare baza date", optiuni_categ_eveniment: optiuni_categ_eveniment});
                        }
                        else{
                            trimiteMail(campuriText.username, campuriText.email, token1, token2);
                            res.render("pagini/inregistrare",{err:"", raspuns:"Date introduse cu succes!", optiuni_categ_eveniment: optiuni_categ_eveniment});
                        }
                    });
                }
                else{
                    eroare+="Username-ul mai exista. ";
                    res.render("pagini/inregistrare",{err:eroare, optiuni_categ_eveniment: optiuni_categ_eveniment});
                }
            }
        });
    }); 
    formular.on("field", function(nume,val){  // 1 pentru campuri cu continut de tip text (pentru inputuri de tip text, number, range,... si taguri select, textarea)
        console.log("----> ",nume, val );
        if(nume=="username")
            username=val;
    }) 
    formular.on("fileBegin", function(nume,fisier){ //2
        //console.log(fisier);
        if(!fisier.originalFilename)
            return;
        // if(campuriFile.poza.originalFilename) {
        //     filePath = __dirname + "/poze_uploadate/" + username + "/";
        //     v = campuriFile.poza.originalFilename.split('.');
        //     filePath += 'poza.'  + v[v.length -1];
        // }
        
        folderUtilizator=__dirname+"/poze_uploadate/"+username+"/";
        console.log("----> ",nume, fisier);
        if (!fs.existsSync(folderUtilizator)){
            fs.mkdirSync(folderUtilizator);
            v = fisier.originalFilename.split(".");
            fisier.filepath = folderUtilizator + "poza." + v[v.length-1];//setez calea de upload
            filePath = "/poze_uploadate/" + username + "/" + "poza." + v[v.length-1];
            console.log(filePath);
            //fisier.filepath=folderUtilizator+fisier.originalFilename;
        }
        
    })    
    formular.on("file", function(nume,fisier){//3
        //s-a terminat de uploadat
        console.log("fisier uploadat");
    });        
});


app.post("/login", function(req, res){
    var formular= new formidable.IncomingForm();
    var mesajLogin = '';
    formular.parse(req,function(err, campuriText, campuriFile){
        console.log(campuriText);
        
        var querylogin=`select * from utilizatori where username= '${campuriText.username}' `;
        client.query(querylogin, function(err, rez){
            if(err){
                res.render("pagini/eroare",{mesaj:"Eroare baza date. Incercati mai tarziu."});
                return;
            }
            if (rez.rows.length!=1){//ar trebui sa fie 0
                res.render("pagini/eroare",{mesaj:"Username-ul nu exista."});
                return;
            }
            var criptareParola=crypto.scryptSync(campuriText.parola,parolaCriptare,32).toString('hex'); 
            console.log(criptareParola);
            console.log(rez.rows[0].parola);
            if (criptareParola == rez.rows[0].parola && rez.rows[0].confirmat_mail){ //TO DOOOOOOOOOOOOOOOOOOOOO
                console.log("totul ok");
                req.session.mesajLogin=null;//resetez in caz ca s-a logat gresit ultima oara
                if(req.session){
                    req.session.utilizator={
                        id:rez.rows[0].id,
                        username:rez.rows[0].username,
                        nume:rez.rows[0].nume,
                        prenume:rez.rows[0].prenume,
                        culoare_chat:rez.rows[0].culoare_chat,
                        email:rez.rows[0].email,
                        rol:rez.rows[0].rol,
                        problema_vedere: rez.rows[0].problema_vedere
                    }
                }
                // res.render("pagini"+req.url);
                res.redirect("/index");
            }
            else{
                req.session.mesajLogin="Login esuat";
                res.redirect("/index");
                //res.render("pagini/index",{ip:req.ip, imagini:obImagini.imagini, cale:obImagini.cale_galerie,mesajLogin:"Login esuat"});
            }

        });
        

    });
});

app.post("/profil", function(req, res){
    if (!req.session.utilizator){
        res.render("pagini/eroare",{mesaj:"Nu sunteti logat."});
        return;
    }
    var formular= new formidable.IncomingForm();
    var filePath = '';
    var username = req.session.utilizator.username;
    formular.on("fileBegin", function(nume,fisier){
        if(!fisier.originalFilename)
            return;
        
        folderUtilizator=__dirname+"/poze_uploadate/"+username+"/";
        console.log("----> ",nume, fisier);
        if (!fs.existsSync(folderUtilizator)){
            fs.mkdirSync(folderUtilizator);
            v = fisier.originalFilename.split(".");
            fisier.filepath = folderUtilizator + "poza." + v[v.length-1];//setez calea de upload
            filePath = "/poze_uploadate/" + username + "/" + "poza." + v[v.length-1];
            console.log(filePath);
            //fisier.filepath=folderUtilizator+fisier.originalFilename;
        }
        
    });
    console.log(filePath);
    formular.on("file", function(nume,fisier){//3
        //s-a terminat de uploadat
        console.log("fisier uploadat");
    }); 

    formular.parse(req,function(err, campuriText, campuriFile){
        console.log(err);
        console.log(campuriText);
        if (!campuriText.problema_vedere)
        campuriText.problema_vedere = 'false';
        var criptareParola=crypto.scryptSync(campuriText.parola,parolaCriptare,32).toString('hex'); 

        //toti parametrii sunt cu ::text in query-ul parametrizat fiindca sunt stringuri (character varying) in tabel
        var queryUpdate=`update utilizatori set nume=$1::text, prenume=$2::text, email=$3::text, culoare_chat=$4::text, problema_vedere=$7::boolean, fotografie=$8::text where username= $5::text and parola=$6::text `;
        
        client.query(queryUpdate, [campuriText.nume, campuriText.prenume, campuriText.email, campuriText.culoareText, req.session.utilizator.username, criptareParola, campuriText.problema_vedere, filePath], function(err, rez){
            if(err){
                console.log(err);
                res.render("pagini/eroare",{mesaj:"Eroare baza date. Incercati mai tarziu."});
                return;
            }
            console.log(rez.rowCount);
            if (rez.rowCount==0){
                res.render("pagini/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                return;
            }
            
            req.session.utilizator.nume=campuriText.nume;
            req.session.utilizator.prenume=campuriText.prenume;
            
            req.session.utilizator.culoare_chat=campuriText.culoareText;
            req.session.utilizator.email=campuriText.email;

            req.session.utilizator.problema_vedere = campuriText.problema_vedere;

            res.render("pagini/profil",{mesaj:"Update-ul s-a realizat cu succes."});

        }); 

    });
});


app.get("/logout",function(req,res){
    req.session.destroy();
    res.locals.utilizator=null;
    res.render("pagini/index", {ip: req.ip, imaginiStatica: imaginiValideStatica, imaginiAnimata: imaginiValideAnimata});
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////// Pagini/cereri pentru admin

app.get('/useri', function(req, res){
	
	if( req.session && req.session.utilizator && req.session.utilizator.rol=="admin" ){
        client.query("select * from utilizatori",function(err, rezultat){
            if(err) throw err;
            //console.log(rezultat);
            res.render('pagini/useri',{useri:rezultat.rows});//afisez index-ul in acest caz
        });
	} 
    else{
		res.status(403).render('pagini/eroare',{mesaj:"Nu aveti acces"});
	}
    
});




app.post("/sterge_utiliz",function(req, res){
	if( req.session && req.session.utilizator && req.session.utilizator.rol=="admin"  ){
	var formular= new formidable.IncomingForm()
	
	formular.parse(req, function(err, campuriText, campuriFisier){
		//var comanda=`delete from utilizatori where id=${campuriText.id_utiliz} and rol!='admin'`;
        var comanda=`delete from utilizatori where id=$1 and rol !='admin' and nume!= $2::text `;
		client.query(comanda, [campuriText.id_utiliz,"Mihai"],  function(err, rez){
			// TO DO mesaj cu stergerea
            if(err)
                console.log(err);
            else{
                if (rez.rowCount>0){
                    console.log("sters cu succes");
                }
                else{
                    console.log("stergere esuata");
                }
            }
		});
	});
	}
	res.redirect("/useri");
	
});




///////////////////////////////////////////////////////////////////////////////////////////////
//////////////// Contact
caleXMLMesaje="resurse/xml/contact.xml";
headerXML=`<?xml version="1.0" encoding="utf-8"?>`;
function creeazaXMlContactDacaNuExista(){
    if (!fs.existsSync(caleXMLMesaje)){
        let initXML={
            "declaration":{
                "attributes":{
                    "version": "1.0",
                    "encoding": "utf-8"
                }
            },
            "elements": [
                {
                    "type": "element",
                    "name":"contact",
                    "elements": [
                        {
                            "type": "element",
                            "name":"mesaje",
                            "elements":[]                            
                        }
                    ]
                }
            ]
        }
        let sirXml=xmljs.js2xml(initXML,{compact:false, spaces:4});
        console.log(sirXml);
        fs.writeFileSync(caleXMLMesaje,sirXml);
        return false; //l-a creat
    }
    return true; //nu l-a creat acum
}


function parseazaMesaje(){
    let existaInainte=creeazaXMlContactDacaNuExista();
    let mesajeXml=[];
    let obJson;
    if (existaInainte){
        let sirXML=fs.readFileSync(caleXMLMesaje, 'utf8');
        obJson=xmljs.xml2js(sirXML,{compact:false, spaces:4});
        

        let elementMesaje=obJson.elements[0].elements.find(function(el){
                return el.name=="mesaje"
            });
        let vectElementeMesaj=elementMesaje.elements?elementMesaje.elements:[];
        console.log("Mesaje: ",obJson.elements[0].elements.find(function(el){
            return el.name=="mesaje"
        }))
        let mesajeXml=vectElementeMesaj.filter(function(el){return el.name=="mesaj"});
        return [obJson, elementMesaje,mesajeXml];
    }
    return [obJson,[],[]];
}


app.get("/contact", function(req, res){
    let obJson, elementMesaje, mesajeXml;
    [obJson, elementMesaje, mesajeXml] =parseazaMesaje();

    res.render("pagini/contact",{ utilizator:req.session.utilizator, mesaje:mesajeXml})
});

app.post("/contact", function(req, res){
    let obJson, elementMesaje, mesajeXml;
    [obJson, elementMesaje, mesajeXml] =parseazaMesaje();
        
    let u= req.session.utilizator?req.session.utilizator.username:"anonim";
    let mesajNou={
        type:"element", 
        name:"mesaj", 
        attributes:{
            username:u, 
            data:new Date()
        },
        elements:[{type:"text", "text":req.body.mesaj}]
    };
    if(elementMesaje.elements)
        elementMesaje.elements.push(mesajNou);
    else 
        elementMesaje.elements=[mesajNou];
    console.log(elementMesaje.elements);
    let sirXml=xmljs.js2xml(obJson,{compact:false, spaces:4});
    console.log("XML: ",sirXml);
    fs.writeFileSync("resurse/xml/contact.xml",sirXml);
    
    res.render("pagini/contact",{ utilizator:req.session.utilizator, mesaje:elementMesaje.elements})
});

async function trimitefactura(username, email,numefis){
	var transp= nodemailer.createTransport({
		service: "gmail",
		secure: false,
		auth:{//date login 
			user:"test.tweb.node@gmail.com",
			pass:"tehniciweb"
		},
		tls:{
			rejectUnauthorized:false
		}
	});
	//genereaza html
	await transp.sendMail({
		from:"test.tweb.node@gmail.com",
		to:email,
		subject:"Factură",
		text:"Stimate "+username+", aveți atașată factura",
		html:"<h1>Salut!</h1><p>Stimate "+username+", aveți atașată factura</p>",
        attachments: [
            {   // utf-8 string as an attachment
                filename: 'factura.pdf',
                content: fs.readFileSync(numefis)
            }
        ]
	})
	console.log("trimis mail");
}

app.post("/produse_cos",function(req, res){
    
	//console.log("req.body: ",req.body);
    //console.log(req.get("Content-type"));
    //console.log("body: ",req.get("body"));

    /* prelucrare pentru a avea toate id-urile numerice si pentru a le elimina pe cele care nu sunt numerice */
    var iduri=[]
    for (let elem of req.body.ids_prod){
        let num=parseInt(elem);
        if (!isNaN(num))//daca este numar
            iduri.push(num);
    }
    if (iduri.length==0){
        res.send("eroare");
        return;
    }

    //console.log("select id, nume, pret, gramaj, calorii, categorie, imagine from prajituri where id in ("+iduri+")");
    client.query("select id, nume, pret, gramaj, calorii, categorie, imagine from prajituri where id in ("+iduri+")", function(err,rez){
        //console.log(err, rez);
        //console.log(rez.rows);
        res.send(rez.rows);
       
       
    });

    
});

app.post("/cumpara",function(req, res){
    if(!req.session.utilizator){
        res.write("Nu puteti cumpara daca nu sunteti logat!");res.end();
        return;
    }
    console.log("select id, nume, pret, gramaj, calorii, categorie, imagine from prajituri where id in ("+req.body.ids_prod+")");
    client.query("select id, nume, pret, gramaj, calorii, categorie, imagine from prajituri where id in ("+req.body.ids_prod+")", function(err,rez){
        //console.log(err, rez);
        //console.log(rez.rows);
        
        let rezFactura=ejs.render(fs.readFileSync("views/pagini/factura.ejs").toString("utf8"),{utilizator:req.session.utilizator,produse:rez.rows, protocol:protocol, domeniu:numeDomeniu});
        //console.log(rezFactura);
        let options = { format: 'A4', args: ['--no-sandbox'] };

        let file = { content: rezFactura };

        html_to_pdf.generatePdf(file, options).then(function(pdf) {
            if(!fs.existsSync("./temp"))
                fs.mkdirSync("./temp");
            var numefis="./temp/test"+(new Date()).getTime()+".pdf";
            fs.writeFileSync(numefis,pdf);
            trimitefactura(req.session.utilizator.username, req.session.utilizator.email, numefis);
            res.write("Totu bine!");res.end();
        });
       
        
       
    });

    
});

app.post('/mesaj', function(req, res) {
    
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        console.log("primit mesaj")
        //if(conexiune_index){

            //trimit catre restul de utilizatori mesajul primit
            io.sockets.emit('mesaj_nou', fields.nume, fields.font, fields.mesaj,fields.data);
        //}
    res.send("ok");
    });
});
app.get("/chat", function(req,res){
    if( req.session && req.session.utilizator ){
    console.log(req.ip)
    console.log(s_port)
    res.render("pagini/chat",{port:s_port,utilizator:req.session.utilizator});
    //res.sendFile(__dirname+"/pagini/chat");
    }
    else{
        res.status(403).render('pagini/eroare',{mesaj:"Nu aveti acces"});
    }
    
    
});

app.post("/sterge_poza", function(req, res) {
    client.query("SELECT nume, prenume, email, fotografie FROM utilizatori WHERE id=" + req.body.userId, function(err, rez) {
        if(rez.rowCount != 0 ) {
            fs.rmSync(__dirname + "/" + rez.rows[0].fotografie);
            client.query("update utilizatori set fotografie='' where id=" + req.body.userId, function(err, rezUpdate){
                if(err) {
                    console.log(err);
                }
                else {
                    trimiteMailStergere(rez.rows[0].nume, rez.rows[0].prenume, rez.rows[0].email);
                }
            });
        }
    });

});

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
    console.log(req.url);
    res.render("pagini" + req.url, {optiuni_categ_eveniment: optiuni_categ_eveniment}, function(err,rezultatRender){
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

var s_port=process.env.PORT || 8080;
server.listen(s_port);

// app.listen(8080);

console.log("Serverul a pornit");