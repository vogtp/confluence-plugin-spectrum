function getXmlHttp() {
    var XMLHttpFactories = [
        function() {return new XMLHttpRequest();},
        function() {return new ActiveXObject("Msxml2.XMLHTTP");},
        function() {return new ActiveXObject("Msxml3.XMLHTTP");},
        function() {return new ActiveXObject("Microsoft.XMLHTTP");},
        function() {return new ActiveXObject("Msxml2.XMLHTTP.3.0");},
        function() {return new ActiveXObject("Msxml2.XMLHTTP.4.0");}
    ];
    var xmlhttp = false, xhr = null;
    for (var i = 0, ii = XMLHttpFactories.length; i < ii; i++) {
        try {
            xhr = XMLHttpFactories[i];
            xmlhttp = xhr();
        }
        catch(e) {
            continue;
        }
        break;
    }
    arguments.callee = function() {
        return xhr();
    };
    return xmlhttp;
}