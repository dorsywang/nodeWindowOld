/**
 * @author dorsywang(314416946@qq.com)
 */

var location = require("./location");
var navigator = require("./navigator");
var document = require("./document");
var xhr = require("./xhr");
var fs = require("fs");
var path = require("path");


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
        return {
            getPropertyValue: function(name){
                if(name === "display"){
                    //node.style.display
                }
                return "";
            }
        };
    },

    drequire: function(js){
        var script = process.binding("evals").NodeScript;
        
        var filename = js;

        var filepath = path.resolve(__basePath, filename);

        var content = fs.readFileSync(filepath, {encoding: "utf-8"});

        //console.log(filepath);
        script.runInThisContext(content);
    }
};

for(var i in window){
    global[i] = window[i];
}


window = global;
global.window = window;
