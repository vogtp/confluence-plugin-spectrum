(function($) {
/**
 * A collection of reusable Confluence UI Components.
 * @module Components
 */

/**
 * Generic Confluence helper functions.
 *
 * @static
 * @since 3.3
 * @class Confluence
 * @requires AJS, jQuery
 */
Confluence = {
    /**
     * Returns the context path defined in the 'ajs-context-path' meta tag.
     *
     * e.g. /confluence
     *
     * @method getContextPath
     * @return {String}
     */
    getContextPath : function() {
        return AJS.Meta.get("context-path");
    },

    /**
     * Returns the configured Confluence base url. This is retrieved from a meta tag.
     *
     * @method getBaseUrl
     * @return {String}
     */
    getBaseUrl : function () {
        return AJS.$("#confluence-base-url").attr('content') || "";
    },

    /**
     * Returns the product Build Number defined in the 'ajs-build-number' meta tag.
     *
     * e.g. 2021
     *
     * @method getBuildNumber
     * @return {String}
     */
    getBuildNumber : function() {
        return AJS.Meta.get("build-number");
    },

    /**
     * Binder components, in the AJS.Confluence.Binder namespace are executed.
     * This can be called when new elements are added to the page after page load
     * (e.g. dialog is created) and the components need to bound to the new elements.
     *
     * @method runBinderComponents
     */
    runBinderComponents: function () {
        AJS.log("AJS.Confluence: run binder components");
        for (var i in Confluence.Binder) {
            if (Confluence.Binder.hasOwnProperty(i)) {
                try {
                    Confluence.Binder[i]();
                } catch(e) {
                    AJS.log("Exception in initialising of component '" + i + "': " + e.message);
                }
            }
        }
    },

    /**
     * @deprecated Use AJS.Confluence.Binder.placeFocus instead.
     */
    placeFocus: function () {
        Confluence.Binder.placeFocus();
    },

    /**
     * Unescapes am xml-encoded string into raw format.
     * @method unescapeEntities
     * @param str
     * @returns unescaped string
     */
    unescapeEntities : function (str)
    {
        var entities = {
            "amp": "&",
            "lt": "<",
            "gt": ">",
            "#39": "'",
            "quot" : '"'
        };

        if (str == null) {
            return str;
        }

        return ("" + str).replace(/&[#\d\w]+;/g, function (c) {
            // remove the '&' and ';'
            var encoded = c.substring(1, c.length - 1);
            return entities[encoded] || c;
        });
    }
};

/**
 * Binders are components that bind, dependent on the markup in the page.
 * <p>
 * Objects added to the AJS.Confluence.Binder namespace are run on page load and must be
 * functions which can be executed several times on a page.
 * 
 * @class Binder
 * @namespace Confluence
 */
Confluence.Binder = {
    /**
     * Automatically place the focus on an input field with class 'data-focus'.  The element
     * with the highest value wins.  If more than one index has the same value, one will be picked
     * indeterminately.
     *
     * Note, we could use the HTML5 autofocus attribute, but it only expects one element in the document
     * to have such an attribute specified.
     *
     * @method placeFocus
     */
    placeFocus: function () {
        var element,max = -1;
        AJS.$("input[data-focus]").each(function() {
            var $this = AJS.$(this),
                thisFocus = $this.attr("data-focus");
            if (thisFocus > max) {
                max = thisFocus;
                element = $this;
            }
        });
        element && element.focus();
    }
};

})(AJS.$);

AJS.toInit(function () {
    Confluence.runBinderComponents();
});


/**
 * @deprecated since 4.0, Use Confluence instead.
 */
AJS.Confluence = Confluence;

/**
 * Manager to get hints in sequential order from a random
 * point in the given array of hints.
 *
 * @method hintManager
 * @param hints {Array} an array of hints
 */
Confluence.hintManager = function(hints) {
    if (!AJS.$.isArray(hints))
        throw new Error("Hints passed in must be an array of strings");

    var nextHint = Math.floor(Math.random()*hints.length);

    return {
        getNextHint: function() {
            var hint = hints[nextHint];
            nextHint = (nextHint+1) % hints.length;
            return hint;
        }
    };
};