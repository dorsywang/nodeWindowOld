(function(root){
    root['Login'] = {
        say: function(){
            console.log("Login OK");
        }
    };
})(this);

Login.say();

window.Login.tell = function(){console.log("Hello Login");};
