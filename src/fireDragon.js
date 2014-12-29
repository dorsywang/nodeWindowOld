require("./dwindow/dwindow");

module.exports = {
    run: function(path){
        var html = require("fs").readFileSync(path, {encoding: "utf-8"})

        var parsor = require("./parseDom");
        parsor.parseDocument(html);
    }
};
