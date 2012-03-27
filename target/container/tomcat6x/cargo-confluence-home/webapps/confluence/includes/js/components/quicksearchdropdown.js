(function($){

    /**
     * jQuery plugin that displays a quicksearch drop down for the current input element.
     * <br>
     * Options are:
     * <li>makeParams - a function that will return query parameters</li>
     * <li>makeRestMatrixFromData - a function that will build a rest matrix as expected by InputDrivenDropDown</li>
     * <li>addDropdownData - a function that will add extra data to the matrix. This is only valid if
     * makeRestMatrixFromData is specified.
     * </li>
     * See InputDrivenDropDown for additional options.
     *
     * @class quicksearch
     * @namespace $
     * @extends jQuery
     * @requires AJS.InputDrivenDropDown
     * @constructor
     * @param path {String|Function} a function or string to the JSON url
     * @param onShow {Function} DEPRECATED. Put on the options object instaed.
     * @param options {Object}
     */
    $.fn.quicksearch = function (path, onShow, options) {
        if (onShow) {
            options.onShow = onShow;
        }
        options.makeParams = options.makeParams || function(val) {
            return {
                query: val
            };
        };
        var getMatrix = function (json) {
            var hasErrors = json.statusMessage; // right now, we are overloading the existence of a status message to imply an error

            var matrix;
            if (hasErrors) {
               matrix = [[{html: json.statusMessage, className: "error"}]];
            } else {
                if (options.makeRestMatrixFromData) {
                    var restMatrix = options.makeRestMatrixFromData(json);
                    matrix = AJS.REST.convertFromRest(restMatrix);
                    if (options.addDropdownData) {
                        matrix = options.addDropdownData(matrix);
                    }
                } else {
                    matrix = json.contentNameMatches;
                }
            }
            return matrix;
        };

        var getPath, oldPath;
        if (typeof path == "function") {
            oldPath = path(),
            getPath = function (control) {
                var newPath = path();
                if (newPath != oldPath) {
                    oldPath = newPath;
                    control.clearCache();
                }
                return newPath;
            };
        } else {
            getPath = function () {
                return path;
            };
        }

        options.getDataAndRunCallback = options.getDataAndRunCallback  || function (val, callback) {

            var control = this, //the input driven drop down
                url = getPath(control, val),
                urlPrefix = AJS.Meta.get("context-path") || "";

            $.ajax({
                type: "GET",
                dataType: "json",
                url: urlPrefix + url,
                data: options.makeParams(val),
                success: function (json, resultStatus) {
                    $(window).trigger("quicksearch.ajax-success", {url: url, json: json, resultStatus: resultStatus});
                    if (document.activeElement != qsinput[0]) return;

                    var matrix = getMatrix(json);
                    callback.call(control, matrix, val, json.queryTokens);                    
                },
                global: false,
                timeout: 5000,
                error: function (xhr, resultStatus, e) { // ajax error handler
                    $(window).trigger("quicksearch.ajax-error", {url: url, xmlHttpRequest: xhr, resultStatus: resultStatus, errorThrown: e});
                    if (document.activeElement != qsinput[0]) return;

                    if (resultStatus == "timeout") {
                        var matrix = getMatrix({statusMessage: "Timeout", query: val});
                        callback.call(control, matrix, null);
                    }
                }
            });
        };
        var idd = AJS.inputDrivenDropdown(options),
            qsinput = $(this);

        qsinput.keyup(function (e) {
            if (e.which == 13 || e.which == 9) {
                AJS.debug("quicksearchdropdown: enter or tab keyup");
                return;
			}
            !qsinput.hasClass("placeholded") && idd.change(this.value);
        });
        qsinput.quickSearchControl = idd;

        qsinput.bind('clearCache.autocomplete', function () {
            idd.clearCache();
        });
        qsinput.bind('hide.autocomplete', function () {
            idd.hide();
        });

        return qsinput;
    };

})(jQuery);
