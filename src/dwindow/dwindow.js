/**
 * @author dorsywang(314416946@qq.com)
 */

var location = require("./location");
var navigator = require("./navigator");
var document = require("./document");
var xhr = require("./xhr");


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

    addEventListener: function(type, handler, isCapture){
    },

    XMLHttpRequest: xhr,

    Image: function(){
        return document.createElement("image");
    },

    getComputedStyle: function(){
        return {
            getPropertyValue: function(){
                return "";
            }
        };
    }
};

for(var i in window){
    global[i] = window[i];
}


window = global;
global.window = window;
