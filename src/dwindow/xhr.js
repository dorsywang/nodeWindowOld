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

    getAllResponseHeaders: function(){
        return this.responseHeader || "";
    },

    send: function(data){
        var _this = this;
        var u = url.parse(this.url);

        var cookie =  "ptui_loginuin=honghu91@hotmail.com; pgv_pvi=2302861312; o_cookie=314416946; pgv_si=s857558016; pgv_info=ssid=s6836340495; pgv_pvid=3111206016; _ga=GA1.2.1928717429.1387360419; pt_clientip=bcd90e11162c86f1; pt_serverip=10e50a8259673ce0; pt2gguin=o0314416946; uin=o0314416946; skey=@GBtrFgdA4; ptisp=ctc; RK=aenu1l/ccr; ptcz=ace605c7a7c21109309760cb5896d1898c9a50685570d214d739272dc7f29b01";


        var headers = {
            cookie: global.node_cookie || cookie,
            referer: "http://xiaoqu.qq.com/mobile/index.html"
            
        };

        if(this.method.toUpperCase() === "POST"){
            headers['Content-Type'] = "application/x-www-form-urlencoded";
        }

        //console.log("xhr send Data", data);

        var urlR = this.url;

        var req = http.request({
            host: "localhost",
            headers: headers,
            method: this.method,
            port: "8888",
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

                try{
                    if((JSON.parse(body)).retcode !== 0){
                        console.log("error request", urlR, data, body);
                    }
                }catch(e){
                }

                _this.onreadystatechange && _this.onreadystatechange.call(_this, {target: _this});

                _this.onload && _this.onload(body);
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
