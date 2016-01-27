/**
 * @author dorsywang(314416946@qq.com)
 */

var eventEmitter = require('events').EventEmitter;
module.exports = function(window){

var copyObject = function(obj){
    var newObj;
    if(obj instanceof Array){
        newObj = [];
    }else{
        newObj = {};
    }

    for(var i in obj){
        var type = typeof obj[i];

        if(obj.hasOwnProperty(i) && type !== "function"){
            if(type === 'object'){
                newObj[i] = copyObject(obj[i]);
            }else{
                newObj[i] = obj[i];
            }
        }
    }

    return newObj;
};

var parseCssText = function(style, val){
     // 解析css
     if(val){
        val = val.split(";");

        val.map(function(item, index){
            if(item){
                var exp = item.split(":");
                var name = exp[0];
                var v = exp[1] || '';

                style[name] = v;
            }
        });
     }

};

var emptyFuc = function(returnVal){
    if(returnVal){
        return function(){
            return returnVal;
        };
    }else{
        return function(){};
    }
};


var NamedNodeMap = function(node){
    this.length = 0;
    this.ownerElment = node;
};

NamedNodeMap.prototype = {
    setNamedItem: function(name, value){
        var attr = this.getNamedItem(name);

        if(attr){
            attr.name = name;
            attr.nodeValue = value || '';
            attr.value = value || '';

            attr.firstChild.value = value || '';
            attr.firstChild.nodeValue = value || '';
        }else{

            this[this.length ++] = {
                name: name,
                value: value || '',
                ownerElment: this.ownerElment,
                nodeType: Element.prototype.ATTRIBUTE_NODE,
                nodeValue: value || '',
                childNodes: function(){
                    var node = new Element();
                    node.nodeType = node.TEXT_NODE;
                    node.value = value || '';
                    node.nodeValue = value || '';

                    return [node];
                }(),

                get lastChild(){
                    return this.childNodes[this.childNodes.length - 1];
                },

                get firstChild(){
                    return this.childNodes[0];
                }
            };
        }
    },

    getNamedItem: function(name){
        for(var i in this){
            if(this.hasOwnProperty(i)){
                var item = this[i];

                if(item.name == name){
                    return item;
                }
            }
        }
    }
};

    var Element = function(opt){
        this.childNodes = [];

        var _this = this;
        this.style = {
            set cssText(val){
                parseCssText(_this.style, val);
            }
        };

        if(opt){
            if(opt.tagName){
                this.tagName = opt.tagName;
            }
        }

        this.attributes = new NamedNodeMap(this);
    };

    Element.prototype = {
        blur: function(){
        },

        get ownerDocument(){
            return window.document;
        },

        get children(){
            var els = [];
            for(var i = 0; i < this.childNodes.length; i ++){
                if(this.childNodes[i].nodeType === 1){
                    els.push(this.childNodes[i]);
                }
            }

            return els;
        },

        get nodeName(){
            return (this.tagName || "").toUpperCase();
        },

        get id(){
            return this.getAttribute('id');
        },

        set id(id){
            this.setAttribute(id);
        },

        get className(){
            return this.getAttribute('className');
        },

        set className(val){
            this.setAttribute('className', val);
        },

        cloneNode: function(){
            if(this.nodeType === this.TEXT_NODE){
                var node = new Element();
                node.nodeType = this.TEXT_NODE;

                node.nodeValue = this.nodeValue;

                return node;
            }

            var node = window.document.createDocumentFragment();

            node.innerHTML = "<" + this.tagName + " " + this._getAttributeString() + "></" + this.tagName + ">";

            return node.childNodes[0];
        },

        focus: function(){
        },

        removeChild: function(node){
            //console.log("removeChild", node.tagName);
            for(var i = 0; i < this.childNodes.length; i ++){
                if(this.childNodes[i] === node){
                    this.childNodes.splice(i, 1);
                    break;
                }
            }
        },

        appendChild: function(node){
            //console.log("append Child", node);
            //
            return this.insertBefore(node);

        },

        addEventListener: function(type, handler, isCapture){
            var emitter;
            if(this._emitter){
                emitter = this._emitter;
            }else{
                emitter = new eventEmitter();
                this._emitter = emitter;
            }

            emitter.addListener(type, handler.handleEvent || handler, isCapture);

        },

        dispatchEvent: function(event){
            var e = {
                preventDefault: function(){
                },

                stopPropagation: function(){
                },

                target: this,

                srcElement: this
            };

            if(this._emitter){
                this._emitter.emit(event.type, e);
            }
        },

        getAttribute: function(attr){
            var item = this.attributes.getNamedItem(attr);
            
            if(item){
                return item.value || '';
            }else{
                return '';
            }
        },
        setAttribute: function(attr, val){
            var _this = this;

            if(attr === "style"){
                 parseCssText(this.style, val);
            }

            this.attributes.setNamedItem(attr, val);
        },

        insertBefore: function(newNode, oldNode){
            for(var i = 0; i < this.childNodes.length; i ++){
                if(this.childNodes[i] === oldNode){
                    break;
                }
            }

            var checkInDocument = function(n){
                var flag = 0;
                var checkNode = function(node){
                    if(node === window.DOMTREE._tree[0]){
                        flag = 1;

                        return;
                    }

                    if(node.parentNode){
                        checkNode(node.parentNode);
                    }
                }

                checkNode(n);

                return flag;
            };

            var isInDocument = checkInDocument(this);

            // 如果是frament 则将子元素添加进去
            if(newNode.tagName === "fragment"){
                Array.prototype.splice.apply(this.childNodes, [i, 0].concat(newNode.childNodes));

                for(var i = 0; i < newNode.childNodes.length; i ++){
                    newNode.childNodes[i].parentNode = this;

                    // 这里有待完善
                    if(isInDocument){
                        newNode.childNodes[i].getIdMap(window.DOMTREE._idMap);
                    }
                }

                // 置空子元素
                newNode.childNodes = [];
            }else{
                // 从原来的父元素中删除掉
                if(newNode.parentNode){
                    newNode.parentNode.removeChild(newNode);
                }

                newNode.parentNode = this;

                this.childNodes.splice(i, 0, newNode);

                // 这里有待完善
                if(isInDocument){
                    newNode.getIdMap(window.DOMTREE._idMap);
                }
            }

            if(newNode.tagName === "script"){
                if(newNode.src){
                    var content = drequire(newNode.src, function(){
                        newNode.onload && newNode.onload.call(newNode);

                        // 注意这里 把新加的脚本执行后就删除了
                        newNode.parentNode.removeChild(newNode);
                    });
                    for(var i in content){
                        global[i] = content[i];
                    }
                }
            }

            return newNode;

        },

        get src(){
            return this.getAttribute("src");
        },

        set src(value){
            this.setAttribute("src", value);
        },

        // 这里实现有待进一步验证
        getAttributeNode: function(attr){
            return {
                value: this[attr],
                specified: true
            };
        },

        // 把id 挂到命名空间下
        getIdMap: function(scopeSpace){
            if(! scopeSpace) return;

            if(this.id){
                scopeSpace[this.id] = this;
            }
            if(this.childNodes.length){
                for(var i = 0; i < this.childNodes.length; i ++){
                    this.childNodes[i].getIdMap(scopeSpace);
                }

            }
        },

        getElementsByClassName: function(className){
            var result = [];
            var classNameReg = new RegExp("(^|\\s+)" + className + "(\\s+|$)");
            if(this.childNodes.length){
                for(var i = 0; i < this.childNodes.length; i ++){
                    if(className.test(this.childNodes[i].className)){
                        result.push(this.childNodes[i]);
                    }
                    result = result.concat(this.childNodes[i].getElementsByClassName(className));
                }

            }

            return result;
        },

        getBoundingClientRect: emptyFuc({top: 0, left: 0}),
        getClientRects: emptyFuc({top: 0, left: 0}),
        getElementsByTagName: function(tagName){
            var result = [];
            if(this.childNodes.length){
                for(var i = 0; i < this.childNodes.length; i ++){
                    if(this.childNodes[i].tagName == tagName || tagName === "*"){
                        result.push(this.childNodes[i]);
                    }
                    result = result.concat(this.childNodes[i].getElementsByTagName(tagName));
                }

                /*
                var find = function(parent){
                    if(parent.tagName == tagName){
                        result.push(parent);
                    }

                    for(var i = 0; i < parent.childNodes.length; i ++){
                        find(parent.childNodes[i]);
                    }
                }

                find(this);
                */
            }

            return result;
        },

        querySelector: function(selector, content){
            var sizzle = window.sandRequire("./../../sizzle/sizzle.js");

            return sizzle(selector, content)[0];
        },

        querySelectorAll: function(selector, content){
            //console.log("using queryAll single node:", selector);
            var sizzle = window.sandRequire("./../../sizzle/sizzle.js");

            var els =  window.Sizzle(selector, content);

            //console.log(els, 'selectorAll');

            //console.log(els);

            return els;
        },

        contains: function(node){
            var flag = 0;
            for(var i = 0; i < this.childNodes.length; i ++){
                var child = this.childNodes[i];

                if(child === node){
                    flag = 1;
                }else{
                    child.contains(node);
                }
            }

            return flag;
        },

        compareDocumentPosition: function(node){
            function comparePosition(a, b){ 
                ( a != b && a.contains(b) && 16 ) + 
                ( a != b && b.contains(a) && 8 ) + 
                ( a.sourceIndex >= 0 && b.sourceIndex >= 0 ? 
                (a.sourceIndex < b.sourceIndex && 4 ) + 
                (a.sourceIndex > b.sourceIndex && 2 ) : 
                1 );
            } 
                
        },

        scrollTop: 0,
        clientHeight: 640,

        _getAttributeString: function(){
            var attrArr = [];

            for(var i in this.attributes){
                if(this.attributes[i].nodeType && this.attributes[i].nodeType === this.ATTRIBUTE_NODE){
                    var attrName = this.attributes[i].name;
                    if(attrName === "className"){
                        attrName = 'class';
                    }

                    if(attrName === "style"){
                        continue;
                    }

                    attrArr.push(attrName + "=\"" + (this.attributes[i].value || '') + "\"");
                }
                
            }

            //console.log('style');
            var styleCode = []; 
            for(var i in this.style){
                if(this.style[i]){
                    styleCode.push(i + ":" + this.style[i]);
                }
            }

            if(styleCode.length){
                attrArr.push("style=\"" + styleCode.join(";") + "\"");
            }

            var attrStr = attrArr.join(" ");
            if(attrStr){
                attrStr = " " + attrStr;
            }
            
            return attrStr;
        },


        get outerHTML(){
            var tagName = this.tagName;
            var selfCloseTagReg = /br|hr|img|link|meta/;

            var isSelfEnd = selfCloseTagReg.test(tagName);

            if(this.nodeType === 3 || ! tagName){
                return this.nodeValue || "";
            }

            var attrStr = this._getAttributeString();


            var html;
            if(isSelfEnd){
                html = "<" + tagName + attrStr + " />";
            }else{
                html = "<" + tagName + attrStr + ">";
                if(this.childNodes){
                    for(var i = 0; i < this.childNodes.length; i ++){
                        html += this.childNodes[i].outerHTML;
                    }
                }

                html += "</" + tagName + ">";
            }

            return html;
        },

        get innerHTML(){
            var tagName = this.tagName;
            var html = "";

            if(this.childNodes && this.childNodes.length){
                for(var i = 0; i < this.childNodes.length; i ++){
                    html += this.childNodes[i].outerHTML;
                }
            }else{
            }

            return html;
        },

        set innerHTML(val){
            var parseDom = require("./../parseDom");

            var dom = {};
            parseDom.parse(val, dom, window);

            this.childNodes = dom.DOMTREE._tree;
            for(var i = 0; i < this.childNodes.length; i ++){
                this.childNodes[i].parentNode = this;
            }
        },

        // 常用的nodeType 常量
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9,
        DOCUMENT_TYPE_NODE: 10,
        DOCUMENT_FRAGMENT_NODE: 11
    };

    return {
        Element: Element
    }

};
