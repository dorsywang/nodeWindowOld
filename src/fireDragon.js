var win = require("./dwindow/dwindow");

var path = require("path"); 
var URL = require("url");
var cp = require('child_process');

var parent = module.parent;
var parentPath = path.dirname(parent.filename);

var originGlobalMap = {};

for(var i in global){
    originGlobalMap[i] = 1;
}

var childPPool = [];
var childPMap = {};
var idCount = 0;
var MAXPOOL = 4;;
var MAXIDCOUT = 1E10;

var fileCache = {
};

module.exports = {
    runChild: function(filepath, req, res, completeFunc, next, startTime){
        idCount ++;
        if(idCount > MAXIDCOUT){
            idCount = 0;
        }

        childPMap[idCount] = completeFunc;
        completeFunc.start = + new Date();

        if(childPPool.length < MAXPOOL){
            var childP = cp.fork(__dirname + '/childProcess.js');

            console.log(childP.pid, 'childCreate');

            childP.on('message', function(m){
                if(m.command === "complete"){
                    var id = m.id;
                    var comFunc = childPMap[id];

                    comFunc && comFunc(m.html);

                    var startTime = comFunc.start;
                    console.log("realCompleteTime", (+ new Date) - startTime);

                    delete childPMap[id];
                }else if(m.command === "error"){
                    var id = m.id;
                    var comFunc = childPMap[id];

                    comFunc(null, m.errorInfo);
                }

                if(m.info === "killSelf"){

                    var indexOf = childPPool.indexOf(childP);
                    childPPool.splice(indexOf, 1);

                    childP.disconnect();
                    childP = null;
                }

            });

            childPPool.push(childP);

        }

        var index = idCount % childPPool.length;

        try{
            childPPool[index].send({command: 'runFireDragon', req: req, res: res, filepath: filepath, id: idCount, startTime: startTime,
                extra: {
                    req: {
                        socket: {
                            remoteAddress: req.socket.remoteAddress
                        }
                    }
            }});
        }catch(e){
            childPPool.splice(index, 1);

            completeFunc && completeFunc(null, "send to child faild" + childPPool.length);
        }
    },
    run: function(filepath, req, res){

        // 每次都return 一个window出去
        var window = win();

        var filepath = path.resolve(parentPath, filepath);
        var basePath = path.dirname(filepath);

        window.__REQ = req;
        window.__RES = res;
        window.__basePath = basePath;

        if(req){
            req._parsedUrl = URL.parse(req.url);
        }


        var html;
        if(fileCache[filepath]){
        }else{
            var fileContent = require("fs").readFileSync(filepath, {encoding: "utf-8"});
            fileCache[filepath] = fileContent;
        }

        html = fileCache[filepath];

        var parsor = require("./parseDom");

        // 文档的window对象
        parsor.parseDocument(html, window);

        return window;
    },

    destroy: function(){
    }
};
