const express = require('express');

app = express();

console.log(__dirname);
app.set("view engine", "ejs");
app.use("/resurse", express.static(__dirname + "/resurse"))

app.get("/", function(req, res) {
    console.log(req.url)
    res.render("pagini/index"); //calea e relativa la folderul views
})

app.get("/ceva", function(req, res) {
    console.log(req.url)
    res.write("Pagina 2");
    res.end();
})

// app.get('/favico.ico' , function(req , res){/*code*/});

app.get("/info-covid", function(req, res) {
    console.log(req.url)
    res.render("pagini/info-covid");
})

// app.get("/*", function(req, res) {
//     res.render("pagini" + req.url, function(err, rezultatRender) {
//         console.log(err);
//         console.log(rezultatRender);
//         if(err) {
//             res.render("pagini/404")
//         }
//         else {
//             res.send(rezultatRender);
//         }
        
//     });
// })

app.listen(8080);

console.log("Serverul a pornit")