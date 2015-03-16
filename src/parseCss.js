/**
 * @author dorsywang(314416946@qq.com)
 * A simple dom tree parsor
 * Css树构建 
 */
var url = require("url");
var path = require("path");
var fs = require("fs");

// 只对display做解析
// 其他暂不解决
var displayReg = /[^{]*\s*{([^}]*display\s*:\s*none[^}]*)}\s*/g;

var parse = function(filename){
    var urlpath = url.parse(filename);
    var filepath = path.resolve(__basePath, urlpath.pathname);

    var str = fs.readFileSync(filepath, {encoding: "utf-8"});

    var block;
    var blockResult = [];

    while(block = displayReg.exec(str)){
        blockResult.push(block[0]);
    }

    console.log(blockResult);
};

module.exports = {
    parse: parse
};
