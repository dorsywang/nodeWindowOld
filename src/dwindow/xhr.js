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

        var cookie =  "_ga=GA1.2.1426241733.1409758303; pgv_pvi=5497644032; o_cookie=314416946; pgv_pvid=196538310; pt2gguin=o0314416946; uin=o0314416946; skey=@NDx784nZJ; ptisp=; RK=Cenm1l/1Mr; ptcz=f0ba5fb15a4fcee1ae2ce98d03594f4eed911e827c98969c6ac8ca2b439de2a0";


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
