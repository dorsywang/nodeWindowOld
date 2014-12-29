require("./../../dwindow/dwindow");
var node = document.createElement("div");
node.id = "a";
node.innerHTML = "<div id='m'></div><span><a id='h'></a></span>";

/*
// 测试getIdMap
var idMap = {};
node.getIdMap(idMap);

console.log(idMap);
*/

// 测试插入DOM id更新
var documentHTML = "<html><head></head><body><div id='p'></div></body></html>";
var parsor = require("./../../parseDom");
parsor.parseDocument(documentHTML);

var newNode = document.createDocumentFragment("div");
newNode.innerHTML = "<div id='pp'></div><div id='p2'></div>";

document.body.appendChild(newNode);
console.log(document.body.innerHTML);

var pp = document.getElementById("pp");

console.log(pp);
