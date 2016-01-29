var fireDragon = require("./../src/fireDragon");

var window = fireDragon.run("E:\\AppServ\\www\\\qunba_trunk\\dist\\detail.html", {
        url: 'http://buluo.qq.com/mobile/detail.html?&_bid=128&_wv=1027&bid=10114&pid=1432677-1453973909&time_redirect=1453975737989&from=pc',
        headers: {
            'user-agent': 'apple ios iphone'
        }
    });
setTimeout(function(){
    console.log(window.document.body.innerHTML.substr(0, 10000));
}, 1000);
