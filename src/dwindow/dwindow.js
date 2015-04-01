/**
 * @author dorsywang(314416946@qq.com)
 */

var location = require("./location");
var navigator = require("./navigator");
var document = require("./document");
var xhr = require("./xhr");
var fs = require("fs");
var path = require("path");
var url = require("url");
var querystring = require("querystring");
var vm = require('vm');


var window = {
    location: location,
    navigator: navigator,
    document: document,
    localStorage: {
        clear: function(){},
        setItem: function(){
        },

        getItem: function(){
        }
    },
    alert: function(val){
        console.log(val);
    },

    addEventListener: function(type, handler, isCapture){
    },

    XMLHttpRequest: xhr,

    Image: function(){
        return document.createElement("image");
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

    // 这里require是由script标签触发的
    drequire: function(filename, callback){
        filename = filename.replace("http://pub.idqqimg.com/qqun/xiaoqu/mobile/", "./");

        console.log(filename);
        var urlpath = url.parse(filename);
        var search = urlpath.search;
        var query = querystring.parse((urlpath.search || "").replace(/^\?/, ""));


        // http请求
        if(urlpath.hostname && urlpath.hostname != "pub.idqqimg.com"){
            var xhr = new XMLHttpRequest();
            xhr.open("GET", urlpath.href);
            xhr.onload = function(data){
                vm.runInThisContext(content, filename);
            };

            xhr.send(search);

        // 本地文件
        }else{
            var filepath = path.resolve(__basePath, urlpath.pathname);

            var content = fs.readFileSync(filepath, {encoding: "utf-8"});

            console.log("require,", filepath);
            vm.runInThisContext(content, filename);

            callback && callback();
        }
    },

    get fireDragon(){
        return {
            version: "0.0.1"
        };
    }
};

for(var i in window){
    global[i] = window[i];
}


window = global;
global.window = window;
