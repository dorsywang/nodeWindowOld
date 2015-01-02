var http = require("http");
var url = require("url");

var xhr = function(){
    
};

xhr.prototype = {
    onload: function(){
    },

    open: function(method, url){
        this.method = method;
        this.url = url;
    },

    getResponseHeader:  function(name){
        return this.responseHeader[name] || "";
    },

    send: function(data){
        var _this = this;
        var u = url.parse(this.url);

        var cookie =  "_ga=GA1.2.1928717429.1387360419; RK=aenukl/0Mr; pgv_pvid=7910403600; o_cookie=314416946; pgv_pvi=159959040; ptui_loginuin=honghu91@hotmail.com; pt2gguin=o0314416946; uin=o0314416946; skey=@hYUs9GpX7; ptisp=ctc; ptcz=d941743d45947fc7677d8d66b3a54da91851b6cf957c95fbef7c8a4992787d00";


        var headers = {
            cookie: cookie,
            referer: "http://xiaoqu.qq.com/mobile/index.html"
            
        };

        if(this.method.toUpperCase() === "POST"){
            headers['Content-Type'] = "application/x-www-form-urlencoded";
        }

        console.log("xhr send Data", data);

        var req = http.request({
            host: "localhost",
            port: 8888,
            headers: headers,
            method: this.method,
            path: this.url
        }, function(res){

            res.setEncoding('utf8');

            /*
            var header = [];
            for(var i in res.headers){
                header.push(i + ":" + res.headers[i]);
            }

            header = header.join("\n") + "\n";
            */

            _this.responseHeader = res.headers;

            var body = "";
            res.on("data", function(chunk){
                body += chunk;
            }).on("end", function(){
                _this.readyState = 4;
                _this.status = 200;
                _this.responseText = body;

                _this.onreadystatechange && _this.onreadystatechange();
            });
        });

        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write(data || '');
        req.end();
        
        
    },

    setRequestHeader:  function(){
    }
};

module.exports = xhr;
