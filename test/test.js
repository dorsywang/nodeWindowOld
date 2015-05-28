var fireDragon = require("./../src/fireDragon");

window = fireDragon.run("./html/testDom.html");

console.log(window.document.getElementsByTagName("html")[0].innerHTML);
