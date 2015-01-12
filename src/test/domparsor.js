var parse = require("./../parseDom");

var dom = {};
parse.parse("aaaaa", dom);


// 显示dom tree
var showDom = function(node){
    if(node.childNodes){
        for(var i = 0; i < node.childNodes.length; i ++){
            console.log(node.childNodes[i].tagName);

            showDom(node.childNodes[i]);
        }
    }
};

console.log(dom.DOMTREE._tree[0].outerHTML);
console.log(dom.DOMTREE._tree[0].childNodes[0]);
