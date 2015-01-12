var body = document.body;

body.addEventListener("click", function(e){
    console.log("click event triggered");

    console.log(e);
    //e.preventDefault();
});

var event = document.createEvent('HTMLEvents');
event.initEvent("click", false, true);

body.dispatchEvent(event);
