/**
 * Wrap this function around values which should not be auto-HTML escaped in template substitution.
 *
 * @param value the String value which should not be escaped
 */
AJS.html = function (value) {
    var str = new String(value);
    str.isHtml = true;
    return str;
};

AJS.toInit(function ($) {
    var templates = {};

    /**
     * Loads template script elements from a passed element of from the document.
     * If the passed element is HTML it will be converted to an element before being parsed.
     */
    AJS.loadTemplateScripts = function (element) {
        element = element || document;

        $("script", element).each(function () {
            if (this.type == "text/x-template") {
                templates[this.title] = AJS.html(this.text);
            }
        });
    };
    AJS.loadTemplateScripts();

    AJS.getTemplate = function (name) {
        return templates[name];
    };

    var entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    };

    AJS.escapeEntities = function (str) {
        if (str == null) {
            return str;
        }
        if (str.isHtml) {
            return "" + str;
        }
        return ("" + str).replace(/[&<>'"]/g, function (c) { return entities[c] || c; });
    };

    function format(message) {
        var args = arguments;
        return message.replace(/\{(\d+)\}/g, function (str, i) {
            var replacement = args[parseInt(i, 10) + 1];
            return replacement != null ? replacement : str;
        });
    };

    /**
     * Retrieves a template with a given name from the page body (in the form
     * <script type="text/x-template" title="name">...</script>) and formats it
     * using AJS.format. The arguments are automatically HTML-encoded, so that
     * you cannot accidentally introduce XSS vulnerabilities with this templating
     * mechanism.
     *
     * @method renderTemplate
     * @param templateName the title of a script tag in the document which contains a template
     * @param args an array or list of arguments which will be the replacement values for tokens {0}, {1}, etc.
     * @return {String} the template with the tokens replaced or empty string if there is no matching template
     * @usage AJS.renderTemplate("someTemplate", "first", "second", "third");
     * @usage AJS.renderTemplate("someTemplate", ["first", "second", "third"]);
    */
    AJS.renderTemplate = function (templateName, args) {
        if (!AJS.getTemplate(templateName)) {
            return "";
        }
        if (!$.isArray(args)) {
            args = Array.prototype.slice.call(arguments, 1); // arguments is not a proper Array
        }
        var template = AJS.getTemplate(templateName).toString();
        var formatArgs = [ template ];
        for (var i = 0; i < args.length; i++) {
            formatArgs.push(AJS.escapeEntities(args[i]));
        }
        return format.apply(this, formatArgs);
    };

    /**
     * Loads templates from a URL, stores them in the template store, then runs a callback.
     * @param url
     * @param callback
     */
    AJS.loadTemplatesFromUrl = function (url, callback) {
        // If url should include static prefix and doesn't - add it.
        var prefix = AJS.Meta.get('static-resource-url-prefix');
        if (url.indexOf('http') != 0 && url.indexOf(prefix) != 0) {
            url = prefix + url;
        }
        $.ajax({
            url: url,
            data: {
                "locale": AJS.params.userLocale // request should be cached against the user's locale
            },
            dataType: "html",
            success: function(html) {
                var wrapper = AJS("div").append(html);
                AJS.loadTemplateScripts(wrapper);
                callback && callback();
            }
        });
    };

    /**
     * Loads templates for a resource name in a plugin module.
     * @param moduleKey - the complete key of the module, in the form pluginKey:moduleKey
     * @param resourceName - the resource name inside the module.
     * @param callback
     */
    AJS.loadWebResourceTemplates = function (moduleKey, resourceName, callback) {
        var url = "/download/resources/" + moduleKey + "/" + resourceName;
        return this.loadTemplatesFromUrl(url, callback);
    };
});
