
function formatDate(fmt, date) {
    var d = date ? new Date(date) : new Date();    //根据时间戳生成的时间对象
    var o = {
        "M+": d.getMonth() + 1, //月份 
        "d+": d.getDate(), //日 
        "H+": d.getHours(), //小时 
        "m+": d.getMinutes(), //分 
        "s+": d.getSeconds(), //秒 
        "q+": Math.floor((d.getMonth() + 3) / 3), //季度 
        "S": d.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

var errorLimit = 10;
var errorKeys = localStorage.getItem("hawkeyeErrorKeys") ? JSON.parse(localStorage.getItem("hawkeyeErrorKeys")) : [];

function handleError(error) {
    var defaultValue = {
        err: error.err || error.msg || "",
        msg: "",
        url: location.href,
        line: 0,
        col: 0,
        tar: "",
    }
    var { err, msg, url, line, col, tar, id } = Object.assign({}, defaultValue, error);
    var errorInfo = "";
    var currentKey = "hawkeyeError-" + new Date().getTime();
    var removeKey = "";
    if (err && err.stack) { //js脚本错误,或throw Error(),或throw new Error()
        errorInfo = err.stack.substr(0, 600);
        if (errorInfo.indexOf("@") !== -1) {
            errorInfo = msg + " \n\r" + errorInfo;//解决safari和firfox中的stack无错误信息问题
        }
    } else if (err || msg) { //直接用throw [error]方式抛出错误或捕获到不存在stack的错误
        errorInfo = "ThrowError: " + JSON.stringify(err || msg) + "\n\r  at " + url + ":" + line + ":" + col;
    } else if (tar) { //http错误
        errorInfo = "HttpError at " + (tar.baseURI || location.href) + " outerHTML:" + tar.outerHTML
    }
    //这里可以添加上报服务器的接口
    //以下代码为在项目中输出异常
    errorInfo += " time:" + formatDate("yyyy-MM-dd HH:mm:ss") + " pvid:" + Math.random();
    errorKeys.push(currentKey);
    if (errorKeys.length > errorLimit) {
        removeKey = errorKeys.shift();
        localStorage.removeItem(removeKey);
    }
    localStorage.setItem(currentKey, errorInfo);
    localStorage.setItem("hawkeyeErrorKeys", JSON.stringify(errorKeys));
}

window.addEventListener('error', function(e) {
    // console.log("---error---", e)
    handleError({
        err: e.error,
        msg: e.message,
        url: e.filename,
        line: e.lineno,
        col: e.colno,
        tar: e.target
    })
}, true);

window.addEventListener("load", function() {
    try {
        localStorage.setItem("hawkeyeHtml", document.documentElement.outerHTML);
    } catch (e) {
        console.error(e)
    }
})

// window.onerror = function(msg, url, line, col, error) {
//     console.log("------msg---", msg)
//     console.log("------url---", url)
//     console.log("------line,col---", line, col)
//     console.log("------error---", error.stack)
//     return true;
// }
