window.onload = function() {

    var tema = localStorage.getItem("tema");
    if(!tema){
        localStorage.setItem("tema", "light");
    }
    else {
        if(tema == "dark")
            document.body.classList.add("dark");
    }

    ids_produse_init=localStorage.getItem("produse_selectate");
  if(ids_produse_init)
      ids_produse_init=ids_produse_init.split(",");//obtin vectorul de id-uri ale produselor selectate  (din cosul virtual)
  else
      ids_produse_init=[]

  var btn_adauga = document.querySelectorAll('[id=btn-adauga]');
  var btn_scade = document.querySelectorAll('[id=btn-scade]');
  var quantity = document.querySelectorAll('[id=cantitate]');
  console.log(typeof(quantity[1].innerHTML));
  var i = 0;
  btn_adauga.onclick = function() {
      console.log("yey");
  }
  for (var cantitate of quantity) {
     console.log(cantitate.innerHTML, i);
    var intQuantity = parseInt(cantitate.innerHTML);
    btn_adauga[i].onclick = function() {
        console.log("i in functie ", i);
        intQuantity += 1;
        cantitate.innerHTML = intQuantity.toString();
        console.log(btn_adauga.indexOf(btn));
      }
    i++;
  }
  console.log(intQuantity);
  
}
  