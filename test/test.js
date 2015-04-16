var fireDragon = require("./../src/fireDragon");

fireDragon.run("./html/testDom.html");

console.log(document.getElementsByTagName("html")[0].innerHTML);
