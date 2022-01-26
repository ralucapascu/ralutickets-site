window.addEventListener("load", function() {

    var tema = localStorage.getItem("tema");
    if(!tema){
        localStorage.setItem("tema", "light");
    }
    else {
        if(tema == "dark")
            document.body.classList.add("dark");
    }

    var stergePoze = document.getElementsByClassName("sterge-poza");
    
});

function stergePoza(userId) {
    var imag = document.getElementById("poza-" + userId);
    imag.remove();
    fetch("/sterge_poza", {		

        method: "POST",
        headers:{'Content-Type': 'application/json'},
        
        mode: 'cors',		
        cache: 'default',
        body: JSON.stringify({
            userId: userId
        })
    })
    .then(function(rasp){ console.log(rasp); x=rasp.json(); console.log(x); return x})
}

