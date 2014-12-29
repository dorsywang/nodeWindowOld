require("./../../dwindow/dwindow"); 

var htmlStr = '<a class=\'ppp\'>sadf</a>';
var parseDom = require("./../../parseDom");
var a = {};
parseDom.parse(htmlStr, a);

// 测试innerHTML读取
console.log(a.DOMTREE._tree[0].innerHTML);
/*

// 测试设置innerHTML
a.DOMTREE._tree[0].innerHTML = '<a class="ppp">sadf</a>';
console.log(a.DOMTREE._tree[0].innerHTML);

*/
// 测试document frament的append

var frament = document.createDocumentFragment();
frament.innerHTML = "<span class='hao'></span><a><span>sss</span></a>";

console.log("frament innerHTML: ", frament.innerHTML);
a.DOMTREE._tree[0].appendChild(frament);

console.log("append frament之后a的innerHTML:", a.DOMTREE._tree[0].innerHTML);
console.log(frament.innerHTML);

// 测试insertBefor
var node = a.DOMTREE._tree[0];

var newNode = document.createElement("div");
newNode.innerHTML = "<span class='c'><a></a></span><selection></selection>";

node.innerHTML = "<span></span><span class='2'></span>";

node.insertBefore(newNode, node.childNodes[1]);

console.log(node.innerHTML);



