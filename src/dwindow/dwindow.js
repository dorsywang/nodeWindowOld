/**
 * @author dorsywang(314416946@qq.com)
 */

var f = function(){
    var location = require("./location");
    var navigator = require("./navigator");
    var document = require("./document");
    var xhr = require("./xhr");
    var fs = require("fs");
    var path = require("path");
    var url = require("url");
    var querystring = require("querystring");
    var vm = require('vm');
    var fileReadMap = {};
    var fileCompiledMap = {};

    var domEle = require("./domelement");

    var _window = {
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        parseInt: parseInt,
        parseFloat: parseFloat,
        localStorage: {
            clear: function(){},
            setItem: function(){
            },

            getItem: function(){
            },

            removeItem: function(){
            }
        },
        alert: function(val){
            console.log(val);
        },

        console: {
            log: function(){
            },

            info: function(){
            },

            debug: function(){
            },

            dir: function(){
            }
        },

        addEventListener: function(type, handler, isCapture){
        },


        Image: function(){
            return _window.document.createElement("image");
        },

        getComputedStyle: function(node){
            //console.log("get style");
            return {
                getPropertyValue: function(name){
                    if(name === "display"){
                        //node.style.display
                    }
                    return "";
                }
            };
        },

        // 预先编译
        dpreCompile: function(filename, callback){
            return this.drequire(filename, callback, 1);
        },

        // 这里require是由script标签触发的
        drequire: function(filename, callback, isPreCompile){
            filename = filename.replace("http://pub.idqqimg.com/qqun/xiaoqu/mobile/", "./");
            filename = filename.replace("http://s.url.cn/qqun/xiaoqu/buluo/buluoadmin/", "./");

            var fireDragonPath = path.dirname(module.parent.filename);

            if(/qqapi\.js/.test(filename)){
                filename = path.resolve(fireDragonPath, "./../src/lib/qqapi.js");
            }

            var urlpath = url.parse(filename);
            var search = urlpath.search;
            var query = querystring.parse((urlpath.search || "").replace(/^\?/, ""));


            // http请求
            if(urlpath.hostname){
                /*
                var xhr = new this.XMLHttpRequest();
                xhr.open("GET", urlpath.href);
                xhr.onload = function(data){
                    vm.runInThisContext(content, filename);
                };

                xhr.send(search);
                */

            // 本地文件
            }else{
                var filepath;
                if(/qqapi\.js/.test(filename)){
                    filepath = filename;
                }else{
                    filepath = path.resolve(this.__basePath, urlpath.pathname);
                }

                var content;

                if(fileReadMap[filename]){
                }else{
                   fileReadMap[filename] = fs.readFileSync(filepath, {encoding: "utf-8"});
                }

                content = fileReadMap[filename];

                // console.log("fireDragon require:", filepath);
                if(fileCompiledMap[filename]){
                }else{
                    fileCompiledMap[filename] = new vm.Script(content);
                }

                var compiledScript = fileCompiledMap[filename];

                if(isPreCompile){
                    return compiledScript;
                }else{
                    var rs = compiledScript.runInNewContext(this);

                    for(var i in rs){
                        this[i] = rs[i];
                    }

                    ctx = null;
                }

                callback && callback();
            }
        },

        runCode: function(code){
            return vm.runInNewContext(code, this);
        },

        sandRequire: function(pathname){
            var filename = module.filename;
            var realPath = path.resolve(filename, pathname);

            var content = fs.readFileSync(realPath, {encoding: "utf-8"});

            return this.runCode(content);
        },

        get fireDragon(){
            return {
                version: "0.0.1"
            };
        },

        domEle: domEle
    };

    _window.XMLHttpRequest = xhr(_window);
    _window.navigator = navigator(_window);
    _window.domEle = domEle(_window);
    _window.document = document(_window);
    _window.location = location(_window);


    _window.window = _window;

    return _window;

};



module.exports = f;
