module.exports = {
    get userAgent(){
        if(window.__REQ){
            return (__REQ.headers['user-agent']);
        }

        return "android";
    }
};
