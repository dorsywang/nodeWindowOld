/**
 * @author dorsywang(314416946@qq.com)
 */
var domEle = require("./domelement");

var events = {};

events.Event = function(eventType) {
    this._eventType = eventType;
    this._type = null;
    this._bubbles = null;
    this._cancelable = null;
    this._target = null;
    this._currentTarget = null;
    this._eventPhase = 0;
    this._timeStamp = null;
    this._preventDefault = false;
    this._stopPropagation = false;
};
events.Event.prototype = {
    initEvent: function(type, bubbles, cancelable) {
        this._type = type;
        this._bubbles = bubbles;
        this._cancelable = cancelable;
    },
    preventDefault: function() {
        if (this._cancelable) {
            this._preventDefault = true;
        }
    },
    stopPropagation: function() {
        this._stopPropagation = true;
    },
    NONE            : 0,
    CAPTURING_PHASE : 1,
    AT_TARGET       : 2,
    BUBBLING_PHASE  : 3,
    get eventType() { return this._eventType; },
    get type() { return this._type; },
    get bubbles() { return this._bubbles; },
    get cancelable() { return this._cancelable; },
    get target() { return this._target; },
    get currentTarget() { return this._currentTarget; },
    get eventPhase() { return this._eventPhase; },
    get timeStamp() { return this._timeStamp; }
};


module.exports = {
    createElement: function(tagName){
        var node = new domEle.Element();
        node.tagName = tagName;

        return node;
    },

    addEventListener: function(event, handler, isCapture){
        this.documentElement.addEventListener(event, handler, isCapture);
    },


    getElementById: function(id){
        return DOMTREE.getNodeById(id);
    },

    getElementsByClassName: function(className){
        //console.log(className);

        var item;
        var result = [];
        var allNodes = DOMTREE.getAllNodes();
        for(var i = 0; i < allNodes.length; i ++){
            item = allNodes[i];

            if(new RegExp(className).test(item.className) ){
                result.push(item);
            }
        }

        return result;
    },

    getElementsByTagName: function(tagName){
        //console.log("get element by tagName:", tagName);

        /*
        var item;
        var result = [];
        var allNodes = DOMTREE.getAllNodes();

        for(var i = 0; i < allNodes.length; i ++){
            item = allNodes[i];

            if(item.tagName === tagName){
                result.push(item);
            }
        }

        return result;
        */

        if(tagName === "html"){
            return [this.documentElement];
        }else{
            return this.documentElement.getElementsByTagName(tagName);
        }
    },

    querySelectorAll: function(selector){
        //console.log("document query: ", selector);
        //console.log("document querySelector:", selector);
        return [];
    },

    nodeType: 9,

    createEvent: function(type){
        return new events.Event(type);
    },


    removeEventListener: function(type, listener, capturing) {
    },

    dispatchEvent: function(event) {
        return this.documentElement.dispatchEvent(event);
    },

    createDocumentFragment: function(){
        var node = new domEle.Element();
        node.tagName = "fragment";

        return node;
    },

    get cookie(){
        if(window.__REQ){
            var cookie = window.__REQ.headers.cookie;
            return cookie;
        }

        return "";
    },

    set cookie(cookieStr){
    },

    DOCUMENT_NODE: 9

};
