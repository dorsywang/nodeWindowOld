require("./dwindow/dwindow");

var path = require("path"); 

var parent = module.parent;
var parentPath = path.dirname(parent.filename);

module.exports = {
    run: function(filepath, req, res){

        var filepath = path.resolve(parentPath, filepath);
        var basePath = path.dirname(filepath);

        global.__basePath = basePath;
        global.__RES = res;
        global.__REQ = req;

        var html = require("fs").readFileSync(filepath, {encoding: "utf-8"})

        var parsor = require("./parseDom");
        parsor.parseDocument(html);
    }
};
