var fireDragon = require("./../src/fireDragon");

var window = fireDragon.run("./html/testCase.html");

document = window.document;

// test getElementsByTagName
var a = document.getElementsByTagName("img");
//console.log(a);

var b = document.getElementsByTagName("html");
//console.log(b);

// test innerHTML
var c = document.getElementsByTagName("html")[0];
//console.log(c.innerHTML);
//console.log(c.outerHTML);

// test style
var d = document.body;
d.style.width = '12px';
d.style.display = "block";
//console.log(d.outerHTML);

// test appendChild
var script = document.createElement("script");
script.type = "text/javascript";
script.innerHTML = "window.usingFireDragon = 1";

document.getElementsByTagName("head")[0].appendChild(script);

// test cssText
document.body.style.cssText = "left: 0px; top: 0px;";

console.log(document.documentElement.innerHTML);

// test insert script

