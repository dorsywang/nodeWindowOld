module.exports = function(){

    return {
        set hash(value){
        },

        get hash(){
            var req = global.__REQ;

            var originUrl;
            if(req){
                originUrl = req.protocol + "://" + req.hostname + req.url;
            }

            return  (req && req._parsedUrl.hash) || "";
        },

        get search(){
            var req = global.__REQ;

            var originUrl;
            if(req){
                originUrl = req.protocol + "://" + req.hostname + req.url;
            }

            return  (req && req._parsedUrl.search) || "";
        },

        set search(val){
        },

        get href(){
            return "";
        },

        set href(url){
            console.log("tring redirect to ", url);
        },

        replace: function(url){
        }
    };
}();
