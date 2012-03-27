/**
 * AUI Overrides
 *
 * As new versions of AUI are implemented, this JS
 * should be reviewed and adjusted as appropriate.
 */
(function () {
    if (typeof AJS != "undefined") {
        /**
         * Find parameters in the DOM and store them in the ajs.params object.
         *
         * Override the AUI version so we can patch in AJS.Meta meta tag values for old scripts still using
         * AJS.params that *should* be using AJS.Meta.
         */
        var origPopulateParameters = AJS.populateParameters;

        AJS.populateParameters = function () {
            origPopulateParameters.apply(AJS, arguments);

            AJS.$("meta[name^=ajs-]").each(function () {
                var key = this.name,
                    value = this.content;

                // convert name from ajs-foo-bar-baz format to fooBarBaz format.
                key = key.substring(4).replace(/(-\w)/g, function(s) {
                    return s.charAt(1).toUpperCase();
                });
                // Only set if not already defined
                if (typeof AJS.params[key] == "undefined") {
                    AJS.params[key] = AJS.asBooleanOrString(value);
                }
            });
        };
    }

    /**
     * @aui-override Disable element extension to AJS.$
     *
     * @date 2009-09-23
     * @author dtaylor
     * @since confluence-3.1-m5
     *
     * @param element
     */
    AJS.$.fn.disable = function(element) {
        return this.each(function() {
            var el = AJS.$(this);
            var id = el.attr("disabled", "disabled").addClass("disabled").attr("id");
            if (id) {
                // Only search in the parent - element might not exist in the DOM yet.
                AJS.$("label[for=" + id + "]", el.parent()).addClass("disabled");
            }
        });
    };

    /**
     * @aui-override Enable element extension to AJS.$
     *
     * @date 2009-09-23
     * @author dtaylor
     * @since confluence-3.1-m5
     *
     * @param element
     */
    AJS.$.fn.enable = function(element) {
        return this.each(function() {
            var el = AJS.$(this);
            var id = el.attr("disabled", "").removeClass("disabled").attr("id");
            if (id) {
                AJS.$("label[for=" + id + "]", el.parent()).removeClass("disabled");
            }
        });
    };

})();
