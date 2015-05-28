module.exports = function(window){

    return {
        set hash(value){
        },

        get hash(){
            var req = window.__REQ;

            var originUrl;
            if(req){
                originUrl = req.protocol + "://" + req.hostname + req.url;
            }

            return  (req && req._parsedUrl.hash) || "";
        },

        get search(){
            var req = window.__REQ;

            var originUrl;
            if(req){
                originUrl = req.protocol + "://" + req.hostname + req.url;
            }

            return  (req && req._parsedUrl.search) || "";
        },

        set search(val){
        },

        set href(val){
            window.__RES.writeHead(302, {'Location': val});
            return "";
        },

        get href(){
            var req = window.__REQ;
            if(req){
                var originUrl = req.protocol + "://" + req.hostname + req.url;
            }else{
            }
            return originUrl || '';
        },

        get pathname(){
            return "";
        },

        replace: function(url){
        }
    };
};
