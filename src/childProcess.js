var fireDragon = require("./../src/fireDragon");
process.on("message", function(m){
    if(m.command === "runFireDragon"){
        m.req.headers = m.req.header;

        if(m.extra){
            for(var i in m.extra.req){
                m.req[i] = m.extra.req[i];
            }
        }

        var startTime = m.startTime;

        try{
            var window = fireDragon.run(m.filepath, m.req, m.res);
            window.__id = m.id;
        }catch(e){
            sendMsg({
                command: "error",
                errorInfo: e.message || 'error occur',
                id: window.__id
            });
        }

        var sendMsg = function(obj){
            var memeroUse = process.memoryUsage();
            if(memeroUse.heapTotal > 1E8){
                obj.info = 'killSelf';
                process.send(obj);

                process.exit();
            }else{
                process.send(obj);
            }
        };

        var windowCompleteFunc = function(){

            //var completeTime = (+ new Date - startTime);
            //console.log("completeTime:", completeTime);

            var script = window.document.createElement("script");
            script.type = "text/javascript";
            script.innerHTML = "try{window.usingFireDragon = 1;window.nodeStartTime = (+ new Date) - " + (+ new Date - startTime) + "}catch(e){}";


            var head = window.document.getElementsByTagName("head")[0];
            head.insertBefore(script, head.childNodes[0]);


            //outPour(
            var html = window.document.getElementsByTagName("html")[0].outerHTML;

            //clearTimeout(h);

            //reportSpeed(completeTime);
            sendMsg({
                command: "complete",
                html: html,
                id: window.__id
            });


            //process.exit();
        };

        window.onerror = function(e){
            sendMsg({
                command: "error",
                errorInfo: e.message || 'error occur',
                id: window.__id
            });
        };

        window.$(window.document.body).on("complete", function(){
            try{
                windowCompleteFunc();
            }catch(e){
                sendMsg({
                    command: "error",
                    errorInfo: e.message || 'error occur',
                    id: window.__id
                });
            }
        });
    }
});

