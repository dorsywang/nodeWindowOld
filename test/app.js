var fireDragon = require("./../src/fireDragon");

    /*
    setTimeout(function(){
        console.log(document.getElementsByTagName("html")[0].outerHTML);
    }, 1000);
    */

    // 元素块定义
    /*
    fireDragon.run("./../../dev/index.html");

    setTimeout(function(){
        fireDragon.run("./../../dev/index.html");
    }, 1000);
    */
module.exports = function(req, res,next){

    // 元素块定义
    fireDragon.run("./../../dev/index.html");

	REQ = req;
	RES = res;
    RES.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});

    setTimeout(function(){
        RES.write("<!doctype html>");
        RES.write(document.getElementsByTagName("html")[0].outerHTML);
        RES.end();

        console.log(process.memoryUsage());
    }, 1000);

};
