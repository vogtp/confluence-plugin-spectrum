(function ($) {

    /**
     * Singleton instance that is able to serialize/deserialize macro parameters according to the format defined in
     * the server-side java class DefaultMacroParameterSerializer.
     */
    Confluence.MacroParameterSerializer = (function ()
    {
        function escape(str) {
            return str.replace(/\\/g, "\\\\")   /* \ -> \\ */
                    .replace(/=/g, "\\=")       /* = -> \= */
                    .replace(/[|]/g, "\\|");    /* | -> \| */
        }

        function unescape(str) {
            return str.replace(/\\(.)/g, "$1");
        }

        return {
            /**
             * Serialize map of macro parameters.
             *
             * @param parameters a map of macro parameters (the key being the parameter name, and the value the parameter value)
             */
            serialize: function (parameters) {
                var result = [];

                for (paramName in parameters) {
                    result.push(escape(paramName) + "=" + escape(parameters[paramName]));
                }

                return result.join("|");
            },
            /**
             * Deserializes a string representing macro parameters into a map.
             *
             * @param parameters a string containing macro parameters (e.g. "a=b|c=d")
             */
            deserialize: function (parameters) {
                function split(str, splitChar) {
                    var buffer = [], result = [], c;
                    str = str || "";

                    for (var i = 0, l = str.length; i < l; i++) {
                        c = str[i];
                        if (c == "\\") {
                            buffer.push(c + (i + 1 != str.length ? str[++i] : ""));
                        } else if (c == splitChar) {
                            result.push(buffer.join(""));
                            buffer = [];
                        } else {
                            buffer.push(c);
                        }
                    }

                    result.push(buffer.join(""));

                    return result;
                }

                var result = {};

                $.each(split(parameters || "", "|"), function (index, macroParam) {
                    var macroParamSplit = split(macroParam, "=");

                    if (macroParamSplit.length == 2 && macroParamSplit[0]) {
                        result[unescape(macroParamSplit[0])] = unescape(macroParamSplit[1]);
                    }
                });

                return result;
            }
        };
    })();

})(AJS.$);