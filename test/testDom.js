var fireDragon = require("./../src/fireDragon");

window = fireDragon.run("./html/testDom.html");
console.log(window.body.innerHTML);
