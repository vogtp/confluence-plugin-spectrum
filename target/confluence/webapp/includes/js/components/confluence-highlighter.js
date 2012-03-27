(function() {
    /**
     * Construct a highlighter for the specified tokens.
     *
     * @constructor
     * @param highlightTokens the tokens to highlight
     * @param highlightTemplate an AJS.template String to use for highlighting. Variable substituted if {highlight}.
     *        e.g. <span class="highlight">{highlight}</span>
     *        Default, if omitted is <strong>{highlight}</strong>
     */
    Confluence.Highlighter = function(highlightTokens, highlightTemplate) {
        var regex, replaceValue;
        if (highlightTokens && highlightTokens.length && highlightTokens[0]) {
            // escape regex chars .*+?|()[]{}\ first
            var tokens = [];
            for (var i = 0, ii = highlightTokens.length; i < ii; i++) {
                var token = highlightTokens[i];
                token && tokens.push(token.replace(/[\.\*\+\?\|\(\)\[\]{}\\]/g, "\\$"));
            }

            regex = new RegExp("(" + tokens.join("|") + ")", "gi");
            replaceValue = AJS.template(highlightTemplate || "<strong>{highlight}</strong>")
                .fill({highlight: "$1"})
                .toString();
        }

        return {
            /**
             * Highlights any matching tokens (passed into the constructor), and returns the new value.
             *
             * @param value an array of values to be highlighted
             * @param dontEscape don't html escape value. Default is to escape
             * @return value, if highlightTokens is null, or empty.
             */
            highlight: function(value, dontEscape) {
                if(!value) return value;

                if(!dontEscape)
                    value = AJS.template.escape(value);

                if(!regex) return value;

                return value.replace(regex, replaceValue);
            }
        };

    };
})();