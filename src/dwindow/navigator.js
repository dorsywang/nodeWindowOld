module.exports = function(windowSpace){
    return {
        get userAgent(){
            if(windowSpace.__REQ){
                return (windowSpace.__REQ.headers['user-agent']);
            }

            return "android";
        }
    };
};
