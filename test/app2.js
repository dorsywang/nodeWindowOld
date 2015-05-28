var fireDragon = require("./../src/fireDragon");

    /*
    setTimeout(function(){
        console.log(document.getElementsByTagName("html")[0].outerHTML);
    }, 1000);
    */

    // 元素块定义
    //fireDragon.run("./../../dist/index.html");

    fireDragon.run("E:\\AppServ\\www\\qunba_trunk\\dev\\barindex.html");
    /*
    setTimeout(function(){
        fireDragon.run("./../../dev/index.html");
    }, 1000);
    */
        /*
        $(document.body).on("complete", function(e){
            console.log("Triggerd");
            console.dir(document.getElementsByTagName("head")[0]);
        });
        */
module.exports = function(req, res,next){
	var cookie = req.headers.cookie;
    global.node_cookie = cookie;


    var originUrl = req.protocol + "://" + req.hostname + req.url;
    var startTime = + new Date();
    // 元素块定义
    fireDragon.run("E:\\AppServ\\www\\qunba_trunk\\dev\\barindex.html", req, res);

    var headerSent = 0;

    Object.defineProperty(location, "href", {
        set: function(val){
            if(! headerSent){
                RES.writeHead(302, {'Location': val});
            }

            headerSent = 1;
        },

        get: function(val){
            return originUrl;
        }
    });


    $(document.body).on("complete", function(e){
        console.log("Triggerd");

        console.log("completeTime:", (+ new Date - startTime));
        if(! headerSent){
            RES.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
        }

        headerSent = 1;

        var script = document.createElement("script");
        script.type = "text/javascript";
        script.innerHTML = "window.usingFireDragon = 1";


        document.getElementsByTagName("head")[0].appendChild(script);

        console.log( document.getElementsByTagName("head")[0].innerHTML);

        RES.write("<!doctype html>");
        RES.write(document.getElementsByTagName("html")[0].outerHTML);
        RES.end();

        console.log("pushEndTime:", (+ new Date - startTime));

        console.log(process.memoryUsage());

    });



	REQ = req;
	RES = res;

    /*
    setTimeout(function(){
        RES.write("<!doctype html>");
        RES.write(document.getElementsByTagName("html")[0].outerHTML);
        RES.end();
    }, 1000);
    */


};
