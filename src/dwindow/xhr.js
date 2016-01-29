var isLocalDev = 0;
if(typeof plugin === "undefined"){
    isLocalDev = 1;
}

var http = require("http");
var url = require("url");

if(! isLocalDev){
    var ajax = plugin('alloyteam/api/request');
}else{
    var http = require("http");
}

/*
if(isLocalDev){
    isLocalDev = 0;
    var ajax = require('alloyteam/api/request');
}
*/

module.exports = function(window){
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

            var cookie =  "ts_refer=ui.ptlogin2.qq.com/cgi-bin/login; ts_uid=8164808200; _ga=GA1.2.600442022.1448100654; pgv_pvi=8237273088; RK=Yfnuxl/mcp; pgv_si=s6515339264; pt_clientip=38900a8204ba64b3; pt_serverip=5fdd0af17263785f; pgv_info=ssid=s3404767540; pgv_pvid=3581218800; o_cookie=314416946; ptui_loginuin=314416946; ptisp=ctc; ptcz=e78fa25f6ffc4635bf77e873c12dcb4c7f52a84c8054bb975d59a3ce8825e0b7; pt2gguin=o0314416946; uin=o0314416946; skey=@JwDSM88sB; p_uin=o0314416946; p_skey=IKP-C6GQzjLTf7ieU5-B0WEOqC0DckKDmEiWuP6FUtw_; pt4_token=e4WCVh2OoBwk6mXoEohJZzHSJ3W0v22KtWaSJc0Sx48_";


            var headers = {
                referer: "http://xiaoqu.qq.com/mobile/index.html",
                cookie: cookie
                
            };

            if(this.method.toUpperCase() === "POST"){
                headers['Content-Type'] = "application/x-www-form-urlencoded";
            }

            //console.log("xhr send Data", data);

            var urlR = this.url;

            if(! isLocalDev){
                var request = new ajax({
                    modid : 231297,
                    cmdid : 65536,
                    timeout : 600
                },window.__REQ, window.__RES);

                request.request({
                    url: urlR,
                    headers: headers,
                    method: this.method,
                    body: data,
                    timeout: 600
                }, function(error,response,body){
                    if(! error){
                        _this.responseHeader = response.headers;
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
                    }else{
                        console.log("_________________");
                        console.log('problem with request: ' + error);

                        window.onerror && window.onerror({
                            message: "error request"
                        });
                    }
                });
            }else{

                var req = http.request({
                    host: "localhost",
                    headers: headers,
                    method: this.method,
                    port: "8888",
                    path: urlR,
                    url: urlR
                }, function(res){

                    res.setEncoding('utf8');

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
            }
            
        },

        setRequestHeader:  function(){
        }
    };

        return xhr;
};
