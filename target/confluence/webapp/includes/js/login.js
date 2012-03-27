/* login */
AJS.$(document).ready(function() {
    AJS.log("login initialising");

    var reloadCaptcha = function() {
        var img = AJS.$(".captcha-image");
        var src = img.attr("src");
        if(src.indexOf("__r") >= 0) {
            src = src.replace(/__r=([^&]+)/, "__r=" + Math.random());
        } else {
            src = src.indexOf('?') >= 0 ? (src + "&__r=" + Math.random()) : (src + "?__r=" + Math.random());
        }
        img.attr("src", src);
    };

    AJS.$("#captcha-container .reload").click(function(e){
        reloadCaptcha();
        AJS.$("#captcha-response").focus();
        return AJS.stopEvent(e);
    });
});