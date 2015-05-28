/**
 * @author dorsywang(314416946@qq.com)
 * A simple dom tree parsor
 * 简单的DOM树解析器
 */

/**
 * 树结构
 * Tree Model
 */
var Tree = function(){
    this._tree = [];
    this._idMap = {};
    this._allNode = [];

    this._currNodesArr = null;

    this._currNodesArr = this._tree;

    this._currNode;
};

Tree.prototype = {
    goNext: function(){
        if(! this._currNode.childNodes){
            this._currNode.childNodes = [];
        }

        this._currNodesArr = this._currNode.childNodes;

        this._currNodeParent = this._currNode;

    },

    push: function(node){
        this._currNodesArr.push(node);
        this._currNode = node;

        if(this._currNodeParent){
            node.parentNode = this._currNodeParent;
        }else{
            node.parentNode = {
                name: "ROOT",
                childNodes: this._tree
            };
        }
    },

    // 回溯
    backUp: function(){
        this._currNode = this._currNode.parentNode;
        this._currNodeParent = this._currNode.parentNode;
        this._currNodesArr = this._currNode.parentNode.childNodes;
    },

    getNodeById: function(id){
        return this._idMap[id] || null;
    },

    getAllNodes: function(){
        return this._allNode || [];
    }
};




//_DOM_._tree = Tree._tree;

var preParsedMap = {};

var parse = function(htmlStr, scopeSpace, windowSpace){
    var domEle = windowSpace.domEle;
    var document = windowSpace.document;

    var docTree = new Tree();

    scopeSpace.DOMTREE = docTree;

    var _idMap = docTree._idMap; 
    var _allNode = docTree._allNode;

    var preParedQueue;
    if(preParsedMap[htmlStr]){
    }else{
        preParsedMap[htmlStr] = preParse(htmlStr);
    }


    preParedQueue = preParsedMap[htmlStr];

    for(var i = 0; i < preParedQueue.length; i ++){
        var item = preParedQueue[i];

        var tagType = item.tagType;

        var tagName = item.tagName;

        if(tagType === "startTag"){
            node = document.createElement(tagName);
            node.nodeType = node.ELEMENT_NODE;
            
            if(tagName === "head"){
                document.head = node;
            }

            if(tagName === "body"){
                document.body = node;
            }

            if(tagName === "html"){
                document.documentElement = node;
            }

            currNode = node;
            attrsObj = {};

            docTree.push(node);
            _allNode.push(node);
        }else if(tagType === "attrs"){
            var match = item.match;
            if(match === ">"){
                if(currNode.getAttribute('type') && (currNode.getAttribute("type") + '').toLowerCase() !== "text/javascript"){
                }else{
                    if(currNode.getAttribute("src")){
                        var attrValue = currNode.getAttribute("src");
                        var content = windowSpace.drequire(attrValue);

                        /*
                        for(var i in content){
                            global[i] = content[i];
                        }
                        */
                    }
                }

                if(item.goNext){
                    docTree.goNext();
                }
            }else if(match === "/>"){
            }else {
                var attrName = item.attrName;
                var attrValue = item.attrValue;

                if(attrName === "id"){
                    _idMap[attrValue] = currNode;
                }

                currNode.setAttribute(attrName, attrValue);
            }
        }else if(tagType === "textTag"){
            var text = item.nodeValue;

            node = new domEle.Element();
            node.nodeType = 3;
            node.nodeValue = text || '';

            docTree.push(node);

            currNode = node;

            if(item.checkParentScript){
                  if(node.parentNode.tagName === "script"){
                      if(node.parentNode.getAttribute('type') && (node.parentNode.getAttribute("type") + '').toLowerCase() !== "text/javascript"){
                        }else{
                            try{
                                windowSpace.runCode(text);
                                //vm.runInThisContext(text, "vm");
                            }catch(e){
                            }
                        }
                    }

            }

            if(item.backUp){
                docTree.backUp();
            }
        }else if(tagType === "endTag"){
                // 如果是一个endTag 将一个空结点做为tag的子结点
                var node = new domEle.Element();
                node.nodeType = 3;
                node.nodeValue = '';
                docTree.push(node);

                if(item.backUp){
                    docTree.backUp();
                }

        }
    }


    return;


    // 预处理
    // 去掉注释
    // @todo 自封口
    var commentsReg = /<!--[\s\S]*-->/g;

    htmlStr = htmlStr.replace(commentsReg, "");

    // 对转义字符的处理
    var escapeCharReg = /\\(.)/g;

    var escapeCount = 0;
    var escapeCharTable = {
    };

    // 预处理
    /*
    str = str.replace(escapeCharReg, function(result, $1){
        if(escapeCharTable[$1]){
        }else{
            escapeCount ++;

            escapeCharTable[$1] = escapeCount;
        }

        var index = escapeCharTable[$1];

        var escapeChar = "__fire__" + index;

        return escapeChar;
    });
    */

    var docTree = new Tree();

    scopeSpace.DOMTREE = docTree;

    var _idMap = docTree._idMap; 
    var _allNode = docTree._allNode;

    //var tagReg = /\s*<(\/?)([^>\s]+)([^>]*)>/g;

     var tagReg = /<([^\s\/>]+)|<(\/)([^\s>]+)>|([^<]+)/g;

    var attrReg = />|\/>|([^\s=]+)=(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g;

    var selfCloseTagReg = /br|hr|img|link|meta/;

    // 可能里面允许出现</div这样的东西的tag
    var mixableTagReg = /script|code|pre/;

    var getCloseTagReg = function(tagName){
        var reg = new RegExp("</(" + tagName + ")>", "g");
        reg.type = "mixableTagCloseReg";

        return reg;
    };

    /**
     * 分析元素树
     */
    var result, attrResult, attrsObj;
    var lastIndex = 0, lastTagName = "";
    var text, textNode;

    var currReg = tagReg;

    currReg.lastIndex = 0;

    var currNode, attrsObj = {};

    var setCurrTag = function(tag){
        lastIndex = currReg.lastIndex;

        currReg = tag;
        currReg.lastIndex = lastIndex;

    };

    while(result = currReg.exec(htmlStr)){
        var tagType;

        var tagName = result[1] || result[3];
        var node;

        // 如果是tag 判断type
        if(currReg === tagReg){
            if(result[1]){
                tagType = "startTag";
            }else if(result[2] === "/"){
                tagType = "endTag";
            }else{
                tagType = "textTag";
            }
        }else if(currReg === attrReg){
            tagType = "attrs";
        }else if(currReg.type === "mixableTagCloseReg"){
            tagType = "mixableTagCloseReg";
        }

        if(tagType === "startTag"){
            node = document.createElement(tagName);
            node.nodeType = node.ELEMENT_NODE;
            
            if(tagName === "head"){
                document.head = node;
            }

            if(tagName === "body"){
                document.body = node;
            }

            if(tagName === "html"){
                document.documentElement = node;
            }

            currNode = node;
            attrsObj = {};

            docTree.push(node);
            _allNode.push(node);

            // 开始进入属性分析进程
            setCurrTag(attrReg);


        // 属性分析进程
        }else if(tagType === "attrs"){
            if(result[0] === ">"){
                if(currNode.getAttribute('type') && (currNode.getAttribute("type") + '').toLowerCase() !== "text/javascript"){
                }else{
                    if(currNode.getAttribute("src")){
                        var attrValue = currNode.getAttribute("src");
                        var content = windowSpace.drequire(attrValue);
                        /*
                        for(var i in content){
                            global[i] = content[i];
                        }
                        */
                    }
                }

                // 开始寻找开始、结束标签
                setCurrTag(tagReg);

                // 属于自封口的是不会继续深入的
                if(selfCloseTagReg.test(currNode.tagName)){
                }else{
                    docTree.goNext();
                }

                // 如果是script等 不在寻找标签
                if(mixableTagReg.test(currNode.tagName)){
                    setCurrTag(getCloseTagReg(currNode.tagName));
                }

            // 自封口了
            }else if(result[0] === "/>"){
                // 开始寻找开始、结束标签
                setCurrTag(tagReg);

            // 这里分析属性
            }else{
                var attrName = (result[1] + '').trim();
                var attrValue = result[2] || result[3] || result[4];

                if(attrName === "class"){
                    attrName = "className";
                }else if(attrName === "id"){
                    _idMap[attrValue] = currNode;
                }

                node.setAttribute(attrName, attrValue);
            }
        }else if(tagType === "textTag"){
            var text = result[4];

            node = new domEle.Element();
            node.nodeType = 3;
            node.nodeValue = text || '';

            docTree.push(node);

            currNode = node;


        }else if(tagType === "endTag"){
                
                // 如果是一个endTag 将一个空结点做为tag的子结点
                var node = new domEle.Element();
                node.nodeType = 3;
                node.nodeValue = '';
                docTree.push(node);

                // 自封口没有深入 也不会回溯
                if(selfCloseTagReg.test(tagName)){

                // 回溯到该子结点的级别
                }else{
                    docTree.backUp();
                }
        }else if(tagType === "mixableTagCloseReg"){
            var start = lastIndex;
            var len = currReg.lastIndex - result[0].length - start;

            var text = htmlStr.substr(start, len);

            node = new domEle.Element();
            node.nodeType = 3;
            node.nodeValue = text || '';

            docTree.push(node);

            if(node.parentNode.tagName === "script"){
              if(node.parentNode.getAttribute('type') && (node.parentNode.getAttribute("type") + '').toLowerCase() !== "text/javascript"){
                }else{
                    try{
                        windowSpace.runCode(text);
                        //vm.runInThisContext(text, "vm");
                    }catch(e){
                    }
                }
            }

            currNode = node;

            docTree.backUp();

            setCurrTag(tagReg);
        }

    }

    /**
     * 渲染树结构方法
     */
    var html = "";
    var renderTree = function(tree){
        var render = function(parent){
            html += "<ul>";
            for(var i = 0; i < parent.childNodes.length; i ++){
                html += "<li>" + parent.childNodes[i].tagName + "|" + parent.childNodes[i].attrs + "</li>";

                if(parent.childNodes[i].childNodes){
                    render(parent.childNodes[i]);
                }
            }

            html += "</ul>";
        };

        render(tree);

        document.body.innerHTML = html;

    };

    //console.log(docTree._tree[0].getElementsByTagName("div"));
    /*

    // 渲染树结构
    renderTree({childNodes: docTree._tree});


    // 将原始dom用浏览器解析进行对比
    var iframe = document.createElement("iframe");
    iframe.onload = function(){
        iframe.contentDocument.getElementsByTagName("html")[0].innerHTML = htmlStr;
    };
    document.body.appendChild(iframe);
    iframe.src = "http://localhost/";

    // 点击可以消除元素
    var uls = document.getElementsByTagName("ul");
    for(var i = 0; i < uls.length; i ++){
        uls[i].onclick = function(e){
            this.style.display = "none";

            e.stopPropagation();

        };
    }
    */
};

// 预处理
var preParse = function(htmlStr){
    //var domEle = windowSpace.domEle;
    //var document = windowSpace.document;

    // 预处理
    // 去掉注释
    // @todo 自封口
    var commentsReg = /<!--[\s\S]*-->/g;

    htmlStr = htmlStr.replace(commentsReg, "");

    // 对转义字符的处理
    var escapeCharReg = /\\(.)/g;

    var escapeCount = 0;
    var escapeCharTable = {
    };


    var codeProcessQueue = [];

    var codeProcessed;

    // 预处理
    /*
    str = str.replace(escapeCharReg, function(result, $1){
        if(escapeCharTable[$1]){
        }else{
            escapeCount ++;

            escapeCharTable[$1] = escapeCount;
        }

        var index = escapeCharTable[$1];

        var escapeChar = "__fire__" + index;

        return escapeChar;
    });
    */

    //var docTree = new Tree();

    //scopeSpace.DOMTREE = docTree;

    //var _idMap = docTree._idMap; 
    //var _allNode = docTree._allNode;

    //var tagReg = /\s*<(\/?)([^>\s]+)([^>]*)>/g;

     var tagReg = /<([^\s\/>]+)|<(\/)([^\s>]+)>|([^<]+)/g;

    var attrReg = />|\/>|([^\s=]+)=(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g;

    var selfCloseTagReg = /br|hr|img|link|meta/;

    // 可能里面允许出现</div这样的东西的tag
    var mixableTagReg = /script|code|pre/;

    var getCloseTagReg = function(tagName){
        var reg = new RegExp("</(" + tagName + ")>", "g");
        reg.type = "mixableTagCloseReg";

        return reg;
    };

    /**
     * 分析元素树
     */
    var result, attrResult, attrsObj;
    var lastIndex = 0, lastTagName = "";
    var text, textNode;

    var currReg = tagReg;

    // 先检查是不是只有纯文本
    /*
    if(! currTagReg.test(htmlStr)){
        if(textReg.test(htmlStr)){
           text = htmlStr;

            if(text){
                textNode = new domEle.Element();
                textNode.nodeType = textNode.TEXT_NODE;
                textNode.nodeValue = text;

                docTree.push(textNode);
            }
        }
    }
    */

    currReg.lastIndex = 0;

    var currNode, attrsObj = {};

    var setCurrTag = function(tag){
        lastIndex = currReg.lastIndex;

        currReg = tag;
        currReg.lastIndex = lastIndex;

    };

    while(result = currReg.exec(htmlStr)){
        var tagType;

        var tagName = result[1] || result[3];
        var node;

        // 如果是tag 判断type
        if(currReg === tagReg){
            if(result[1]){
                tagType = "startTag";
            }else if(result[2] === "/"){
                tagType = "endTag";
            }else{
                tagType = "textTag";
            }
        }else if(currReg === attrReg){
            tagType = "attrs";
        }else if(currReg.type === "mixableTagCloseReg"){
            tagType = "mixableTagCloseReg";
        }

        if(tagType === "startTag"){
            codeProcessed = {
                tagType: "startTag",
                tagName: tagName
            };

            
            currNode = codeProcessed;
            attrsObj = {};

            codeProcessQueue.push(codeProcessed);



            // 开始进入属性分析进程
            setCurrTag(attrReg);


        // 属性分析进程
        }else if(tagType === "attrs"){
            if(result[0] === ">"){
                
                codeProcessed = {
                    tagType: "attrs",
                    match: ">"
                };

                // 开始寻找开始、结束标签
                setCurrTag(tagReg);

                // 属于自封口的是不会继续深入的
                if(selfCloseTagReg.test(currNode.tagName)){
                }else{
                    //docTree.goNext();

                    codeProcessed.goNext = 1;
                }

                // 如果是script等 不在寻找标签
                if(mixableTagReg.test(currNode.tagName)){
                    setCurrTag(getCloseTagReg(currNode.tagName));
                }

                codeProcessQueue.push(codeProcessed);

            // 自封口了
            }else if(result[0] === "/>"){
                // 开始寻找开始、结束标签
                setCurrTag(tagReg);

                codeProcessQueue.push({
                    tagType: "attrs",
                    match: "/>"
                });

            // 这里分析属性
            }else{
                var attrName = (result[1] + '').trim();
                var attrValue = result[2] || result[3] || result[4];

                if(attrName === "class"){
                    attrName = "className";
                }

                codeProcessQueue.push({
                    tagType: "attrs",
                    attrName: attrName,
                    attrValue: attrValue
                });
            }
        }else if(tagType === "textTag"){
            var text = result[4];

            codeProcessQueue.push({
                tagType: "textTag",
                nodeValue: text || ''
            });

            currNode = node;

        }else if(tagType === "endTag"){
                
                codeProcessed = {
                    tagType: "endTag"
                };

                
                // 自封口没有深入 也不会回溯
                if(selfCloseTagReg.test(tagName)){

                // 回溯到该子结点的级别
                }else{
                    //docTree.backUp();

                    codeProcessed.backUp = 1;
                }

                codeProcessQueue.push(codeProcessed);
        }else if(tagType === "mixableTagCloseReg"){
            var start = lastIndex;
            var len = currReg.lastIndex - result[0].length - start;

            var text = htmlStr.substr(start, len);

            codeProcessed = {
                tagType: "textTag",
                checkParentScript: 1,
                nodeValue: text,
                backUp: 1
            };

            currNode = codeProcessed;

            setCurrTag(tagReg);

            codeProcessQueue.push(codeProcessed);
        }
    }

    return codeProcessQueue;

};

var parseDocument = function(htmlStr, window){
    parse(htmlStr, window, window);
};

module.exports = {
    parse: parse,
    parseDocument: parseDocument
};
