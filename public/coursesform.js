function addinputFields(){
    var number = document.getElementById("qt").value;
    var form = document.getElementById("form");
    while (container.lastChild) {
        container.removeChild(container.lastChild);
    }
    if(number<=50 && number>=10){
        for (i=0;i<number;i++){

            input = document.createElement("div");
            input.classList.add('col-6','margem1', 'divQuestion');

            code = '';
            div ='divQuestion'+(i+1)
            code+="<button class='container-fluid showButton' onClick=showHide('"+div+"') type='button'>__________________</button>"+
            '<div id="divQuestion'+(i+1)+'" class="form-group mx-4 px-4 mt-5 display">'+
            '<label class="text-light"for="email">Questão nº '+(i+1)+':</label>'+
            '<input id="question'+(i+1)+'" name="question'+(i+1)+'" class="form-control" type="text" placeholder="nome" required>'+
            '<div class="valid-feedback"><img src="valido.png" width="15px"></div>'+
            '<div class="invalid-feedback">Digite a questão.</div><br>'+
            '<label class="text-light" for="email" >Adicione o enunciado:</label>'+
            '<textarea id="context'+(i+1)+'" name="context'+(i+1)+'" class="form-control" type="text" placeholder="..." rows="3" required></textarea>';
            for(x=0;x<4;x++){ 
                code+='<label class="text-light">'+(x+1)+'ª alternativa:</label>'+
                '<input id="'+(i+1)+'resposta'+(x+1)+'" name="'+(i+1)+'resposta'+(x+1)+'" class="form-control" type="text" placeholder="nome" required>';
                code+='<input id="'+(i+1)+'correct'+(x+1)+'" name="correct'+(i+1)+'" value="'+(x+1)+'" type="radio"><label class="text-light">Resposta correta</label><br>';
            }
            code+="</div>";
            input.innerHTML = code;
            container.appendChild(input);
        }
    }

}

function showHide(element){
    if(document.getElementById(element).style.display == '' ||document.getElementById(element).style.display == 'none'  ){
        document.getElementById(element).style.display = 'block'}
    else{
        document.getElementById(element).style.display = 'none'
    }
}
