window.onload = function() {
  
  var tema = localStorage.getItem("tema");
    if(!tema){
        localStorage.setItem("tema", "light");
    }
    else {
        if(tema == "dark")
            document.body.classList.add("dark");
    }

  let btn_filter = document.getElementById("btn-filter");
  btn_filter.onclick = function() {
      var is_valid = true;
      let evenimente = document.getElementsByClassName("produs");
      for(let ev of evenimente) {
          ev.style.display="none";
          var nume = ev.getElementsByTagName("h3")[0];
          var conditie1 = nume.innerHTML.toLowerCase().includes(document.getElementById("input-nume-eveniment").value.toLowerCase());

          var admite_voucher = ev.getElementsByClassName("val-admite-voucher")[0];
          var conditie2 = document.getElementById("select-admite-voucher").value.length !== 0 ? 
            document.getElementById("select-admite-voucher").value === admite_voucher.getAttribute("value") : true;

          var conditie3 = false;
          var subcategEveniment = ev.getElementsByClassName("val-subcateg-eveniment")[0];
          var checkboxSubcateg = document.querySelectorAll('[id=checkbox-input]:checked');
          if(checkboxSubcateg.length !== 0) {
            var checkboxSubcateg = document.querySelectorAll('[id=checkbox-input]');
            var errorDesc = document.querySelectorAll('[id=subcateg-required]');
            for(let i=0; i < checkboxSubcateg.length; i++) {
              checkboxSubcateg[i].classList.remove("is-invalid");
              errorDesc[i].innerHTML = "";
            }
            for(let subOpt of checkboxSubcateg) {
              if(subcategEveniment.getAttribute("value").includes(subOpt.getAttribute("value")) && subOpt.checked === true) {
                conditie3 = true;
              }
            }
          }
          else {
            is_valid = false;
            var checkboxSubcateg = document.querySelectorAll('[id=checkbox-input]');
            var errorDesc = document.querySelectorAll('[id=subcateg-required]');
            for(let i=0; i < checkboxSubcateg.length; i++) {
              checkboxSubcateg[i].classList.add("is-invalid");
              errorDesc[i].innerHTML = "";
            }
            errorDesc[checkboxSubcateg.length - 1].innerHTML = "Alegeti cel putin o subcategorie!";
          }

          var tara = ev.getElementsByClassName("val-tara")[0];
          var radioTari = document.querySelectorAll('[id=radio-tari]:checked')[0];
          var conditie4 = radioTari.value.length === 0 ? true : radioTari.value === tara.getAttribute("value");
          
          var categVarsta = ev.getElementsByClassName("val-categ-varsta")[0].getAttribute("value");
          categVarsta = categVarsta.substring(1, categVarsta.length-1);
          categoriiVarsta = categVarsta.split(',');
          var multipleSelectVarsta = document.querySelectorAll('[id=option-varsta]:checked');
          var conditie5 = true;
          for(let varsta of multipleSelectVarsta) {
            if (categoriiVarsta.includes(varsta.value)) {
              conditie5 = false;
            } 
          }

          var pret = ev.getElementsByClassName("val-pret-min")[0];
          var conditie6=parseInt(pret.innerHTML) > parseInt(document.getElementById("range-pret-min").value);

          //incepem validarea pe date
          var data_inceput = null;
          var data_sfarsit = null;

          if(document.getElementById("input-inceput").value !== "" && document.getElementById("input-sfarsit").value !== "") {
            data_inceput = moment(document.getElementById("input-inceput").value);
            data_sfarsit = moment(document.getElementById("input-sfarsit").value);

            if(document.getElementById("input-inceput").classList.contains("is-invalid") || document.getElementById("input-sfarsit").classList.contains("is-invalid")) {
              document.getElementById("input-inceput").classList.remove("is-invalid");
              document.getElementById("input-sfarsit").classList.remove("is-invalid");
              document.getElementById("input-sfarsit").ariaDescribedBy = "";
              document.getElementById("input-inceput").ariaDescribedBy = "";
            }
            
            if(data_sfarsit.isBefore(data_inceput)) {
              document.getElementById("input-inceput").classList.add("is-invalid");
              document.getElementById("input-sfarsit").classList.add("is-invalid");
              is_valid = false;
              document.getElementById("input-sfarsit").ariaDescribedBy = "invalidDateSfarsit";
              document.getElementById("invalidDateSfarsit").innerHTML = "Data de inceput trebuie sa fie inaintea celei de sfarsit!"
            }
          }
          else if(document.getElementById("input-inceput").value === "" && document.getElementById("input-sfarsit").value !== "") {
            document.getElementById("input-inceput").classList.add("is-invalid");
            is_valid = false;
            document.getElementById("input-inceput").ariaDescribedBy = "invalidDateInceput";
            document.getElementById("invalidDateInceput").innerHTML = "Selectati o data de inceput!"
          }
          else if(document.getElementById("input-sfarsit").value === "" && document.getElementById("input-inceput").value !== "") {
              document.getElementById("input-sfarsit").classList.add("is-invalid");
              is_valid = false;
              document.getElementById("input-sfarsit").ariaDescribedBy = "invalidDateSfarsit";
              document.getElementById("invalidDateSfarsit").innerHTML = "Selectati o data de sfarsit!"
          }
          

          var conditie7=true;
          if(data_inceput!== null && data_sfarsit !== null) {
            var data_eveniment = moment(ev.getElementsByClassName("data-eveniment")[0].getAttribute("value"));
            if(!data_eveniment.isSameOrBefore(data_sfarsit) || !data_eveniment.isSameOrAfter(data_inceput)) {
              conditie7 = false;
            }
          }

          var descriere = ev.getElementsByClassName("val-descriere")[0];
          var conditie8 = descriere.getAttribute("value").toLowerCase().includes(document.getElementById("descriere-eveniment").value.toLowerCase());

          if(is_valid) {
            if(conditie1 && conditie2 &&conditie3 && conditie4 && conditie5 && conditie6 && conditie7 && conditie8)
            ev.style.display="block";
          }
      }
      if(!is_valid) {
        for(let ev of evenimente) {
          ev.style.display = "block";
        }
      }
  }

  var rng=document.getElementById("range-pret-min");
  rng.onchange=function() {
      var info = document.getElementById("infoRange");//returneaza null daca nu gaseste elementul
      if(!info){
          info=document.createElement("span");
          info.id="infoRange"
          this.parentNode.appendChild(info);
      }
      
      info.innerHTML="("+this.value+")";
  }

  function sorteaza(semn){
      var articole=document.getElementsByClassName("produs");
      var v_articole=Array.from(articole);
      v_articole.sort(function(a,b){
          var subcateg_a=a.getElementsByClassName("val-subcateg-eveniment")[0].getAttribute("value");
          var subcateg_b=b.getElementsByClassName("val-subcateg-eveniment")[0].getAttribute("value");
          console.log(subcateg_a, subcateg_b);
          if(subcateg_a!==subcateg_b){
            return semn*(subcateg_a.localeCompare(subcateg_b));
          }
          else{
            var pret_a=parseInt(a.getElementsByClassName("val-pret-min")[0].innerHTML);
            var pret_b=parseInt(b.getElementsByClassName("val-pret-min")[0].innerHTML);
            return semn*(pret_a-pret_b);
          }
      });
      for(let art of v_articole){
          art.parentNode.appendChild(art);
      }
  }

  var btnSortAsc=document.getElementById("sort-asc");
  btnSortAsc.onclick=function(){
    sorteaza(1);
  }

  var btnSortDesc=document.getElementById("sort-desc");
  btnSortDesc.onclick=function(){
    sorteaza(-1);
  }


  document.getElementById("btn-reset").onclick=function() {
      document.getElementById("input-nume-eveniment").value = "";

      let newValue = 0;
      document.getElementById("range-pret-min").value = newValue;

      var info = document.getElementById("infoRange");
      info.innerHTML="("+newValue+")";

      var radioTari = document.querySelectorAll('[id=radio-tari]');
      for(let radio of radioTari) {
        if(radio.value === "") {
          radio.checked = true;
          break;
        }
      }

      var checkboxSubcateg = document.querySelectorAll('[id=checkbox-input]');
          for(let subOpt of checkboxSubcateg) {
            subOpt.checked = true;
          }

      document.getElementById("select-admite-voucher").value = "";

      var multipleSelectVarsta = document.querySelectorAll('[id=option-varsta]');
      for(let varsta of multipleSelectVarsta) {
        varsta.selected = false; 
      }

      document.getElementById("descriere-eveniment").value = "";

      document.getElementById("input-inceput").value = "";
      document.getElementById("input-sfarsit").value = "";

      //resetare articole
      let evenimente = document.getElementsByClassName("produs");
      for(let ev of evenimente) {
        ev.style.display = "block";
      }
  }
 


  window.onkeydown=function(e){
    if(e.key=="c" && e.altKey==true){
        var evenimente=document.getElementsByClassName("produs");
        var pret = parseFloat(evenimente[0].getElementsByClassName("val-pret-min")[0].innerHTML);
        var min = pret;
        for(let ev of evenimente) {
            if(ev.style.display!="none")
                if(parseFloat(ev.getElementsByClassName("val-pret-min")[0].innerHTML) < min) {
                  min = parseFloat(ev.getElementsByClassName("val-pret-min")[0].innerHTML);
                }
        }

        var spanMin;
        spanMin=document.getElementById("numar-min");
        if(!spanMin){
            spanMin=document.createElement("span");
            spanMin.innerHTML=" Pretul minim:"+ min;
            spanMin.id="numar-min";
            document.getElementById("div-min").appendChild(spanMin);
            setTimeout(function(){document.getElementById("numar-min").remove()}, 2000);
        }
    }
  }

  var btnCalculeaza = document.getElementById("btn-calculeaza");
  btnCalculeaza.onclick = function() {
    var evenimente=document.getElementsByClassName("produs");
    var pret = parseFloat(evenimente[0].getElementsByClassName("val-pret-min")[0].innerHTML);
    var min = pret;
    for(let ev of evenimente) {
        if(ev.style.display!="none")
            if(parseFloat(ev.getElementsByClassName("val-pret-min")[0].innerHTML) < min) {
              min = parseFloat(ev.getElementsByClassName("val-pret-min")[0].innerHTML);
            }
    }

    var spanMin;
    spanMin=document.getElementById("numar-min");
    if(!spanMin){
        spanMin=document.createElement("span");
        spanMin.innerHTML=" Pretul minim:"+ min;
        spanMin.id="numar-min";
        document.getElementById("div-min").appendChild(spanMin);
        setTimeout(function(){document.getElementById("numar-min").remove()}, 2000);
    }
  }
}