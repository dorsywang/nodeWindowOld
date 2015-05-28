/*
custom apis:
core,
data.deleteH5Data,
data.getPageLoadStamp,
data.getUserInfo,
data.readH5Data,
data.setClipboard,
data.writeH5Data,
device.getClientInfo,
device.getDeviceInfo,
device.getNetworkType,
media.getPicture,
offline.isCached,
sensor.getLocation,
ui.openUrl,
ui.openView,
ui.pageVisibility,
ui.popBack,
ui.refreshTitle,
ui.setActionButton,
ui.setLoading,
ui.setOnCloseHandler,
ui.setPullDown,
ui.setRightDragToGoBackParams,
ui.setWebViewBehavior,
ui.shareMessage,
ui.shareRichMessage,
ui.showActionSheet,
ui.showDialog,
ui.showProfile,
ui.showTips
*/
/**
 * @namespace core
 * @desc mqqapi内核的方法和属性
 */
;
(function(name, definition, undefined) {

    // 如果`mqq`存在且通用jssdk包未被引入
    if ( this[name] && this[name].jssdk === undefined ) return;

    var mqq = this[name] = this[name] || {};
    // 传入jssdk标识
    // 如果是最新jssdk环境，则仅执行一些兼容
    // 否则全部初始化，具体看构造里面逻辑
    var ret = definition(mqq.jssdk);
    var i;

    // 遍历复制，以免覆盖掉jssdk里共用方法
    for ( i in ret ) {
        if (ret.hasOwnProperty(i)) {
            mqq[i] = ret[i];
        }
    }

    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(mqq);
    } else if (typeof module === 'object') {
        module.exports = mqq;
    }

})('mqq', function(JSSDK, undefined) {
    "use strict";

    var exports = {};

    var ua = navigator.userAgent;

    var firebug = window.MQQfirebug; // 调试插件引用

    var SLICE = Array.prototype.slice;
    var TOSTRING = Object.prototype.toString;
    var REGEXP_IOS_QQ = /(iPad|iPhone|iPod).*? (IPad)?QQ\/([\d\.]+)/;
    var REGEXP_ANDROID_QQ = /\bV1_AND_SQI?_([\d\.]+)(.*? QQ\/([\d\.]+))?/; // 国际版的 QQ 的 ua 是 sqi

    var UUIDSeed = 1; //从1开始, 因为QQ浏览器的注入广告占用了0, 避免冲突

    var aCallbacks = {}; // 调用回调

    var aReports = {}; // API 调用的名字跟回调序号的映射

    var aSupports = {}; // 保存 API 的版本支持信息

    var CODE_API_CALL = -100000; // 定义为 API 调用, 跟 API 的回调区分

    var CODE_API_CALLBACK = -200000; // 定义为 API 调用的返回, 但是不知道确切返回码

    var NEW_PROTOCOL_BACK_LIST = { // 4.7启用了新协议, 但是部分接口不支持, 这里做个黑名单, 目前都是 android 的接口
        'qbizApi': '5.0', // 5.0 会支持新协议
        'pay': '999999', // pay相关的暂时没有修改计划
        'SetPwdJsInterface': '999999', // 设置密码?
        'GCApi': '999999', //游戏中心
        'q_download': '999999', // 下载器
        'qqZoneAppList': '999999', // 
        'qzone_app': '999999', // 
        'qzone_http': '999999', // 
        'qzone_imageCache': '999999', // 
        'RoamMapJsPlugin': '999999' //
    };

    // 不做上报的方法名单
    var NOT_REPORT_METHOD = [
        // popBack
        'popBack',
        'close'
    ];

    // 如果已经注入则开启调试模式
    if ( firebug ) {
        exports.debuging = true;
        ua = firebug.ua || ua;
    } else {
        exports.debuging = false;
    }

    /**
     * @attribute core.iOS
     * @desc 如果在 iOS QQ中，值为 true，否则为 false
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.iOS = REGEXP_IOS_QQ.test(ua);
    /**
     * @attribute core.android
     * @desc 如果在 android QQ中，值为 true，否则为 false
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.android = REGEXP_ANDROID_QQ.test(ua);
    if (exports.iOS && exports.android) {

        /*
         * 同时是 iOS 和 android 是不可能的, 但是有些国产神机很恶心,
         * 明明是 android, ua 上还加上个 iPhone 5s...
         * 这里要 fix 掉
         */
        exports.iOS = false;
    }

    /**
     * @attribute core.version
     * @desc mqqapi自身的版本号
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.version = '20150416008';

    /**
     * @attribute core.QQVersion
     * @desc 如果在 手机 QQ中，值为手机QQ的版本号，如：4.6.2，否则为 0
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.QQVersion = '0';

    exports.ERROR_NO_SUCH_METHOD = 'no such method';
    exports.ERROR_PERMISSION_DENIED = 'permission denied';

    if (!exports.android && !exports.iOS) {
        console.log('mqqapi: not android or ios');
    }

    /*
     * 当a<b返回-1, 当a==b返回0, 当a>b返回1,
     * 约定当a或b非法则返回-1
     */
    function compareVersion(a, b) {
        a = String(a).split('.');
        b = String(b).split('.');
        try {
            for (var i = 0, len = Math.max(a.length, b.length); i < len; i++) {
                var l = isFinite(a[i]) && Number(a[i]) || 0,
                    r = isFinite(b[i]) && Number(b[i]) || 0;
                if (l < r) {
                    return -1;
                } else if (l > r) {
                    return 1;
                }
            }
        } catch (e) {
            return -1;
        }
        return 0;
    }

    /**
     * @function core.compare
     * @desc 比较版本号，返回比较结果（-1，0，1）。如果当前 QQVersion 小于给定版本，返回 -1，等于返回 0，大于返回 1
     * @param {String} version
     * 
     * @example
     * mqq.QQVersion = "4.7";
     * mqq.compare("10.0");// 返回-1
     * mqq.compare("4.5.1");// 返回1
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    exports.compare = function(ver) {
        return compareVersion(exports.QQVersion, ver);
    };

    if (exports.android) {
        exports.QQVersion = function(m) { // 从 ua 拿版本号
            // 兼容轻聊版
            // 直接比较前后版本，取大的
            return m && (compareVersion(m[1], m[3]) >= 0 ? m[1] : m[3]) || 0;
            // return m && (m[3] || m[1]) || 0;
        }(ua.match(REGEXP_ANDROID_QQ));

        if (!window.JsBridge) { // 兼容 android
            window.JsBridge = {};
        }
        window.JsBridge.callMethod = invokeClientMethod;
        window.JsBridge.callback = execGlobalCallback;
        window.JsBridge.compareVersion = exports.compare;

    }

    if (exports.iOS) {

        window.iOSQQApi = exports; // 兼容 iOS
        exports.__RETURN_VALUE = undefined; // 用于接收客户端返回值

        exports.QQVersion = function(m) { // 从 ua 拿版本号
            return m && m[3] || 0;
        }(ua.match(REGEXP_IOS_QQ));

        // exports.QQVersion = function(){
        //     return invokeClientMethod('device', 'qqVersion') || 0;
        // }();

    }

    exports.platform = exports.iOS ? 'IPH' : exports.android ? 'AND' : 'OTH';


    var Report = (function() {
        var reportCache = [];

        var sendFrequency = 500;

        var timer = 0;

        var lastTimerTime = 0;

        var APP_ID = 1000218;

        var TYPE_ID = 1000280;

        // 抽样比例
        var sample = 20;

        var mainVersion = String(exports.QQVersion).split('.').slice(0, 3).join('.');

        var releaseVersion = exports.platform + "_MQQ_" + mainVersion;

        var qua = exports.platform + exports.QQVersion + '/' + exports.version;

        function sendReport() {
            var arr = reportCache;
            reportCache = [];
            timer = 0;

            if (!arr.length) {

                // 这次没有要上报的, 就关掉定时器
                return;
            }
            var params = {};

            params.appid = APP_ID; // 手机QQ JS API
            params.typeid = TYPE_ID; // UDP 接口需要
            params.releaseversion = releaseVersion;
            // params.build = location.hostname + location.pathname;
            params.sdkversion = exports.version;
            params.qua = qua;
            params.frequency = sample;

            params.t = Date.now();

            params.key = ['commandid', 'resultcode', 'tmcost'].join(',');

            arr.forEach(function(a, i) {

                params[i + 1 + '_1'] = a[0];
                params[i + 1 + '_2'] = a[1];
                params[i + 1 + '_3'] = a[2];
            });

            params = new String(toQuery(params));

            // api 的上报量太大了, 后台撑不住
            if (exports.compare('4.6') >= 0) {

                // 优先用客户端接口上报
                setTimeout(function() {
                    
                    if(mqq.iOS){
                        mqq.invoke('data', 'pbReport', { 'type': String(10004), 'data': params }, true);
                    }else{
                        mqq.invoke('publicAccount', 'pbReport', String(10004), params, true);
                    }
                }, 0);

            } else {
                var img = new Image();
                img.onload = function() {
                    img = null;
                };
                img.src = 'http://wspeed.qq.com/w.cgi?' + params;
            }

            timer = setTimeout(sendReport, sendFrequency);
        }

        function send(api, retCode, costTime) {

            // API调用进行抽样上报, 返回则不抽样
            if(retCode === CODE_API_CALL){

                retCode = 0; // API 调用的状态码用回 0
                var mod = Math.round(Math.random() * sample) % sample;
                if(mod !== 1){
                    return;
                }
            }

            reportCache.push([api, retCode || 0, costTime || 0]);

            // if(Date.now() - lastTimerTime < sendFrequency){

            //     // 连续的 sendFrequency 时间内的上报都合并掉
            //     clearTimeout(timer);
            //     timer = 0;
            // }
            if (!timer) {
                lastTimerTime = Date.now();
                timer = setTimeout(sendReport, sendFrequency);
            }

        }

        return {
            send: send
        };

    })();


    /*var Console = (function() {

        function debug() {
            if (!exports.debuging) {
                return;
            }
            var argus = SLICE.call(arguments);
            var result = [];
            argus.forEach(function(a) {
                if (typeof a === 'object') {
                    a = JSON.stringify(a);
                }
                result.push(a);
            });
            alert(result.join('\n'));
        }

        return {
            debug: debug
        };
    })();*/
    
    // 调用mqqapi.debug.js 的log实现调试;
    /*var log = function () {

        if ( $firebug ) {
            var mqqEvent = document.createEvent('Event');
            mqqEvent.initEvent('mqq2chrome', true, true);
        }

        return function (params) {
            // 开启了调试模式 且 非上报模块的日志
            if ( exports.debuging && params.method !== 'pbReport' ) {
                // 存在firebug插件则使用firebug插件输出日志
                if ( mqq.firebug && mqq.firebug.log ) {
                    try {
                        mqq.firebug.log(params);
                    } catch (e) {}
                // 不存在firebug插件则通过chrome插件输出日志
                } else if ( $firebug ) {
                    $firebug.value = JSON.stringify(params);
                    $firebug.dispatchEvent(mqqEvent);
                }
            }
        }
    }();*/
    function log (params) {
        var firebug = window.MQQfirebug;
        if ( exports.debuging && firebug && firebug.log && params.method !== 'pbReport' ) {
            try {
                firebug.log(params);
            } catch (e) {}
        }
    }

    /*
     * 上报 API 调用和把 API 的回调跟 API 名字关联起来, 用于上报返回码和返回时间
     */
    function reportAPI(schema, ns, method, argus, sn) {

        if (!schema || !ns || !method) {

            // 非正常的 API 调用就不上报了
            return;
        }

        var uri = schema + '://' + ns + '/' + method;
        var a, i, l, m;

        argus = argus || [];

        if (!sn || !(aCallbacks[sn] || window[sn])) {

            // 尝试从参数中找到回调参数名作为 sn
            sn = null;
            for (i = 0, l = argus.length; i < l; i++) {
                a = argus[i];
                if (typeof a === 'object' && a !== null) {

                    a = a.callbackName || a.callback;
                }
                if (a && (aCallbacks[a] || window[a])) {
                    sn = a;
                    break;
                }
            }
        }

        if (sn) { // 记录 sn 和 uri 的对应关系
            // 新增na, method，用于debug模式输出
            aReports[sn] = {
                ns: ns,
                method: method,
                uri: uri,
                startTime: Date.now()
            };
            m = String(sn).match(/__MQQ_CALLBACK_(\d+)/);
            if (m) { //  兼容直接使用 createCallbackName 生成回调的情况
                aReports[m[1]] = aReports[sn];
            }
        }
        // Console.debug('sn: ' + sn, aReports);
        // 发上报请求
        Report.send(uri, CODE_API_CALL);
    }

    /*
     * 创建名字空间
     * @param  {String} name
     */
    function createNamespace(name) {
        var arr = name.split('.');
        var space = window;
        arr.forEach(function(a) {
            !space[a] && (space[a] = {});
            space = space[a];
        });
        return space;
    }

    /**
     * @function core.callback
     * @desc 用于生成回调名字，跟着 invoke 的参数传给客户端，客户端执行回调时，根据该回调名字找到相应的回调处理函数并执行
     * @param {Function} handler 接口的回调处理函数
     * @param {Boolean} [deleteOnExec] 若为 true 则执行完该回调之后删除之，用于防止同一个回调被多次执行（某些情况下有用）
     * @param {Boolean} [execOnNewThread] 若为 true 则在另一个线程执行回调，iOS 中，以下两种场景须指定该参数为 true
     * 
     * @important 如果在 UI 相关接口的回调中调用 alert 等 UI 接口，会导致 WebView 假死，只能关进程处理
     * @important 如果在接口 A 的回调中继续调用接口 B，接口 B 的调用可能会无效亦或者返回结果不正确
     *
     * @example
     * var callbackName = mqq.callback(function(type, index){
     *     console.log("type: " + type + ", index: " + index);
     * });
     * //弹出 ActionSheet 
     * mqq.invoke("ui", "showActionSheet", {
     *     "title" : "title",
     *     "items" : ["item1", "item2"],
     *     "cancel" : "cancel",
     *     "close" : "close",
     *     "onclick": callbackName
     * }
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    function createCallbackName(callback, deleteOnExec, execOnNewThread) {

        callback = (typeof callback === "function") ? callback : window[callback];
        if (!callback) {
            return;
        }

        var sn = storeCallback(callback);

        var name = '__MQQ_CALLBACK_' + sn;

        window[name] = function() {

            var argus = SLICE.call(arguments);

            fireCallback(sn, argus, deleteOnExec, execOnNewThread);

        };
        return name;
    }

    function storeCallback(callback) {
        var sn = UUIDSeed++;
        if (callback) {
            aCallbacks[sn] = callback;
        }
        return sn;
    }

    /*
     * 所有回调的最终被执行的入口函数
     */
    function fireCallback(sn, argus, deleteOnExec, execOnNewThread) {
        // alert(JSON.stringify(argus))
        var callback = typeof sn === 'function' ? sn : (aCallbacks[sn] || window[sn]);
        var endTime = Date.now();
        argus = argus || [];
        // Console.debug('fireCallback, sn: ' + sn);
        if (typeof callback === 'function') {
            if (execOnNewThread) {
                setTimeout(function() {

                    callback.apply(null, argus);
                }, 0);
            } else {
                callback.apply(null, argus);
            }
        } else {

            console.log('mqqapi: not found such callback: ' + sn);
        }
        if (deleteOnExec) {
            delete aCallbacks[sn];
            delete window['__MQQ_CALLBACK_' + sn];
        }

        // Console.debug('sn: ' + sn + ', aReports[sn]: ' + aReports[sn])
        // 上报 API 调用返回
        if (aReports[sn]) {
            var obj = aReports[sn];
            delete aReports[sn];

            // 输出结果, 上报数据不输出
            // if ( obj.method !== 'pbReport' ) {
                log({
                    ns: obj.ns,
                    method: obj.method,
                    ret: JSON.stringify(argus),
                    url: obj.uri
                });
            // }

            if (Number(sn)) {
                delete aReports['__MQQ_CALLBACK_' + sn];
            }
            var retCode = CODE_API_CALLBACK;

            // 提取返回结果中的 retCode
            var keys = ['retCode', 'retcode', 'resultCode', 'ret', 'code', 'r'];
            var a, j, n;
            // Console.debug(argus);
            if (argus.length) {
                a = argus[0]; // 只取第一个参数来判断

                if (typeof a === 'object' && a !== null) { // 返回码可能在 object 里
                    for (j = 0, n = keys.length; j < n; j++) {
                        if (keys[j] in a) {
                            retCode = a[keys[j]];
                            break;
                        }
                    }
                } else if (/^-?\d+$/.test(String(a))) { // 第一个参数是个整数, 认为是返回码
                    retCode = a;
                }
            }

            // 发上报请求
            Report.send(obj.uri + '#callback', retCode, endTime - obj.startTime);
        }
    }

    /*
     * android / iOS 5.0 开始, client回调 js, 都通过这个入口函数处理
     */
    function execGlobalCallback(sn /*, data*/ ) {
        // Console.debug('execGlobalCallback: ' + JSON.stringify(arguments));

        var argus = SLICE.call(arguments, 1);

        if (exports.android && argus && argus.length) {

            // 对 android 的回调结果进行兼容
            // android 的旧接口返回会包装个 {r:0,result:123}, 要提取出来
            argus.forEach(function(data, i) {
                if (typeof data === 'object' && ('r' in data) && ('result' in data)) {
                    argus[i] = data.result;
                }
            });
        }

        fireCallback(sn, argus);
    }

    /*
     * 空的api实现, 用于兼容在浏览器调试, 让mqq的调用不报错
     */
    function emptyAPI() {
        // var argus = SLICE.call(arguments);
        // var callback = argus.length && argus[argus.length-1];
        // return (typeof callback === 'function') ? callback(null) : null;
    }

    /*
     * 创建 api 方法, 把指定 api 包装为固定的调用形式
     */
    function buildAPI(name, data) {
        var func = null;
        var index = name.lastIndexOf('.');
        var nsName = name.substring(0, index);
        var methodName = name.substring(index + 1);

        var ns = createNamespace(nsName);
        // 该处增加debug状态判断，允许某些调试行为刻意重写`mqq`方法
        if (ns[methodName] && !exports.debuging) {

            // 多次挂载mqq会导致同一方法多次创建而导致报错终止
            return;
            // 已经有这个API了, 抛出异常
            // throw new Error('[mqqapi]already has ' + name);
        }
        if (data.iOS && exports.iOS) {

            // 这里担心有业务没有判断方法是否存在就调用了, 还是去掉这个吧 az 2014/8/19
            // if (data.support && data.support.iOS) {
            //     if (exports.compare(data.support.iOS) > -1) {
            //         func = data.iOS;
            //     }
            // } else {
            func = data.iOS;
            // }
        } else if (data.android && exports.android) {

            // if (data.support && data.support.android) {
            //     if (exports.compare(data.support.android) > -1) {
            //         func = data.android;
            //     }
            // } else {
            func = data.android;
            // }
        } else if (data.browser) { // 某些 api 可能有浏览器兼容的方式
            func = data.browser;
        }
        ns[methodName] = func || emptyAPI;
        aSupports[name] = data.support;

    }


    /**
     * @function core.support
     * @desc 检查当前手机QQ环境是否支持该接口，返回 true 则表示支持该接口；false 则不支持。
     * @param {String} apiName 接口名字
     * @example
     * mqq.support("mqq.device.getClientInfo"); // return true / false
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    function supportVersion(name) {

        var support = aSupports[name] || aSupports[name.replace('qw.', 'mqq.').replace('qa.', 'mqq.')];
        var env = exports.iOS ? 'iOS' : exports.android ? 'android' : 'browser';

        if (!support || !support[env]) {
            return false;
        }
        // 增加版本区间检查 20140924
        var vers = support[env].split("-");

        if ( vers.length === 1 ) {
            return exports.compare(vers[0]) > -1
        } else {
            return exports.compare(vers[0]) > -1 && exports.compare(vers[1]) < 1
        }

        // return exports.compare(vers[0]) > -1 && (vers.length === 1 || exports.compare(vers[1]) < 1)

    }

    /*
     * 使用 iframe 发起伪协议请求给客户端
     */
    function openURL(url, ns, method, sn) {
        // Console.debug('openURL: ' + url);
        log({
            ns: ns,
            method: method,
            url: url
        });
        var iframe = document.createElement('iframe');
        iframe.style.cssText = 'display:none;width:0px;height:0px;';
        var failCallback = function() {

            /*
                正常情况下是不会回调到这里的, 只有客户端没有捕获这个 url 请求,
                浏览器才会发起 iframe 的加载, 但这个 url 实际上是不存在的, 
                会触发 404 页面的 onload 事件
            */
            execGlobalCallback(sn, {
                r: -201,
                result: 'error'
            });
        };
        if (exports.iOS) {

            /* 
                ios 必须先赋值, 然后 append, 否者连续的 api调用会间隔着失败
                也就是 api1(); api2(); api3(); api4(); 的连续调用, 
                只有 api1 和 api3 会真正调用到客户端
            */
            iframe.onload = failCallback;
            iframe.src = url;
        }
        var container = document.body || document.documentElement;
        container.appendChild(iframe);

        /*
            android 这里必须先添加到页面, 然后再绑定 onload 和设置 src
            1. 先设置 src 再 append 到页面, 会导致在接口回调(callback)中嵌套调用 api会失败, 
                iframe会直接当成普通url来解析
            2. 先设置onload 在 append , 会导致 iframe 先触发一次 about:blank 的 onload 事件

         */
        if (exports.android) { // android 必须先append 然后赋值
            iframe.onload = failCallback;
            iframe.src = url;
        }

        // iOS 可以同步获取返回值, 因为 iframe 的url 被客户端捕获之后, 会挂起 js 进程
        var returnValue = exports.__RETURN_VALUE;
        exports.__RETURN_VALUE = undefined;

        // android 捕获了iframe的url之后, 也是中断 js 进程的, 所以这里可以用个 setTimeout 0 来删除 iframe
        setTimeout(function() {
            iframe.parentNode.removeChild(iframe);
        }, 0);

        return returnValue;
    }

    // 三星特供版, 从 4.2.1 开始有, 4.2.1 已经去掉了注入到全局对象的方法
    exports.__androidForSamsung = /_NZ\b/.test(ua);

    // android 的 jsbridge 协议开始支持的版本 4.5, 三星特供版也可以用 jsbridge 协议
    exports.__supportAndroidJSBridge = exports.android && (exports.compare('4.5') > -1 || exports.__androidForSamsung);

    // android 新 jsbridge 协议
    exports.__supportAndroidNewJSBridge = exports.android && exports.compare('4.7.2') > -1;

    function canUseNewProtocal(ns /*, method*/ ) {
        if (exports.iOS) { // iOS 旧版本的客户端也能很好兼容新协议
            return true;
        }
        if (exports.android && exports.__supportAndroidNewJSBridge) {

            if (NEW_PROTOCOL_BACK_LIST[ns] && exports.compare(NEW_PROTOCOL_BACK_LIST[ns]) < 0) {

                // 部分接口在 4.7.2 还不能使用新协议, 后续版本会修复该问题
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * @function core.invoke
     * @desc mqq 核心方法，用于调用客户端接口。invoke 封装了两个系统（android、ios）的不同，同时对不同版本进行了兼容。
     * @param {String} namespace 命名空间，每个客户端接口都属于一个命名空间，若不清楚，请咨询对应的客户端开发
     * @param {String} method 接口名字
     * @param {Object} [params] API 调用的参数
     * @param {Function} [callback] API 调用的回调
     * @important 因历史版本的客户实现问题，同一个接口在 android 和 iOS 命名空间和方法名都不一致，同时接口实现的也可能有些许差异，因此尽量使用下面封装好的方法，如：mqq.ui.openUrl。直接调用 invoke 的情况只建议在 android 和 iOS 的实现命名空间和方法以及参数格式都完全一致时使用。
     * @example
     * // 调用普通接口
     * // ios, android
     * mqq.invoke("ns", "method");
     *
     * @example
     * // 调用需要传参数的接口
     * mqq.invoke("ns", "method", {foo: 'bar'});
     *
     * @example
     * // 调用需要传参数且有回调结果的接口
     * mqq.invoke("ns", "method", {foo: 'bar'}, function(data){
     *     console.log(data);
     * });
     *
     *
     * @support iOS 4.2
     * @support android 4.2
     * @support for params iOS 4.5
     * @support for params android 4.7
     */
    function invokeClientMethod(ns, method, argus, callback) {
        if (!ns || !method) {
            return null;
        }
        var url, sn; // sn 是回调函数的序列号
        argus = SLICE.call(arguments, 2);
        callback = argus.length && argus[argus.length - 1];

        if (callback && typeof callback === 'function') { // args最后一个参数是function, 说明存着callback
            argus.pop();
        } else if (typeof callback === 'undefined') {

            // callback 是undefined的情况, 可能是 api 定义了callback, 但是用户没传 callback, 这时候要把这个 undefined的参数删掉
            argus.pop();
        } else {
            callback = null;
        }

        // 统一生成回调序列号, callback 为空也会返回 sn 
        sn = storeCallback(callback);

        if (NOT_REPORT_METHOD.indexOf(method) > -1 || method === 'pbReport' && argus[argus.length - 1] === true) {

            argus.pop();

            // 内部的API调用就不要上报了, 否则就死循环了
        } else {
            // 上报 API 调用, openURL 会阻塞 js 线程, 因此要先打点和上报
            reportAPI('jsbridge', ns, method, argus, sn);
        }

        // 如果最后一个参数传了 function, 且 params 里面没有 'callback' 属性的, 把function赋值给params
        // 兼容之后, 任何参数调用都可以直接 mqq.invoke('ns', 'method', params, callback) 了
        // az @ 2015/4/17
        if(callback && argus[0] && TOSTRING.call(argus[0]) === '[object Object]' && !argus[0]['callback']){
            argus[0]['callback'] = sn;
        }

        if (exports.android && !exports.__supportAndroidJSBridge) {

            /* 
                兼容Android QQ 4.5以下版本的客户端API调用方式
                排除掉三星特供版, 他可以用 jsbridge 协议
            */
            if (window[ns] && window[ns][method]) {
                var result = window[ns][method].apply(window[ns], argus);
                if (callback) {

                    fireCallback(sn, [result]);
                } else {
                    return result;
                }
            } else if (callback) {
                fireCallback(sn, [exports.ERROR_NO_SUCH_METHOD]);
            }
        } else if (canUseNewProtocal(ns, method)) {

            /* 
                android 4.7 以上的支持 ios的协议, 但是客户端的旧接口需要迁移, 4.7赶不上, 需要等到 4.7.2
                jsbridge://ns/method?p=test&p2=xxx&p3=yyy#123
            */
            url = 'jsbridge://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method);

            argus.forEach(function(a, i) {
                if (typeof a === 'object') {
                    a = JSON.stringify(a);
                }
                if (i === 0) {
                    url += '?p=';
                } else {
                    url += '&p' + i + '=';
                }
                url += encodeURIComponent(String(a));
            });

            if (method === 'pbReport') {

                /*
                 * pbReport 这个接口不能加回调序号, 这个接口本来就不支持回调
                 * 但是 android 的 jsbridge 即使接口没有回调结果, 也会调用一次 js 表示这次接口调用到达了客户端
                 * 同时, 由于 android 一执行 loadUrl('javascript:xxx') 就会导致软键盘收起
                 * 所以上报的时候经常会引发这个问题, 这里就直接不加回调序号了
                 */
            } else {

                // 加上回调序列号
                url += '#' + sn;
            }

            var r = openURL(url, ns, method);
            if (exports.iOS && r !== undefined && r.result !== undefined) {

                // FIXME 这里可能会导致回调两次, 但是 iOS 4.7.2以前的接口是依靠这里实现异步回调, 因此要验证下
                if (callback) {
                    fireCallback(sn, [r.result], false /*deleteOnExec*/ , true /*execOnNewThread*/ );
                } else {
                    return r.result;
                }
            }

        } else if (exports.android) { // android 4.7 以前的旧协议, 不能使用新协议的 android 会 fallback 到这里

            // jsbridge://ns/method/123/test/xxx/yyy
            url = 'jsbridge://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method) + '/' + sn;

            argus.forEach(function(a) {
                if (typeof a === 'object') {
                    a = JSON.stringify(a);
                }
                url += '/' + encodeURIComponent(String(a));
            });

            openURL(url, ns, method, sn);
        }

        return null;
    }

    /**
     * @function core.invokeSchema
     * @desc 调用手机QQ的原有schema接口，主要用于旧的 schema 接口兼容。
     * @param {String} schema 协议名字
     * @param {String} namespace 命名空间，每个客户端接口都属于一个命名空间，若不清楚，请咨询对应的客户端开发
     * @param {String} method 接口名字
     * @param {Object} [params] API 调用的参数
     * @param {Function} [callback] API 调用的回调
     * @example
     * mqq.invokeSchema("mqqapi", "card", "show_pslcard", { uin: "123456" }, callback);
     *
     * @support iOS 4.2
     * @support android 4.2
     */
    function invokeSchemaMethod(schema, ns, method, params, callback) {
        if (!schema || !ns || !method) {
            return null;
        }

        var argus = SLICE.call(arguments),
            sn;
        if (typeof argus[argus.length - 1] === 'function') {
            callback = argus[argus.length - 1];
            argus.pop();
        } else {
            callback = null;
        }
        if (argus.length === 4) {
            params = argus[argus.length - 1];
        } else {
            params = {};
        }
        if (callback) {
            params['callback_type'] = 'javascript';
            sn = createCallbackName(callback);
            params['callback_name'] = sn;
        }
        params['src_type'] = params['src_type'] || 'web';

        if (!params.version) {
            params.version = 1;
        }
        var url = schema + '://' + encodeURIComponent(ns) + '/' + encodeURIComponent(method) + '?' + toQuery(params);
        openURL(url, ns, method);

        // 上报 API 调用
        reportAPI(schema, ns, method, argus, sn);
    }

    //////////////////////////////////// util /////////////////////////////////////////////////
    function mapQuery(uri) {
        var i,
            key,
            value,
            index = uri.indexOf("?"),
            pieces = uri.substring(index + 1).split("&"),
            params = {};
        for (i = 0; i < pieces.length; i++) {
            index = pieces[i].indexOf("=");
            key = pieces[i].substring(0, index);
            value = pieces[i].substring(index + 1);
            params[key] = decodeURIComponent(value);
        }
        return params;
    }

    function toQuery(obj) {
        var result = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push(encodeURIComponent(String(key)) + "=" + encodeURIComponent(String(obj[key])));
            }
        }
        return result.join("&");
    }

    function removeQuery(url, keys) {
        var a = document.createElement('a');
        a.href = url;
        var obj;
        if (a.search) {
            obj = mapQuery(String(a.search).substring(1));
            keys.forEach(function(k) {
                delete obj[k];
            });
            a.search = '?' + toQuery(obj);
        }
        if (a.hash) {
            obj = mapQuery(String(a.hash).substring(1));
            keys.forEach(function(k) {
                delete obj[k];
            });
            a.hash = '#' + toQuery(obj);
        }
        url = a.href;
        a = null;

        return url;
    }

    //////////////////////////////////// end util /////////////////////////////////////////////////


    //////////////////////////////////// event /////////////////////////////////////////////////

    /**
     * @function core.addEventListener
     * @desc 监听客户端事件，该事件可能来自客户端业务逻辑，也可能是其他 WebView 使用 dispatchEvent 抛出的事件
     * @param {String} eventName 事件名字
     * @param {Function} handler 事件的回调处理函数
     * @param {Object} handler.data 该事件传递的数据
     * @param {Object} handler.source 事件来源
     * @param {string} handler.source.url 抛出该事件的页面地址
     * @example
     * mqq.addEventListener("hiEvent", function(data, source){
     *     console.log("someone says hi", data, source);
     * })
     *
     * @support iOS 5.0
     * @support android 5.0
     */
    // inherit from core_v2
    function addEventListener(eventName, handler) {

        if (eventName === 'qbrowserVisibilityChange') {

            // 兼容旧的客户端事件
            document.addEventListener(eventName, handler, false);
            return true;
        }
        var evtKey = 'evt-' + eventName;
        (aCallbacks[evtKey] = aCallbacks[evtKey] || []).push(handler);
        return true;
    }

    /**
     * @function core.removeEventListener
     * @desc 移除客户端事件的监听器
     * @param {String} eventName 事件名字
     * @param {Function} [handler] 事件的回调处理函数，不指定 handler 则删除所有该事件的监听器
     *
     * @support iOS 5.0
     * @support android 5.0
     */
    // inherit from core_v2
    function removeEventListener(eventName, handler) {
        var evtKey = 'evt-' + eventName;
        var handlers = aCallbacks[evtKey];
        var flag = false;
        if (!handlers) {
            return false;
        }
        if (!handler) {
            delete aCallbacks[evtKey];
            return true;
        }

        for (var i = handlers.length - 1; i >= 0; i--) {
            if (handler === handlers[i]) {
                handlers.splice(i, 1);
                flag = true;
            }
        }

        return flag;
    }

    // 这个方法时客户端回调页面使用的, 当客户端要触发事件给页面时, 会调用这个方法
    function execEventCallback(eventName /*, data, source*/ ) {
        var evtKey = 'evt-' + eventName;
        var handlers = aCallbacks[evtKey];
        var argus = SLICE.call(arguments, 1);
        if (handlers) {
            handlers.forEach(function(handler) {
                fireCallback(handler, argus, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
            });
        }
    }
    /**
     * @function core.dispatchEvent
     * @desc 抛出一个事件给客户端或者其他 WebView，可以用于 WebView 间通信，或者通知客户端对特殊事件做处理（客户端需要做相应开发）
     * @param {String} eventName 事件名字
     * @param {Object} data 事件传递参数
     * @param {Object} options 事件参数
     * @param {Boolean} options.echo 当前webview是否能收到这个事件，默认为true
     * @param {Boolean} options.broadcast 是否广播模式给其他webview，默认为true
     * @param {Array|String} options.domains 指定能接收到事件的域名，默认只有同域的webview能接收，支持通配符，比如"*.qq.com"匹配所有qq.com和其子域、"*"匹配所有域名。注意当前webview是否能接收到事件只通过echo来控制，这个domains限制的是非当前webview。
     * @example
     * //1. WebView 1(www.qq.com) 监听 hello 事件
     * mqq.addEventListener("hello", function(data, source){
     *    console.log("someone says hi to WebView 1", data, source)
     * });
     * //2. WebView 2(www.tencent.com) 监听 hello 事件
     * mqq.addEventListener("hello", function(data, source){
     *    console.log("someone says hi to WebView 2", data, source)
     * });
     * //3. WebView 2 抛出 hello 事件
     * //不传配置参数，默认只派发给跟当前 WebView 相同域名的页面, 也就是只有 WebView 2能接收到该事件（WebView 1 接收不到事件，因为这两个 WebView 的域名不同域）
     * mqq.dispatchEvent("hello", {name: "abc", gender: 1});
     * 
     * //echo 为 false, 即使 WebView 2 的域名在 domains 里也不会收到事件通知, 该调用的结果是 WebView 1 将接收到该事件
     * mqq.dispatchEvent("hello", {name:"alloy", gender:1}, {
     *     //不把事件抛给自己
     *     echo: false,
     *     //广播事件给其他 WebView
     *     broadcast: true,
     *     //必须是这些域名的 WebView 才能收到事件
     *     domains: ["*.qq.com", "*.tencent.com"]
     * });
     * 
     * //echo 和 broadcast 都为 false, 此时不会有 WebView 会接收到事件通知, 但是客户端仍会收到事件, 仍然可以对该事件做处理, 具体逻辑可以每个业务自己处理
     * mqq.dispatchEvent("hello", {name:"alloy", gender:1}, {
     *     echo: false,
     *     broadcast: false,
     *     domains: []
     * });
     *
     * @support iOS 5.0
     * @support android 5.0
     */
    function dispatchEvent(eventName, data, options) {

        var params = {
            event: eventName,
            data: data || {},
            options: options || {}
        };

        if (exports.android && params.options.broadcast === false && exports.compare('5.2') <= 0) {
            // 对 android 的 broadcast 事件进行容错, broadcast 为 false 时, 
            // 没有 Webview会接收到该事件, 但客户端依然要能接收
            // 5.2 已经修复该问题
            params.options.domains = ['localhost'];
            params.options.broadcast = true;
        }

        var url = 'jsbridge://event/dispatchEvent?p=' + encodeURIComponent(JSON.stringify(params) || '');
        openURL(url, 'event', 'dispatchEvent');

        reportAPI('jsbridge', 'event', 'dispatchEvent');
    }

    /**
     * @event qbrowserTitleBarClick
     * @desc 点击标题栏事件，监听后点击手机QQ标题栏就会收到通知，可以用来实现点击标题滚动到顶部的功能
     * @param {Function} callback 事件回调
     * @param {Object} callback.data 事件参数
     * @param {Object} callback.data.x 点击位置的屏幕x坐标
     * @param {Object} callback.data.y 点击位置的屏幕y坐标
     * @param {Object} callback.source 事件来源
     * @example
     * mqq.addEventListener("qbrowserTitleBarClick", function(data, source){
     *     console.log("Receive event: qbrowserTitleBarClick, data: " + JSON.stringify(data) + ", source: " + JSON.stringify(source));
     * });
     *
     * @support iOS 5.2
     * @support android 5.2
     */

    /**
     * @event qbrowserOptionsButtonClick
     * @desc Android 的物理菜单键的点击事件，点击后会收到通知
     * @param {Function} callback 事件回调
     * @param {Object} callback.data 事件参数
     * @param {Object} callback.source 事件来源
     * @example
     * mqq.addEventListener("qbrowserOptionsButtonClick", function(data, source){
     *     console.log("Receive event: qbrowserOptionsButtonClick, data: " + JSON.stringify(data) + ", source: " + JSON.stringify(source));
     * });
     *
     * @support iOS not support
     * @support android 5.2
     */

    /**
     * @event qbrowserPullDown
     * @desc 页面下拉刷新时候会抛出该事件，主要用于与setPullDown交互，具体可参考setPullDown
     * @example
     * mqq.addEventListener("qbrowserPullDown", function () {                      
     *     // ... Your Code ...                      
     * });
     * @note 该事件可配合下拉刷新做交互，具体可参考`setPullDown`
     *
     * @support iOS 5.3
     * @support android 5.3
     */

    /**
     * @event qbrowserVisibilityChange
     * @desc 当webview可见性发生改变时将会抛出该事件
     * @example
     * mqq.addEventListener("qbrowserVisibilityChange", function(e){
     *     console.log(e.hidden);
     * });
     *
     * @support iOS 4.7
     * @support android 4.7
     */


    //////////////////////////////////// end event /////////////////////////////////////////////////

    // support js sdk
    if ( !JSSDK ) {
        exports.invoke = invokeClientMethod;

        // event
        exports.addEventListener = addEventListener;
        exports.removeEventListener = removeEventListener;
        exports.execEventCallback = execEventCallback;
        exports.dispatchEvent = dispatchEvent;
    }

    // for debug
    exports.__aCallbacks = aCallbacks;
    exports.__aReports = aReports;
    exports.__aSupports = aSupports;

    // for internal use
    exports.__fireCallback = fireCallback;
    exports.__reportAPI = reportAPI;

    exports.build = buildAPI;
    exports.support = supportVersion;

    // JSSDK || (exports.invoke = invokeClientMethod);
    exports.execGlobalCallback = execGlobalCallback;
    exports.invokeSchema = invokeSchemaMethod;
    
    // exports.execGlobalCallback = execGlobalCallback;
    exports.callback = createCallbackName;

    // util
    exports.mapQuery = mapQuery;
    exports.toQuery = toQuery;
    exports.removeQuery = removeQuery;

    // event
    // exports.addEventListener = addEventListener;
    // exports.removeEventListener = removeEventListener;

    // exports.execEventCallback = execEventCallback;
    // exports.dispatchEvent = dispatchEvent;

    return exports;

});;/**
 * @function data.deleteH5Data
 * @desc 删除本地数据
 *
 * @param {Object} param
 * @param {String} param.callid 用来标示请求id, 返回时把该值传回
 * @param {String} param.host 如果host不为空, 且是该页面的域名的父域名, 则往host写, 如果为空则往页面的域名写, 其他为错误
 * @param {String} param.path 区分业务, 为空则报错
 * @param {String} param.key 数据对应的key, 如果为空则删除整个path
 * @param {Function} callback
 * @param {Object} callback.param
 * @param {Number} callback.param.ret 状态返回码
 * @options for callback.param.ret 0: 操作成功
 * @options for callback.param.ret -2: JSON数据格式有误
 * @options for callback.param.ret -3: 参数不能为空
 * @options for callback.param.ret -5: 没有权限操作该域的数据
 * @options for callback.param.ret -6: path不能为空
 * @options for callback.param.ret -7: key不能为空
 * @options for callback.param.ret -8: data不能为空
 * @options for callback.param.ret -9: 空间不足或不存在SD卡
 * @options for callback.param.ret -11: 读取不到任何数据
 * @options for callback.param.ret -12: 写入数据量过大
 * @param {Object} callback.param.response 返回值，例如{callid:"2"}
 *
 * @support iOS 4.6
 * @support android 4.6
 */

mqq.build('mqq.data.deleteH5Data', {
    iOS: function(params, callback) {

        var callbackName = callback ? mqq.callback(callback) : null;
        mqq.invoke('data', 'deleteWebviewBizData', {
            'callback': callbackName,
            'params': params
        });
    },
    android: function(params, callback) {
        params = JSON.stringify(params || {});
        mqq.invoke('publicAccount', 'deleteH5Data', params,
            mqq.callback(callback, true));
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});;/**
 * @function data.getPageLoadStamp
 * @desc 返回【创建 WebView 】到 【 WebView 开始加载url】间的时间点，因为 WebView 创建之后还要做一堆处理，中间是需要耗时的，这段耗时单纯 Web 无法统计
 *
 * @param {Function} callback
 * @param {Object} result
 * @param {Number} result.ret 返回码，0为成功
 * @param {Number} result.onCreateTime 开始创建 WebView 的时间戳
 * @param {Number} result.startLoadUrlTime 开始加载 url 的时间戳
 * @param {String} result.url WebView 最初加载的 url
 *
 * @support iOS 4.6
 * @support android 4.6
 */

mqq.build('mqq.data.getPageLoadStamp', {
    iOS: function(callback) {

        mqq.invoke('data', 'getPageLoadStamp', {
            callback: mqq.callback(callback)
        });
    },
    android: function(callback) {

        mqq.invoke('publicAccount', 'getPageLoadStamp', mqq.callback(callback));
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});;/**
 * @function data.getUserInfo
 * @desc 获取用户信息，包括：uin，skey，vkey，可以获取到的 skey 是一定有效的。同时，调用该接口后会刷新 cookie，自动更新 skey。
 *
 * @param {Function} callback
 * @param {Object} callback.result
 * @param {String} callback.result.uin 用户UIN
 * @param {String} callback.result.nick 用户昵称
 * @support for callback.result.nick iOS 5.3.2
 * @support for callback.result.nick android 5.3.2
 * @param {String} callback.result.skey
 * @param {String} callback.result.vkey
 * @param {String} callback.result.sid
 *
 * @support iOS 4.7
 * @support android 4.7
 * 
 * @note 必须是在登陆态白名单的页面，调用该接口时 `skey`, `vkey`, `sid` 才有数据返回。关于登陆态，可查阅：http://alloykit.oa.com/mobile/ptlogin.html。传送门：我的页面是否能获取登录态？
 * @important 务必仅在需要刷新登录态的时候才调用，在4.7.x版本频繁调用此接口可能会触发后台限频机制，两次调用之间需要延时1s。
 */
mqq.build('mqq.data.getUserInfo', {
    iOS: function(callback) {

        return mqq.invoke('data', 'userInfo', callback);
    },
    android: function(callback) {
        mqq.invoke('data', 'userInfo', {
            callback: mqq.callback(callback)
        });
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});;/**
 * @function data.readH5Data
 * @desc 读取存到本地的数据
 *
 * @param {Object} param
 * @param {String} param.callid 用来标示请求id, 返回时把该值传回
 * @param {String} param.host 如果host不为空, 且是该页面的域名的父域名, 则往host写, 如果为空则往页面的域名写, 其他为错误
 * @param {String} param.path 区分业务, 为空则报错
 * @param {String} param.key 数据对应的key, 如果为空则删除整个path
 * @param {Function} callback
 * @param {Object} callback.param
 * @param {Number} callback.param.ret 状态返回码
 * @options for callback.param.ret 0: 操作成功
 * @options for callback.param.ret -2: JSON数据格式有误
 * @options for callback.param.ret -3: 参数不能为空
 * @options for callback.param.ret -5: 没有权限操作该域的数据
 * @options for callback.param.ret -6: path不能为空
 * @options for callback.param.ret -7: key不能为空
 * @options for callback.param.ret -8: data不能为空
 * @options for callback.param.ret -9: 空间不足或不存在SD卡
 * @options for callback.param.ret -11: 读取不到任何数据
 * @options for callback.param.ret -12: 写入数据量过大
 * @param {Object} callback.param.response 返回值，例如{"data":"", callid:"2"}
 *
 * @support iOS 4.6
 * @support android 4.6
 */

mqq.build('mqq.data.readH5Data', {
    iOS: function(params, callback) {

        var callbackName = callback ? mqq.callback(callback) : null;
        mqq.invoke('data', 'readWebviewBizData', {
            'callback': callbackName,
            'params': params
        });
    },
    android: function(params, callback) {
        params = JSON.stringify(params || {});
        mqq.invoke('publicAccount', 'readH5Data', params,
            mqq.callback(function(result) {

                if (result && result.response && result.response.data) {
                    var data = result.response.data;
                    data = data.replace(/\\/g, ""); //android读出来的数据有些时候会莫名多一些"/"，真是醉了。。。
                    data = decodeURIComponent(data); // android 存入的数据会 encode 一次, 这里要 decode
                    result.response.data = data;
                }
                callback(result);
            }, true));
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});;/**
 * @function data.setClipboard
 * @desc 复制内容到剪贴板，目前支持纯文本
 *
 * @param {Object} params
 * @param {String} params.text 被复制的内容
 * @param {Function} callback
 * @param {Boolean} callback.result true：复制成功；false：复制失败
 *
 * @support iOS 4.7.2
 * @support android 4.7.2
 */

mqq.build('mqq.data.setClipboard', {
    iOS: function(params, callback) {


        mqq.invoke('data', 'setClipboard', params);
        callback && callback(true);

    },
    android: function(params, callback) {

        if (callback) {
            params.callback = mqq.callback(callback);
        }
        mqq.invoke('data', 'setClipboard', params);
    },
    support: {
        iOS: '4.7.2',
        android: '4.7.2'
    }
});;/**
 * @function data.writeH5Data
 * @desc 写数据到本地
 *
 * @param {Object} param
 * @param {String} param.callid 用来标示请求id, 返回时把该值传回
 * @param {String} param.host 如果host不为空, 且是该页面的域名的父域名, 则往host写, 如果为空则往页面的域名写, 其他为错误
 * @param {String} param.path 区分业务, 为空则报错
 * @param {String} param.key 数据对应的key, 如果为空则删除整个path
 * @param {String} param.data 数据
 * @param {Function} callback
 * @param {Object} callback.param
 * @param {Number} callback.param.ret 状态返回码
 * @options for callback.param.ret 0: 操作成功
 * @options for callback.param.ret -2: JSON数据格式有误
 * @options for callback.param.ret -3: 参数不能为空
 * @options for callback.param.ret -5: 没有权限操作该域的数据
 * @options for callback.param.ret -6: path不能为空
 * @options for callback.param.ret -7: key不能为空
 * @options for callback.param.ret -8: data不能为空
 * @options for callback.param.ret -9: 空间不足或不存在SD卡
 * @options for callback.param.ret -11: 读取不到任何数据
 * @options for callback.param.ret -12: 写入数据量过大
 * @param {Object} callback.param.response 返回值，例如{callid:"2"}
 *
 * @support iOS 4.6
 * @support android 4.6
 */

mqq.build('mqq.data.writeH5Data', {
    iOS: function(params, callback) {

        // var callbackName = callback ? mqq.callback(callback) : null;
        // 新增默认callback, 以免IOS下crash 20140928
        var callbackName = mqq.callback( callback || function(){} );
        // 兼容对象格式数据 20140928
        var data = params.data;
        if ( data && typeof data === "object" ) {
            // 兼容对象格式数据 20140928
            params.data = JSON.stringify(data);
        }
        mqq.invoke('data', 'writeWebviewBizData', {
            'callback': callbackName,
            'params': params
        });
    },
    android: function(params, callback) {
        var data = params.data;
        if (data) {
            // 兼容对象格式数据 20140928
            if ( typeof data === "object" ) data = JSON.stringify(data);
            params.data = encodeURIComponent(data); // android 会对 \ 进行多次转义, 这里要先 encode
        }
        mqq.invoke('publicAccount', 'writeH5Data', params,
            // 新增默认callback, 以免android下写入不成功 20140928
            mqq.callback(callback||function(){}, true));
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});;/**
 * @function device.getClientInfo
 * @desc 获取客户端信息
 *
 * @param {Function} callback 回调
 * @param {Object} callback.param
 * @param {String} callback.param.qqVersion 获取手机QQ版本号，如"4.5.0"
 * @param {String} callback.param.qqBuild 获取手机QQ构建版本号，如"4.5.0.1"，一般不需要使用到这个东东
 *
 * @support iOS 4.5
 * @support android 4.6
 */

/* iOS 接口兼容 */
mqq.build('mqq.device.qqVersion', {
    iOS: function(callback) {

        return mqq.invoke('device', 'qqVersion', callback);
    },
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.qqBuild', {
    iOS: function(callback) {

        return mqq.invoke('device', 'qqBuild', callback);
    },
    support: {
        iOS: '4.5'
    }
});
/*end iOS 接口兼容 */

mqq.build('mqq.device.getClientInfo', {
    iOS: function(callback) {
        var result = {
            'qqVersion': this.qqVersion(),
            'qqBuild': this.qqBuild()
        };
        var callbackName = mqq.callback(callback, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
        mqq.__reportAPI('web', 'device', 'getClientInfo', null, callbackName);
        if (typeof callback === 'function') {
            mqq.__fireCallback(callbackName, [result]);
        } else {
            return result;
        }
    },
    android: function(callback) {
        if (mqq.compare('4.6') >= 0) {
            var oldCallback = callback;
            callback = function(data) {
                try {
                    data = JSON.parse(data);
                } catch (e) {}
                oldCallback && oldCallback(data);
            };
            mqq.invoke('qbizApi', 'getClientInfo', callback);
        } else {
            mqq.__reportAPI('web', 'device', 'getClientInfo');
            callback({
                qqVersion: mqq.QQVersion,
                qqBuild: function(m) {
                    m = m && m[1] || 0;
                    return m && m.slice(m.lastIndexOf('.') + 1) || 0;
                }(navigator.userAgent.match(/\bqq\/([\d\.]+)/i))
            });
        }
    },
    support: {
        iOS: '4.5',
        android: '4.6'
    }
});;/**
 * @function device.getDeviceInfo
 * @desc 获取设备信息
 *
 * @param {Function} callback 回调
 * @param {Object} callback.param
 * @param {String} callback.param.systemName 系统名，如"iPhone OS"
 * @param {String} callback.param.systemVersion 系统版本，如"6.0"
 * @param {String} callback.param.model 机器系列，如"iPhone", "iPod touch"
 * @param {String} callback.param.modelVersion 机型，如"iPhone 6"
 * @param {String} callback.param.identifier 设备唯一标识，Android端获取的是IMEI码，iOS端获取到的是根据IMEI码加密之后，并且每个APP获取到的均不同
 * @support for callback.param.identifier iOS 4.7
 * @support for callback.param.identifier android 4.7
 *
 * @example
 * mqq.device.getDeviceInfo(function(data){
 *     console.log(data);
 * });
 *
 * @support iOS 4.5
 * @support android 4.5
 */

/* iOS 接口兼容 */

mqq.build('mqq.device.systemName', {
    iOS: function(callback) {

        return mqq.invoke('device', 'systemName', callback);
    },
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.systemVersion', {
    iOS: function(callback) {

        return mqq.invoke('device', 'systemVersion', callback);
    },
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.model', {
    iOS: function(callback) {

        return mqq.invoke('device', 'model', callback);
    },
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.modelVersion', {
    iOS: function(callback) {

        return mqq.invoke('device', 'modelVersion', callback);
    },
    support: {
        iOS: '4.5'
    }
});

/* end iOS 接口兼容 */

mqq.build('mqq.device.getDeviceInfo', {

    iOS: function(callback) {

        if (mqq.compare(4.7) >= 0) {
            //4.7把下面這些調用都整合到一個接口上，並提供了一個新的字段identifier來唯一標識設備
            return mqq.invoke('device', 'getDeviceInfo', callback);
        } else {
            var callbackName = mqq.callback(callback, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
            mqq.__reportAPI('web', 'device', 'getClientInfo', null, callbackName);

            var result = {
                'isMobileQQ': this.isMobileQQ(),
                'systemName': this.systemName(),
                'systemVersion': this.systemVersion(),
                'model': this.model(),
                'modelVersion': this.modelVersion()
            };

            if (typeof callback === 'function') {
                mqq.__fireCallback(callbackName, [result]);
            } else {
                return result;
            }
        }
    },
    android: function(callback) {
        if (mqq.compare('4.6') >= 0) {
            var oldCallback = callback;
            callback = function(data) {
                try {
                    data = JSON.parse(data);
                } catch (e) {}
                oldCallback && oldCallback(data);
            };
            mqq.invoke('qbizApi', 'getDeviceInfo', callback);
        } else {
            var ua = navigator.userAgent;
            mqq.__reportAPI('web', 'device', 'getClientInfo');
            callback({
                isMobileQQ: true,
                systemName: 'android',
                systemVersion: function(m) {
                    return m && m[1] || 0;
                }(ua.match(/\bAndroid ([\d\.]+)/i)),
                model: function(m) {
                    return m && m[1] || null;
                }(ua.match(/;\s([^;]+)\s\bBuild\/\w+/i))
            });
        }
    },
    support: {
        iOS: '4.5',
        android: '4.5'
    }
});;/**
 * @function device.getNetworkType
 * @desc 获取设备信息
 *
 * @param {Function} callback 回调
 * @param {Number} callback.result 结果
 * @options for callback.result -1: Unknown 未知类型网络
 * @options for callback.result 0: NotReachable
 * @options for callback.result 1: ReachableViaWiFi
 * @options for callback.result 2: ReachableVia2G
 * @options for callback.result 3: ReachableVia3G
 * @options for callback.result 4. 4G  
 *
 * @example
 * mqq.device.getNetworkType(function(result){
 *     alert(result);
 * });
 *
 * @support iOS 4.5
 * @support android 4.6
 */

mqq.build('mqq.device.getNetworkType', {
    iOS: function(callback) {
        var result = mqq.invoke('device', 'networkStatus');
        result = Number(result); // 4.7.1 返回的是字符串数字...
        if (typeof callback === 'function') {
            mqq.__fireCallback(callback, [result], false /*deleteOnExec*/ , true /*execOnNewThread*/ );
        } else {
            return result;
        }
    },
    android: function(callback) {
        if (mqq.compare('4.6') >= 0) {
            mqq.invoke('qbizApi', 'getNetworkType', callback);
        } else {
            mqq.invoke('publicAccount', 'getNetworkState', function(state) {
                // 0: mobile, 1: wifi, 2...: other
                var map = {
                    '-1': 0,
                    '0': 3,
                    '1': 1
                };
                var newState = (state in map) ? map[state] : 4;
                callback(newState);
            });
        }
    },
    support: {
        iOS: '4.5',
        android: '4.6'
    }
});

/* iOS 的接口兼容 */
mqq.build('mqq.device.networkStatus', {
    iOS: mqq.device.getNetworkType,
    support: {
        iOS: '4.5'
    }
});

mqq.build('mqq.device.networkType', {
    iOS: mqq.device.getNetworkType,
    support: {
        iOS: '4.5'
    }
});
/* end iOS 的接口兼容 */;/**
 * @function media.getPicture
 * @desc 从相册选择图片或者调用摄像头拍照，以base64返回数据
 *
 * @param {Object} param
 * @param {Number} param.source 控制来源的，0：相册；1：拍照
 * @param {Boolean} param.front 是否使用前置摄像头
 * @param {Number} param.max 最大张数限制
 * @param {Number} param.outMaxWidth 限制输出的图片的最大宽度，超过将会压缩到指定值
 * @param {Number} param.outMaxHeight 限制输出的图片的最大高度，超过将会压缩到指定值
 * @param {Number} param.inMinWidth 限制输入的图片(展示给用户选择的)的最小宽度
 * @param {Number} param.inMinHeight 限制输入的图片(展示给用户选择的)的最小高度
 * @param {Boolean} param.urlOnly 为 true 则只返回 imageID，不返回 data 和 match，此时 outMaxHeight/outMaxWidth/inMinHeight/inMinWidth 无效。之后可以使用 getLocalImage 接口自行加载对应的图片内容
 * @support for param.urlOnly iOS 4.7
 * @support for param.urlOnly android 4.7
 *
 * @param {Function} callback
 * @param {Number} callback.ret 0：成功；3：内存不足
 * @param {Array|Object} callback.images
 * @param {String} callback.images.data 所选图片的base64数据
 * @param {String} callback.images.imageID 所选图片的在手机QQ本地对应的路径
 * @param {Number} callback.images.match 所选图片是否符合最大最小尺寸要求等。0：符合要求；1：图片尺寸太小；2：读取、解码失败
 *
 * @support iOS 4.7
 * @support android 4.7
 * @note iOS 4.7.2 以前的接口裁压缩现有Bug，如果图片宽高超过 outMaxWidth / outMaxHeight，将会被裁剪，4.7.2已修复为压缩
 * @change v4.7: 修改参数名，增加图片最小宽高的限制
 * @change v4.7.2: 增加 urlOnly 参数
 */

mqq.build('mqq.media.getPicture', {
    iOS: function(params, callback) {
        // 对 4.6的参数名进行兼容
        if (!params.outMaxWidth && params.maxWidth) {
            params.outMaxWidth = params.maxWidth;
            delete params.maxWidth;
        }
        if (!params.outMaxHeight && params.maxHeight) {
            params.outMaxHeight = params.maxHeight;
            delete params.maxHeight;
        }

        params.callback = mqq.callback(function(code, data){
            // 修复 ios 的选取拍照图片时, 返回的数组元素是个base64字符串的问题
            if(data && data.forEach){
                data.forEach(function(item, i){
                    if(typeof item === 'string'){
                        data[i] = {
                            data: item,
                            imageID: '',
                            match: 0
                        }
                    }
                });
            }
            callback && callback(code, data);
        }, true /*deleteOnExec*/ , true /*execOnNewThread*/ );
        mqq.invoke('media', 'getPicture', params);
    },
    android: function(params, callback) {
        params.callback = mqq.callback(callback);
        mqq.invoke('media', 'getPicture', params);
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});;/**
 * @function offline.isCached
 * @desc 查询本地是否有指定业务的离线包
 *
 * @param {Object} param
 * @param {Number} param.bid
 * @param {Function} callback
 * @param {Number} callback.localVersion 本地离线包版本号；-1: 无离线包
 *
 * @example
 * mqq.offline.isCached({bid: 123456}, function(localVersion){
 *     if(localVersion === -1){
 *         alert("no local offline data!");
 *     }
 * });
 *
 * @support iOS 4.6
 * @support android 4.6
 */

mqq.build('mqq.offline.isCached', {
    iOS: function(params, callback) {
        var callbackName = mqq.callback(callback);
        if (callbackName) {
            params.callback = callbackName;
            mqq.invoke('offline', 'isCached', params);
        }
    },
    android: function(params, callback) {

        mqq.invoke('qbizApi', 'isCached', params.bid, mqq.callback(callback));
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});;/**
 * @namespace sensor
 * @desc 传感器相关接口
 */

/**
 * @function sensor.getLocation
 * @desc 获取经纬度座标
 *
 * @param {Object} [options] 配置参数
 * @param {Number} options.allowCacheTime 读取多少时间内的缓存定位数据，以秒为单位
 * @support for options iOS 5.5
 * @support for options android 5.5
 * @param {Function} callback 回调函数
 * @param {Number} callback.ret 0:成功; -1: 失败
 * @param {Number} callback.latitude
 * @param {Number} callback.longitude
 * @param {Object} callback.status
 * @param {Boolean} callback.status.enabled 是否已开启传感器
 * @param {Boolean} callback.status.authroized 是否已授权
 * @support for callback.status iOS 4.7
 * @support for callback.status android not support
 *
 * @example
 * // 读取60s内的缓存数据
 * mqq.sensor.getLocation({allowCacheTime:60}, function(retCode, latitude, longitude){
 *     alert("retCode: " + retCode + " " + latitude + ", " + longitude);
 * });
 *
 * @example
 * // 重新定位
 * mqq.sensor.getLocation(function(retCode, latitude, longitude){
 *     alert("retCode: " + retCode + " " + latitude + ", " + longitude);
 * });
 *
 * @support iOS 4.5
 * @support android 4.6
 */

mqq.build('mqq.sensor.getLocation', {
    iOS: function(options) {

        var cb = arguments[arguments.length-1];
        var opts = typeof options === 'object' ? options : {};

        if ( typeof cb === 'function' ) {
            opts.callback = mqq.callback(cb)
        }

        return mqq.invoke('data', 'queryCurrentLocation', opts);
    },
    android: function(options) {
        var cb = arguments[arguments.length-1];
        var opts = typeof options === 'object' ? options : {};
        var callbackName = mqq.callback(function(result) {
            var retCode = -1,
                longitude = null,
                latitude = null;
            if (result && result !== 'null') {
                result = (result + '').split(',');
                if (result.length === 2) {
                    retCode = 0; // 获取的是经纬度

                    longitude = parseFloat(result[0] || 0);
                    latitude = parseFloat(result[1] || 0);
                }
            }
            cb(retCode, latitude, longitude);
        }, true);

        if ( typeof cb === 'function' ) {
            opts.callback = callbackName
        }

        mqq.invoke('publicAccount', 'getLocation', mqq.compare('5.5') > -1 ? opts : callbackName);
    },
    browser: function() {
        var cb = arguments[arguments.length-1];
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {

                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;

                cb(0, latitude, longitude);
            }, function( /*error*/ ) {
                // switch (error.code) { 
                // case 0: 
                //     alert(“尝试获取您的位置信息时发生错误：” + error.message); 
                //     break; 
                // case 1: 
                //     alert(“用户拒绝了获取位置信息请求。”); 
                //     break; 
                // case 2: 
                //     alert(“浏览器无法获取您的位置信息。”); 
                //     break; 
                // case 3: 
                //     alert(“获取您位置信息超时。”); 
                //     break; 
                // } 
                cb(-1);
            });
        } else {
            cb(-1);
        }
    },
    support: {
        iOS: '4.5',
        android: '4.6',
        browser: '0'
    }
});;/**
 * @function ui.openUrl
 * @desc 打开指定url
 *
 * @param {Object} param
 *
 * @param {String} param.url
 * @param {Number} param.target
 * @options for param.target 0: 在当前webview打开
 * @options for param.target 1: 在新webview打开
 * @options for param.target 2: 在外部浏览器上打开（iOS为Safari,Android为系统默认浏览器）
 * @default for param.target 0: 在当前webview打开
 *
 * @param {Number} param.style WebView的样式（只对target=1有效），可选值如下：
 * @options for param.style 0: 顶部标题栏模式（无底部工具栏）
 * @options for param.style 1: 顶部标题栏无分享入口（无底部工具栏）
 * @options for param.style 2: 底部工具栏模式（顶部标题依然会存在）
 * @options for param.style 3: 底部工具栏模式且顶部无分享入口（顶部标题依然会存在）
 * @default for param.style 0: 顶部标题栏模式（无底部工具栏）
 *
 * @param {Number} param.animation  ( v4.7 ) webview展示动画，（该参数仅对Android有效）可选值如下：
 * @options for param.animation 0: 从右往左
 * @options for param.animation 1: 直接打开
 * @options for param.animation 2: 从下往上
 * @default for param.animation 0: 从右往左
 * @support for param.animation Android 4.7
 *
 * @example
 * //用一个带底部导航栏、无分享按钮的WebView来打开链接
 * mqq.ui.openUrl({
 *     url: "http://news.qq.com",
 *     target: 1,
 *     style: 3
 * });
 *
 * @support iOS 4.5
 * @support android 4.6
 *
 * @changelist v4.7: android 4.7 已经把从 AIO 打开的 WebView 改为非单例，也就是用 openUrl({target: 1}) 能真正打开新的 WebView 了
 */

mqq.build('mqq.ui.openUrl', {
    iOS: function(params) {
        if (!params) {
            params = {};
        }
        switch (params.target) {
            case 0:
                window.open(params.url, '_self');
                break;
            case 1:
                params.styleCode = ({
                    1: 4,
                    2: 2,
                    3: 5
                })[params.style] || 1;
                mqq.invoke('nav', 'openLinkInNewWebView', {
                    'url': params.url,
                    'options': params
                });
                break;
            case 2:
                mqq.invoke('nav', 'openLinkInSafari', {
                    'url': params.url
                });
                break;
        }
    },
    android: function(params) {
        if (params.target === 2) {
            if (mqq.compare('4.6') >= 0) {
                mqq.invoke('publicAccount', 'openInExternalBrowser', params.url);
            } else if (mqq.compare('4.5') >= 0) {
                mqq.invoke('openUrlApi', 'openUrl', params.url);
            } else {
                // location.href = params.url;
            }
        } else if (params.target === 1) {
            if (!params.style) {
                params.style = 0;
            }
            if (mqq.compare('4.7') >= 0) {
                mqq.invoke('ui', 'openUrl', {url: params.url, options: params});
            } else if (mqq.compare('4.6') >= 0) {
                mqq.invoke('qbizApi', 'openLinkInNewWebView', params.url, params.style);
            } else if (mqq.compare('4.5') >= 0) {
                mqq.invoke('publicAccount', 'openUrl', params.url);
            } else {
                location.href = params.url;
            }
        } else {
            location.href = params.url;
        }
    },
    browser: function(params) { // 兼容普通浏览器的调用
        if (params.target === 2) {
            window.open(params.url, '_blank');
        } else {
            location.href = params.url;
        }
    },
    support: {
        iOS: '4.5',
        android: '4.6',
        browser: '0'
    }
});;/**
 * @function ui.openView
 * @desc iOS - 打开指定名字的viewController，Android - 打开指定className的Activity
 *
 * @param {Object} param
 *
 * @param {String} param.name iOS的view 名字如下:
 * @options for param.name "Coupon": 优惠券首页
 * @options for param.name "About": 手机QQ关于界面
 *
 * @param {Object} param.options 传递给客户端的启动参数，值为 key-value 形式
 * @support for param.options iOS 5.0
 * @support for param.options android 5.0
 *
 * @param {Function} param.onclose 当打开的ViewController(iOS)/Activity(Android)关闭后，客户端会执行这个回调，并可带上数据传回给原webview（即下面回调函数里的data）。
 * @support for param.onclose iOS 5.0
 * @support for param.onclose android 5.0
 * @param {Object} param.onclose.data
 *
 * @example
 * mqq.ui.openView({name: "About"});// iOS
 * mqq.ui.openView({name: "com.tencent.mobileqq.activity.AboutActivity"});// android});
 * 
 * mqq.ui.openView({
 *     name: "ViewName", 
 *     options: {"a": "b", "c": 1}, 
 *     onclose: function(data){ console.log(data) }
 * });
 *
 * @support iOS 4.5
 * @support android 4.6
 */

;
(function() {

    var IOS_VIEW_MAP = {

    };

    var AND_VIEW_MAP = {
        'Abount': 'com.tencent.mobileqq.activity.AboutActivity',

        'GroupTribePublish': 'com.tencent.mobileqq.troop.activity.TroopBarPublishActivity',
        'GroupTribeReply': 'com.tencent.mobileqq.troop.activity.TroopBarReplyActivity',
        'GroupTribeComment': 'com.tencent.mobileqq.troop.activity.TroopBarCommentActivity'
    };


    mqq.build('mqq.ui.openView', {
        iOS: function(params) {

            params.name = IOS_VIEW_MAP[params.name] || params.name;
            if (typeof params.onclose === 'function') {
                params.onclose = mqq.callback(params.onclose);
            }
            mqq.invoke('nav', 'openViewController', params);
        },
        android: function(params) {

            params.name = AND_VIEW_MAP[params.name] || params.name;
            if (typeof params.onclose === 'function') {
                params.onclose = mqq.callback(params.onclose);
            }
            if (mqq.compare('5.0') > -1) {
                mqq.invoke('ui', 'openView', params);
            } else {
                mqq.invoke('publicAccount', 'open', params.name);
            }
        },
        support: {
            iOS: '4.5',
            android: '4.6'
        }
    });

})();;/**
 * @function ui.pageVisibility
 * @desc 查询页面的可见性。当当前可见view/activity不是本页面，或应用退到后台时，此接口返回false，否则返回true。
 *
 * @param {Function} callback
 * @param {Boolean} callback.result 页面可见返回 true，不可见返回 false
 *
 * @example
 * mqq.ui.pageVisibility(function(r){
 *     console.log("visible ?", r);
 * });
 * ...
 * document.addEventListener("qbrowserVisibilityChange", function(e){
 *     console.log(e.hidden);
 * });
 *
 * @support iOS 4.7
 * @support android 4.7
 * @note 另外当页面可见性发生改变时，document会抛出qbrowserVisibilityChange事件。
 */

mqq.build('mqq.ui.pageVisibility', {
    iOS: function(callback) {
        mqq.invoke('ui', 'pageVisibility', callback);
    },
    android: function(callback) {
        mqq.invoke('ui', 'pageVisibility', callback);
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});;/**
 * @function ui.popBack
 * @desc 关闭当前webview
 *
 * @example
 * mqq.ui.popBack();
 *
 * @support iOS 4.5
 * @support android 4.6
 */

mqq.build('mqq.ui.popBack', {
    iOS: function() {
        mqq.invoke('nav', 'popBack');
    },
    android: function() {
        mqq.invoke('publicAccount', 'close');
    },
    support: {
        iOS: '4.5',
        android: '4.6'
    }
});;/**
 * @function ui.refreshTitle
 * @desc 刷新客户端显示的网页标题。在iOS中，网页标题动态改变后，显示WebView的导航栏标题不会改变，请调用refreshTitle来手动刷新。Android不需要。
 *
 * @example
 * document.title="新标题";
 * mqq.ui.refreshTitle();
 *
 * @support iOS 4.6
 * @support android not support
 */

mqq.build('mqq.ui.refreshTitle', {
    iOS: function() {
        mqq.invoke('nav', 'refreshTitle');
    },
    support: {
        iOS: '4.6'
    }
});;/**
 * @function ui.setActionButton
 * @desc 配置webview右上角按钮的标题、点击回调等
 *
 * @param {Object} param
 *
 * @param {String} param.title 设置右上角的按钮的文字
 * @param {Boolean} param.hidden 是否隐藏右上角按钮
 * @support for param.hidden iOS 4.7
 * @support for param.hidden android 4.7
 *
 * @param {String} param.iconID 图标的本地资源ID（只支持内置的资源）
 * @options for param.iconID 1: 编辑图标
 * @options for param.iconID 2: 删除图标
 * @options for param.iconID 3: 浏览器默认图标
 * @options for param.iconID 4: 分享图标
 * @options for param.iconID 5: 上传图标（有动画效果）
 * @support for param.iconID iOS 4.7
 * @support for param.iconID android 4.7

 * @param {String} param.cornerID 右上角图标的角标资源ID（只支持内置的资源）
 * @options for param.cornerID 0: 不显示
 * @options for param.cornerID 6: 感叹号图标
 * @support for param.cornerID iOS 5.3
 * @support for param.cornerID android 5.3
 *
 * @param {Function} callback 点击按钮后的回调
 *
 * @support iOS 4.6
 * @support android 4.6
 * @note 如果调用两次 setActionButton，第一次传了 callback 参数，而第二次没有传，在 android 和 iOS 的表现不一致：iOS 中右上角按钮将还原为默认行为，android 则是继续使用上一次传的 callback（v5.1 修复该问题）
 * @important 该接口已停止维护，可使用ui.setTitleButtons代替
 */

mqq.build('mqq.ui.setActionButton', {
    iOS: function(params, callback) {
        if (typeof params !== 'object') {
            params = {
                title: params
            };
        }

        var callbackName = mqq.callback(callback, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
        params.callback = callbackName;
        mqq.invoke('nav', 'setActionButton', params);
    },
    android: function(params, callback) {
        var callbackName = mqq.callback(callback);

        if (params.hidden) {
            params.title = '';
        }

        if (mqq.compare('4.7') >= 0) {
            params.callback = callbackName;
            mqq.invoke('ui', 'setActionButton', params);
        } else {
            mqq.invoke('publicAccount', 'setRightButton', params.title, '', callbackName || null);
        }
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});;/**
 * @function ui.setLoading
 * @desc 配置菊花是否可见和样式。visible参数用于控制菊花是(true)否(false)可见，不传visible参数则不改变菊花的可见性
 *
 * @param {Object} param
 *
 * @param {Boolean} param.visible 控制菊花可见度
 * @param {Array|Number} param.color r, g, b 控制菊花颜色
 *
 * @example
 * mqq.ui.setLoading({visible: false});
 *
 * @support iOS 4.6
 * @support android 4.6
 */

mqq.build('mqq.ui.setLoading', {
    iOS: function(params) {

        if (params) {
            //文档上要求如果visible没有值，不去改变菊花。
            if (params.visible === true) {
                mqq.invoke('nav', 'showLoading');
            } else if (params.visible === false) {
                mqq.invoke('nav', 'hideLoading');
            }

            if (params.color) {
                mqq.invoke('nav', 'setLoadingColor', {
                    'r': params.color[0],
                    'g': params.color[1],
                    'b': params.color[2]
                });
            }
        }
    },
    android: function(params) {
        if ('visible' in params) {
            if (params.visible) {
                mqq.invoke('publicAccount', 'showLoading');
            } else {
                mqq.invoke('publicAccount', 'hideLoading');
            }
        }
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});;/**
 * @function ui.setOnCloseHandler
 * @desc 设置webview被关闭前的回调, 设置回调后将会替换原来的行为
 *
 * @param {Function} callback
 *
 * @support iOS 4.7
 * @support android 4.7
 */

mqq.build('mqq.ui.setOnCloseHandler', {
    iOS: function(callback) {
        mqq.invoke('ui', 'setOnCloseHandler', {
            'callback': mqq.callback(callback, false/*deleteOnExec*/, true/*execOnNewThread*/)
        });
    },
    android: function(callback) {
        mqq.invoke('ui', 'setOnCloseHandler', {
            'callback': mqq.callback(callback)
        });
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});;/**
 * @function ui.setPullDown
 * @desc 启动下拉刷新
 *
 * @param {Object} param
 * @param {Boolean} param.enable 启动标识, true 启动，false 不启动
 * @param {Boolean} param.success 业务方操作成功后，可以设置该参数，收起刷新界面 
 * @param {Boolean} param.text 操作成功后提示文案 
 *
 * @example
 * // 初始化启动下拉刷新的功能                      
 * mqq.ui.setPullDown({ enable: true });                       
 * // 监听`qbrowserPullDown`事件，当用户触发之后，即可开始处理业务方的逻辑                      
 * mqq.addEventListener("qbrowserPullDown", function () {                      
 *     // ... Your Code ...                      
 *     mqq.ui.setPullDown({ success: true , text: "刷新成功" })                      
 * });
 *
 * @support iOS 5.3
 * @support android 5.3
 * @note 下拉刷新的交互逻辑：该接口需要配合`qbrowserPullDown`事件使用，开启下拉刷新功能之后，当用户触发下拉动作时候，webview会抛出`qbrowserPullDown`事件，开发者需要监听该事件来实现自身业务逻辑，最后业务逻辑操作完成后，开发者需调用一次`mqq.ui.setPullDown({ success: true , text: "刷新成功" });`来收起下拉的界面。
 * @important Android端在该接口使用上存在较严重问题，当开启下拉刷新之后，页面无法再监听window的滚动事件；另外一些复杂交互建议不使用（譬如局部滚动，下拉等操作模拟），下一版本会对该接口进行完善
 */


mqq.build('mqq.ui.setPullDown', {
    iOS: function(params) {

        mqq.invoke('ui', 'setPullDown', params);
    },
    android: function(params) {

        mqq.invoke('ui', 'setPullDown', params);
    },
    support: {
        iOS: '5.3',
        android: '5.3'
    }
});;/**
 * @function ui.setRightDragToGoBackParams
 * @desc 设置左划后退触发的区域
 *
 * @param {Object} param
 * @param {Boolean} param.enable 启动标识, true 启动，false 不启动 
 * @param {String} param.width 右滑相应宽度， width 和 rect 参数 只设置一个即可，同时存在，rect优先。 
 * @param {Object} param.rect 区域矩阵，例如：{x:0,y:0,width:60,height:500} 
 *
 * @example
 * mqq.ui.setRightDragToGoBackParams({                      
 *     enable: true,                      
 *     width: 60                      
 * });                      
 * mqq.ui.setRightDragToGoBackParams({                      
 *     enable: true,                      
 *     rect: {x:0,y:0,width:60,height:500}                      
 * });
 *
 * @support iOS 5.3
 * @support android not support
 */

mqq.build('mqq.ui.setRightDragToGoBackParams', {
    iOS: function(params) {

        mqq.invoke('ui', 'setRightDragToGoBackParams', params);
    },
    support: {
        iOS: '5.3'
    }
});;/**
 * @function ui.setWebViewBehavior
 * @desc 配置webview的行为
 *
 * @param {Object} param
 *
 * @param {Number} param.swipeBack 是(1)否(0)支持右划关闭手势
 * @support for param.swipeBack iOS 4.7.2
 * @support for param.swipeBack android not support
 *
 * @param {Number} param.actionButton 是(1)否(0)显示右上角按钮
 * @support for param.actionButton iOS 4.7.2
 * @support for param.actionButton android 5.1
 *
 * @param {Number} param.navBgColor 背景颜色，例如：0xFF0000
 * @support for param.navBgColor iOS 5.0
 * @support for param.navBgColor android 5.1

 * @param {Number} param.navTextColor 文字颜色，例如：0xFF0000
 * @support for param.navTextColor iOS 5.0
 * @support for param.navTextColor android 5.1

 * @param {Boolean} param.keyboardDisplayRequiresUserAction 设置为true允许js不经用户触发来弹起键盘
 * @support for param.keyboardDisplayRequiresUserAction iOS 5.1
 * @support for param.keyboardDisplayRequiresUserAction android not support
 *
 * @example
 * //关闭右滑
 * mqq.ui.setWebViewBehavior({
 *     swipeBack:0
 * })
 * 
 * //设置导航栏为黑色背景、红色文字：
 * mqq.ui.setWebViewBehavior({navBgColor:0x000000, navTextColor:0xFF0000});
 * //只修改背景颜色为灰色，文字颜色不变：
 * mqq.ui.setWebViewBahavior({navBgColor:0x666666});
 * //只修改文字颜色为黑色，背景颜色不变：
 * mqq.ui.setWebViewBahavior({navTextColor:0});
 * //恢复默认样式：
 * mqq.ui.setWebViewBehavior({navBgColor:-1, navTextColor:-1});
 *
 * @support iOS 4.7.2
 * @support android 5.1
 */

mqq.build('mqq.ui.setWebViewBehavior', {
    iOS: function(params) {
        mqq.invoke("ui", "setWebViewBehavior", params);
    },
    android: function(params) {
        mqq.invoke("ui", "setWebViewBehavior", params);
    },
    support: {
        iOS: '4.7.2',
        android: '5.1'
    }
});;/**
 * @function ui.shareMessage
 * @desc 调用客户端的分享接口，分享内容给好友/群，调用后会弹出联系人选择列表
 *
 * @param {Object} param
 *
 * @param {String} param.title 必填，消息标题
 * @param {String} param.desc 必填，消息摘要。
 * @param {Number} param.share_type 分享的目标类型，0：QQ好友；1：QQ空间；2：微信好友；3：微信朋友圈。默认为 0
 * @param {String} param.share_url 必填，点击消息后的跳转url。原 targetUrl 参数，可以继续使用 targetUrl
 * @param {String} param.image_url 必填，消息左侧缩略图url。图片推荐使用正方形，宽高不够时等比例撑满，不会变形。原 imageUrl 参数，可以继续使用 imageUrl。注意：图片最小需要200 * 200，否则分享到Qzone时会被Qzone过滤掉。
 * @param {Boolean} param.back 发送消息之后是否返回到web页面，默认false，直接到AIO，注：该参数只对share_type=0时起作用
 * @support for param.back iOS 5.0
 * @support for param.back android 4.7.2
 *
 * @param {String} param.shareElement 分享的类型，目前支持图文和音乐分享。news：图文分享类型，audio：音乐分享类型，video：视频分享类型。默认为news
 * @support for param.shareElement iOS 5.0
 * @support for param.shareElement android 5.0
 *
 * @param {String} param.flash_url 如果分享类型是音乐或者视频类型，则填写流媒体url
 * @support for param.flash_url iOS 5.0
 * @support for param.flash_url android 5.0
 *
 * @param {String} param.puin 公众帐号uin，用于自定义结构化消息尾巴，只在公众账号分享的时候填写，若不是请不要填，当puin没有索引到本地记录，则显示sourceName字段的文本，若没有sourceName字段，则直接显示puin数字
 * @support for param.puin iOS 5.0
 * @support for param.puin android 5.0
 *
 * @param {String} param.appid 来源 appid，在QQ互联申请的的 appid，如果有，可以填上
 * @support for param.appid iOS 5.0
 * @support for param.appid android 5.0
 *
 * @param {String} param.sourceName 消息来源名称，默认为空，优先读取 appid 对应的名字，如果没有则读取 puin 对应的公众账号名称
 * @param {String} param.toUin 分享给指定的好友或群，如果存在这个参数，则不拉起好友选择界面 (针对分享给好友)
 * @support for param.toUin iOS 5.0
 * @support for param.toUin android 5.0
 *
 * @param {Number} param.uinType 分享给指定的好友或群的uin类型: 0：好友；1：群 (针对分享给好友)
 * @support for param.uinType iOS 5.0
 * @support for param.uinType android 5.0
 *
 *
 * @param {Function} callback
 * @param {Function} callback.result
 * @param {Function} callback.result.retCode 0：用户点击发送，完成整个分享流程；1：用户点击取消，中断分享流程
 *
 *
 * @support iOS 4.7.2
 * @support android 4.7.2
 * @note 分享给微信和朋友圈的消息获取不到回调，因此 callback 不会被执行
 */

mqq.build('mqq.ui.shareMessage', {
    iOS: function(params, callback) {

        if (!('needPopBack' in params) && ('back' in params)) {
            params.needPopBack = params.back;
        }
        if (params['share_url']) {
            params['share_url'] = mqq.removeQuery(params['share_url'], ['sid', '3g_sid']);
        }
        if (params.desc) {
            params.desc = params.desc.length > 50 ? (params.desc.substring(0, 50) + '...') : params.desc;
        }
        params['callback'] = mqq.callback(callback, true /*deleteOnExec*/ , true);
        mqq.invoke('nav', 'shareURLWebRichData', params);
    },
    android: function(params, callback) {
        if (params['share_url']) {
            params['share_url'] = mqq.removeQuery(params['share_url'], ['sid', '3g_sid']);
        }
        params['callback'] = mqq.callback(function(result) {
            callback && callback({
                retCode: result ? 0 : 1
            });
        }, true /*deleteOnExec*/ );
        if (params.desc) {
            params.desc = params.desc.length > 50 ? (params.desc.substring(0, 50) + '...') : params.desc;
        }

        if (params['share_type'] && (params['share_type'] === 2 || params['share_type'] === 3) && mqq.compare('5.2') < 0 && mqq.support('mqq.app.isAppInstalled')) {

            // 先检查有没有安装微信, ios不用, ios会自己弹出一个 toast 提示
            // 5.2 android 也会自己检查
            var unsupportTips = '您尚未安装微信，不可使用此功能';
            mqq.app.isAppInstalled('com.tencent.mm', function(result) {
                if (result) {
                    mqq.invoke('QQApi', 'shareMsg', params);
                } else if (mqq.support('mqq.ui.showTips')) {
                    mqq.ui.showTips({
                        text: unsupportTips
                    });
                } else {
                    alert(unsupportTips);
                }

            });

        } else {
            mqq.invoke('QQApi', 'shareMsg', params);
        }
    },
    support: {
        iOS: '4.7.2',
        android: '4.7.2'
    }
});;/**
 * @function ui.shareRichMessage
 * @desc 以公众账号的身份调用native分享接口
 *
 * @param {Object} param
 *
 * @param {String} param.oaUin 公众账号uin
 * @param {String} param.title 消息标题
 * @param {String} param.summary 消息摘要
 * @param {String} param.targetUrl 点击消息后的跳转url
 * @param {String} param.imageUrl 消息左侧缩略图url
 * @param {String} [param.sourceName] 消息来源名称，默认为空，直接读取oaUin对应的公众账号名称
 * @param {Boolean} [param.back] 发送消息之后是否返回到web页面，默认NO，直接到AIO
 * @param {Function} [callback]
 * @param {Function} callback.result
 * @param {Function} callback.result.ret 0：用户点击发送，完成整个分享流程；1：用户点击取消，中断分享流程
 *
 * @support iOS 4.7
 * @support android 4.7
 * @discard 1
 * @important 该接口即将抛弃，已不推荐使用，请统一使用shareMessage
 */

mqq.build('mqq.ui.shareRichMessage', {
    iOS: function(params, callback) {

        // 参数容错
        params.puin = params.oaUin;
        params.desc = params.desc || params.summary;

        if (params['share_url']) {
            params['share_url'] = mqq.removeQuery(params['share_url'], ['sid', '3g_sid']);
        }
        if (params.desc) {
            params.desc = params.desc.length > 50 ? (params.desc.substring(0, 50) + '...') : params.desc;
        }
        params.callback = mqq.callback(callback);
        mqq.invoke('nav', 'officalAccountShareRichMsg2QQ', params);
    },
    android: function(params, callback) {

        // 参数容错
        params.puin = params.oaUin;
        params.desc = params.desc || params.summary;
        if (params.desc) {
            params.desc = params.desc.length > 50 ? (params.desc.substring(0, 50) + '...') : params.desc;
        }
        if (mqq.compare('5.0') >= 0) {
            // 兼容依旧传 targetUrl 的调用
            params['share_url'] = params['share_url'] || params.targetUrl;
            params['image_url'] = params['image_url'] || params.imageUrl;

            if (params['share_url']) {
                params['share_url'] = mqq.removeQuery(params['share_url'], ['sid', '3g_sid']);
            }
            params.callback = callback ? mqq.callback(function(result) {
                callback({
                    ret: result ? 0 : 1
                });
            }) : null;

            mqq.invoke('QQApi', 'shareMsg', params);
        } else {

            params.targetUrl = params.targetUrl || params['share_url'];
            params.imageUrl = params.imageUrl || params['image_url'];

            if (params['targetUrl']) {
                params['targetUrl'] = mqq.removeQuery(params['targetUrl'], ['sid', '3g_sid']);
            }
            params.callback = mqq.callback(callback);
            mqq.invoke('publicAccount', 'officalAccountShareRichMsg2QQ', params);
        }
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});

// 兼容旧的归类
mqq.build('mqq.data.shareRichMessage', {
    iOS: mqq.ui.shareRichMessage,
    android: mqq.ui.shareRichMessage,
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});;/**
 * @function ui.showActionSheet
 * @desc 弹出 ActionSheet
 *
 * @param {Object} param
 *
 * @param {String} param.title ActionSheet 标题
 * @param {String} param.cancel 指定取消按钮的标题
 * @param {Array|String} param.items 选项里表, 字符串
 *
 * @param {Function} callback
 * @param {Number} callback.type 0：点击普通item；1：取消按钮或空白区域
 * @param {Number} callback.index 点击的item的下标，从0开始
 *
 * @example
 * mqq.ui.showActionSheet({
 *     "title" : "title",
 *     "items" : ["item1", "item2"],
 *     "cancel" : "cancel",
 *     "close" : "close"
 * }, function(type, index){
 *     alert("type: " + type + ", index: " + index);
 * });
 *
 * @support iOS 4.7
 * @support android 4.7
 */

mqq.build('mqq.ui.showActionSheet', {
    iOS: function(params, callback) {
        if (callback) {
            params.onclick = mqq.callback(callback, false /*deleteOnExec*/ , true /*execOnNewThread*/ );
        }
        return mqq.invoke('ui', 'showActionSheet', params);
    },
    android: function(params, callback) {
        if (callback) {
            params.onclick = mqq.callback(callback);
        }
        return mqq.invoke('ui', 'showActionSheet', params);
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});;/**
 * @function ui.showDialog
 * @desc 弹出一个确认框
 *
 * @param {Object} param
 *
 * @param {String} param.title 确认框的标题
 * @param {String} param.text 确认框的提示内容
 * @param {Boolean} param.needOkBtn 是否显示确认按钮
 * @param {Boolean} param.needCancelBtn 是否显示取消按钮
 * @param {String} param.okBtnText 确认按钮的文本(默认为"确定")
 * @support for param.okBtnText iOS 5.0
 * @support for param.okBtnText android 5.0
 *
 * @param {String} param.cancelBtnText 取消按钮的文本(默认为"取消")
 * @support for param.cancelBtnText iOS 5.0
 * @support for param.cancelBtnText android 5.0
 *
 * @param {Function} callback
 * @param {Object} callback.result 点击按钮的返回结果
 * @param {Number} callback.result.button 指示用户点击的按钮, 0: 点击了确认按钮; 1: 点击了取消按钮
 *
 * @support iOS 4.6
 * @support android 4.6
 * @note needOkBtn 和 needCancelBtn 至少要有一个为 true
 */


mqq.build('mqq.ui.showDialog', {
    iOS: function(params, callback) {
        if (params) {
            params.callback = mqq.callback(callback, true /*deleteOnExec*/ , true /*execOnNewThread*/ );
            params.title = params.title + '';
            params.text = params.text + '';
            if (!('needOkBtn' in params)) {
                params.needOkBtn = true;
            }
            if (!('needCancelBtn' in params)) {
                params.needCancelBtn = true;
            }
            // 字段兼容
            params.okBtnStr = params.okBtnText;
            params.cancelBtnStr = params.cancelBtnText;

            mqq.invoke('nav', 'showDialog', params);
        }
    },
    android: function(params, callback) {
        if (mqq.compare('4.8.0') >= 0) {
            params.callback = mqq.callback(callback, true);
            mqq.invoke('ui', 'showDialog', params);
        } else {
            var okCbName = '',
                cancelCbName = '';

            if (callback) {

                okCbName = mqq.callback(function() {
                    callback({
                        button: 0
                    });
                }, true);
                cancelCbName = mqq.callback(function() {
                    callback({
                        button: 1
                    });
                }, true);

                okCbName += '()';
                cancelCbName += '()';
            }
            params.title = params.title + '';
            params.text = params.text + '';
            if (!('needOkBtn' in params)) {
                params.needOkBtn = true;
            }
            if (!('needCancelBtn' in params)) {
                params.needCancelBtn = true;
            }
            mqq.invoke('publicAccount', 'showDialog', params.title, params.text,
                params.needOkBtn, params.needCancelBtn, okCbName, cancelCbName);
        }
    },
    support: {
        iOS: '4.6',
        android: '4.6'
    }
});;/**
 * @function ui.showProfile
 * @desc 打开指定uin的资料卡
 *
 * @param {Object} param
 *
 * @param {String} param.uin
 * @param {Number} param.uinType 指定 uin 的类型，默认为个人资料卡，指定为 1 则打开群资料卡
 * @support for param.uinType iOS 4.7
 * @support for param.uinType android 4.7
 *
 * @support iOS 4.5
 * @support android 4.5
 * @note 该接口从 4.6 才开始添加，4.7 才支持 uinType 参数，但客户端以前提供过打开资料卡的 schema 接口，可以兼容到 4.5 版本，所以实际上该接口在 4.5 以上的客户端都能使用
 * @change v4.7: 增加 uinType 的支持
 */

mqq.build('mqq.ui.showProfile', {
    iOS: function(params) {
        if (mqq.compare('4.7') >= 0) {

            mqq.invoke('nav', 'showProfile', params);
        } else if (mqq.compare('4.6') >= 0 && !params.uinType) {
            // 4.6 版本不支持 type 参数
            mqq.invoke('nav', 'showProfile', params);
        } else { // 低版本使用 schema 接口

            if (params.uinType === 1) {
                params['card_type'] = 'group';
            }
            mqq.invokeSchema('mqqapi', 'card', 'show_pslcard', params);
        }
    },
    android: function(params) {
        if (mqq.compare('4.7') >= 0) {

            mqq.invoke('publicAccount', 'showProfile', params);
        } else if (mqq.compare('4.6') >= 0 && !params.uinType) {
            // 4.6 版本不支持 type 参数
            mqq.invoke('publicAccount', 'showProfile', params.uin);
        } else { // 低版本使用 schema 接口

            if (params.uinType === 1) {
                params['card_type'] = 'group';
            }
            mqq.invokeSchema('mqqapi', 'card', 'show_pslcard', params);
        }
    },
    support: {
        iOS: '4.5',
        android: '4.5'
    }
});;/**
 * @function ui.showTips
 * @desc 弹出文本的toast提示，2秒后消失
 *
 * @param {Object} param
 *
 * @param {String} param.text 要提示的文字内容
 *
 * @example
 * mqq.ui.showTips({text: "hello"})
 *
 * @support iOS 4.7
 * @support android 4.7
 */


mqq.build('mqq.ui.showTips', {
    iOS: function(params) {

        mqq.invoke('ui', 'showTips', params);
    },
    android: function(params) {

        mqq.invoke('ui', 'showTips', params);
    },
    support: {
        iOS: '4.7',
        android: '4.7'
    }
});;

