if(typeof plugin === "undefined"){
    plugin = require;
}

var fireDragon = require("./../src/fireDragon");
var path = require("path");
var attr = plugin('alloyteam/api/monitor');
var file = require("fs");


    /*
    setTimeout(function(){
        console.log(document.getElementsByTagName("html")[0].outerHTML);
    }, 1000);
    */

    // 元素块定义
    //fireDragon.run("./../../dist/index.html");

/*
var i = 0;
var run = function(){
    if(i > 24) return;

    fireDragon.destroy();

    fireDragon.run("./../../modules/mobile/bar_rank.html");

    setTimeout(run, 300);

    i ++;
};

setTimeout(run, 100);
*/
    //fireDragon.run("./../../modules/mobile/bar_rank.html");
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

var parent = module.parent;
var parentPath = path.dirname(module.filename);

var registerd  = 0;

module.exports = function(req, res, next){
	var cookie = req.headers.cookie;

	var REQ = req;
	var RES = res;

    var filePath = "./../../modules/mobile/bar_rank.html";

    var originUrl = req.protocol + "://" + req.hostname + req.url;
    var startTime = + new Date();

    var error;
    var outPour = function(html, e){
        try{
            if(! headerSent){
                RES.set({'Content-Type':'text/html;charset=utf-8'});
            }
        }catch(e){
            console.log("-----------");
        }

        headerSent = 1;

        RES.body += "<!doctype html>";
        RES.body += html;

        if(e){
            RES.body += e;
        }

        console.log("pushEndTime:", (+ new Date - startTime));

        attr.attr(606730);
        next();
    };

    var errorFunc = function(e){
        console.log("using no pour out");

        var realPath = path.resolve(parentPath, filePath);

        var html =  file.readFileSync(realPath, {encoding: "utf-8"});

        outPour(html, e);
        attr.attr(606731);

        //fireDragon.destroy();
    };

   var completeFunc = function(html, errorLog){
        if(errorLog){
            errorFunc(errorLog);

            return;
        }

        console.log("Triggerd");
        //clearTimeout(h);

        var completeTime = (+ new Date - startTime);
        console.log("completeTime:", completeTime);

        outPour(html);


        reportSpeed(completeTime);
    };

    // 元素块定义
    try{
        fireDragon.runChild(filePath, req, res, completeFunc, next, startTime);
    }catch(e){
        console.log(e);

        errorFunc(e);

        console.log("error occes");
    }
    //

    var headerSent = 0;

    var reportSpeed = function(completeTime){
        var attrId;
        if(completeTime < 100){
            attrId = 606723;
        }else if(completeTime < 200){
            attrId = 606724;
        }else if(completeTime < 300){
            attrId = 606725;
        }else if(completeTime < 400){
            attrId = 606726;
        }else if(completeTime < 500){
            attrId = 606738;
        }else if(completeTime < 600){
            attrId = 606727;
        }else if(completeTime < 1000){
            attrId = 606728;
        }else{
            attrId = 606729;
        }

        attr.attr(attrId);
    };

    //var h = setTimeout(errorFunc, 1500);
};
