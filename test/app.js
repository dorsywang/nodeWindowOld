var fireDragon = require("./../src/fireDragon");

    // 元素块定义
    fireDragon.run("./../../dev/index.html");

module.exports = function(req, res,next){


	REQ = req;
	RES = res;
    RES.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});

    setTimeout(function(){
        RES.write(document.getElementsByTagName("html")[0].outerHTML);
        RES.end();
    }, 400);

};
