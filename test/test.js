var fireDragon = require("./../src/fireDragon");

fireDragon.run("./html/testDom.html");

var a = document.querySelector(".a");

console.log(a.innerHTML);

var b = document.createElement("div");
b.innerHTML = a.innerHTML;

console.log(b);
