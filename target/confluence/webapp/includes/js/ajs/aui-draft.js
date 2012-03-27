(function($) {

/**
 * Where extensions to AUI that aren't ready to migrate should be stored.
 *
 * Functions added here should have a @since version and go on the roadmap to
 * be moved over after a suitable delay.
 */

var _debugEnabled = false;

/**
 * Similar to AJS.log but only output if debug is enabled.
 * @param msg the string to output
 */
AJS.debug = function (msg) {
    if (!_debugEnabled) return;

    AJS.log('DEBUG: ' + new Date().toLocaleTimeString() + ' : ' + msg);
};

/**
 * Sets debug enabled state if 'enabled' param passed, else returns debug enabled state.
 * @param enabled true or false if AJS.debug should log messages
 */
AJS.debugEnabled = function(enabled) {
    if (typeof enabled != "boolean")
        return _debugEnabled;

    _debugEnabled = enabled;
    AJS.log('DEBUG ENABLED: ' + _debugEnabled);
};

    AJS.logError = function(prefix, ex) {
        // Handle IE and Mozilla style Error objects
        // see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error
        // see http://msdn.microsoft.com/en-us/library/dww52sbt%28v=vs.94%29.aspx
        var msgs = [];

        if ($.browser.webkit) {
            msgs.push(ex);
        } else {
            for (prop in ex) {
                msgs.push(prop + ': ' + ex[prop]);
            }            
        }
        
        AJS.log(prefix + msgs.join(', '));
    };

    // Override of atlassian.js toInit to add improved exception logging
    AJS.toInit = function (func) {
        $(function () {
            try {
                func.apply(this, arguments);
            } catch(ex) {
                // just calling AJS.log with an Error object gives "[object Error]" in IE,
                // We want better, thus more plumbing for better Error object logging
                AJS.logError("Failed to run init function: ", ex);
            }
        });
        return this;
    };

// should logging appear in the DOM?
if (AJS.Meta.getBoolean('log-rendered')) {
    var oldLog = AJS.log,
        logDiv = $('<div id="ajs-log" class="log"><h3>AJS Log</h3>\n</div>'),
        head = $('head'),
        body;

    // should logging appear on screen?
    logDiv.toggleClass('hidden', !AJS.Meta.getBoolean('log-visible'));

    // AUI Logging is disabled if there is no console
    // we want to always log to a div as well
    AJS.log = function(obj) {
        var str = (typeof(obj) === "undefined") ? 'undefined' : obj;
        if (body) {
            // ensure the div is the last on the page
            if (logDiv.next().length != 0) {
                body.append(logDiv);
            }
        } else {
            // IE will reject your puny attempts to use jQuery's .text() method here, complaining about an 'Unexpected method or property access'
            // see http://forum.jquery.com/topic/unexpected-call-to-method-or-property-access-in-ie8
            // Using primitive DOM createElement instead
            var script = document.createElement('script');
            script.type = 'text/x-log';
            script.text = str;
            head.append(script);
        }
        logDiv.append($('<p></p>').text('\n' + str));
        oldLog(obj);
    };

    AJS.toInit(function() {
        body = $('body');
        body.append(logDiv);
    });
}

/**
 * @since 3.4
 * @deprecated Since 4.0. See CONFDEV-3726
 */
AJS.Data = AJS.Data || AJS.Meta;

//
/**
 * Wrapper for JSON AJAX calls; handles errors and 'successes' containing error messages in the JSON response. Also
 * handles display of any loading elements.
 *
 * @param options, including:
 *
 * - url: url to request JSON from
 * - data: data to pass in the request
 * - messageHandler: an AJS.MessageHandler for any error responses
 * - successCallback: (optional) a function to call with the returned JSON
 * - loadingElement: (optional) an element or elements to show when the request is running and hide when complete
 * - errorMessage: (optional) a string to display if an undefined error occurs
 * - errorCallback: (optional) a function to call if the request fails for any reason
 */
AJS.getJSONWrap = function (options) {

    // Ensure that relative urls are prefixed with the context path.
    var contextPath = Confluence.getContextPath();
    var url = options.url;
    if (url.indexOf(contextPath) != 0 && url.indexOf('http') != 0)
        url = contextPath + url;

    // Before sending the request display any loading message elements.
    options.loadingElement && AJS.setVisible(options.loadingElement, true);

    var msgr = options.messageHandler;
    msgr.clearMessages();

    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        data: options.data,
        error: function () {
            options.loadingElement && AJS.setVisible(options.loadingElement, false);
            msgr.displayMessages(options.errorMessage || AJS.I18n.getText('unknown.server.error'));
            options.errorCallback && options.errorCallback();
        },
        success: function (data) {
            options.loadingElement && AJS.setVisible(options.loadingElement, false);
            if (msgr.handleResponseErrors(data)) {
                // Xwork action errors were found in the response and displayed.
                options.errorCallback && options.errorCallback();
                return;
            }

            options.successCallback && options.successCallback(data);
        }
    });
};

/*
    Validates text against WWW standards.

    URL and Email regex borrowed from:
    http://bassistance.de/jquery-plugins/jquery-plugin-validation/
    which is:
    Copyright (c) 2006 - 2011 J�rn Zaefferer

    Dual licensed under the MIT and GPL licenses:
    http://www.opensource.org/licenses/mit-license.php
    http://www.gnu.org/licenses/gpl.html
 */
AJS.Validate = $.extend((function (){
    var emailRegex, urlRegex;
    return {
        email: function (str) {
            if (!emailRegex) {
                // Lazy load because it's an enormous Regex.
                // see http://projects.scottsplayground.com/email_address_validation/lib/email.js for derivation
                emailRegex = /^((([a-z]|\d|[!#\$%&amp;&#39;\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&amp;&#39;\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i;
            }
            return emailRegex.test(str);
        },

        url: function (str) {
            if (!urlRegex) {
                // Tweaked by wwalser from the original. See http://projects.scottsplayground.com/iri/lib/iri.js for derivation
                urlRegex = /^([a-z]([a-z]|\d|\+|-|\.)*):(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
            }
            return urlRegex.test(str);
        }
    };
}()), AJS.Validate);

})(AJS.$);
