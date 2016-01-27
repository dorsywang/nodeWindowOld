var fireDragon = require("./../src/fireDragon");

var window = fireDragon.run("E:\\AppServ\\www\\\qunba_trunk\\dist\\chat_list.html");
setTimeout(function(){
    console.log(window.document.body.innerHTML);
}, 2000);
