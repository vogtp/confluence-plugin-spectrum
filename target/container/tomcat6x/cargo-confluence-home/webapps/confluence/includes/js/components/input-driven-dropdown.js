(function($){
    /**
     * Check that all items in the drop down can be displayed - show ellipses at the end of any that
     * are too long. Also remove any unused properties that the dropDown may have stored for each
     * item in the list.
     *
     * @method truncateText
     * @private
     */
    var truncateText = function (dd) {
        AJS.log("InputDrivenDropDown: truncating text");
        var width = dd.$.closest(".aui-dd-parent").width(),
            rightPadding = 20; // add some padding so the ellipsis doesn't run over the edge of the box

        // If there is no width to calculate, default to 25em
        if (!width) {
            dd.$.width("25em");
            width = dd.$.width();
        }

        $("a span:not(.icon)", dd.$).each(function () {
            var $a = $(this),
                elpss = AJS("var", "&#8230;"),
                elwidth = elpss.width(),
                isLong = false;

            $a.wrapInner($("<em>"));
            $("em", $a).each(function () {
                var $label = $(this);

                $label.show();
                if (this.offsetLeft + this.offsetWidth + elwidth > width - rightPadding) {
                    var childNodes = this.childNodes,
                        success = false;

                    for (var j = childNodes.length - 1; j >= 0; j--) {
                        var childNode = childNodes[j],
                            truncatedChars = 1,
                            valueAttr = (childNode.nodeType == 3) ? "nodeValue" : "innerHTML",
                            nodeText = childNode[valueAttr];

                        do {
                            if (truncatedChars <= nodeText.length) {
                                childNode[valueAttr] = nodeText.substr(0, nodeText.length - truncatedChars++);
                            } else { // if we cannot fit even one character of the next word, then try truncating the node just previous to this
                                break;
                            }
                        } while (this.offsetLeft + this.offsetWidth + elwidth > width - rightPadding);

                        if (truncatedChars <= nodeText.length) {
                            // we've managed truncate part of the word and fit it in
                            success = true;
                            break;
                        }
                    }

                    if (success) {
                        isLong = true;
                    } else {
                        $label.hide();
                    }
                }
            });
            if (isLong) {
                $a.append(elpss);
                this.elpss = elpss;
            }
        });
    };

    var addSpaceNames = function(dd) {
        AJS.log("InputDrivenDropDown: add space names");
        $("a span:not(.icon)", dd.$).each(function () {
            var $a = $(this);
            // get the hidden space name property from the span
             // need to surround with try/catch until AJS-294 resolved
             var spaceName;
             try {
                spaceName = AJS.dropDown.getAdditionalPropertyValue($a, "spaceName");
             } catch (err) {
                 AJS.log("Problem getting space name: " + err.message);
             }
            // we need to go through html node creation so that all encoded symbols(like &gt;) are displayed correctly

            var title = $a.text();
            if (spaceName) {
                title += " (" + AJS("i").html(spaceName).text() + ")";
            }

            $a.attr("title", title);
        });
    };
    /**
     * Builds and shows the dropdown.
     * 
     * @param idd the InputDrivenDropdown
     * @param dropdownData in the form { matrix, query, queryTokens }
     * @private
     */
    var makeDropdown = function (idd, dropdownData) {
        var options = idd.options,
            old_dd = idd.dd;

        if (old_dd) {
            old_dd.hide();
            old_dd.$.remove();
        }
        
        options.ajsDropDownOptions = options.ajsDropDownOptions || {};
        if (options.ajsDropDownOptions && !options.ajsDropDownOptions.alignment) { // default to left alignment
            options.ajsDropDownOptions.alignment = "left";
        }
        //this needs to be moved into aui
        options.ajsDropDownOptions.selectionHandler = options.ajsDropDownOptions.selectionHandler || function(e, element) {
            if(e.type != "click") {
                e.preventDefault();
                $("a",element).click();
                document.location = $("a",element).attr("href");
            }
        };
        
      
        
        var dd = idd.dd = AJS.dropDown(dropdownData.matrix, options.ajsDropDownOptions)[0];

        // could move into dropdown.js in AUI
        if (options.ajsDropDownOptions && options.ajsDropDownOptions.className) {
            dd.$.addClass(options.ajsDropDownOptions.className);
        }
        
        // place the created drop down using the configured dropdownPlacement function
        // if there is none then use a default behaviour
        if (options.dropdownPlacement) {
            options.dropdownPlacement(dd.$);
        } else {
            AJS.log("No dropdownPlacement function specified. Appending dropdown to the body.");
            $("body").append(dd.$);
        }

        var highlighter = new Confluence.Highlighter(dropdownData.queryTokens || [dropdownData.query]);
        $("li a:not(.dropdown-prevent-highlight) span", dd.$).each(function() {
            var span = $(this);
            span.html(highlighter.highlight(span.html(), true));
        });

        truncateText(dd);
        addSpaceNames(dd);

        if (options.dropdownPostprocess) {
            options.dropdownPostprocess(dd.$);
        }
        dd.show(idd._effect);

        if (typeof options.onShow == "function") {
            options.onShow.call(dd, dd.$);
        }
        
        return dd;
    };
    
    /**
     * Provides a controller-agnostic object that listens for controller changes and populates a dropdown
     * via a callback. Most aspects can be customized via the options object parameter.
     * <br>
     * Options are:
     * <li>
     *   getDataAndRunCallback - (required) callback method used to provide data for the dropdown. It must take
     *                          two parameters, user input value and the callback function to execute.
     * </li>
     * <li>
     *   onShow - function to call when the drop-down is displayed
     * </li>
     * <li>
     *   dropdownPlacement - a function that will be called with the drop down and which should place it in the
     *                          correct place on the page. The supplied arguments are 1) the input that issued the
     *                          search, 2) the dropDown to be placed.
     * </li>
     * <li>
     *   ajsDropDownOptions - any options the underlying dropDown component can handle expects
     * </li>
     * <li>
     *   onDeath - callback to run when dropdown dies
     * </li>
     * @class InputDrivenDropDown
     * @namespace AJS
     */
    function InputDrivenDropDown(id, options) {
        this._effect = "appear";
        this._timer = null;

        this.id = id;
        this.options = options;
        this.inactive = false;
        this.busy = false;
        this.cacheManager = AJS.Confluence.cacheManager();
    }

    /**
     * Clears the cache.
     */
    InputDrivenDropDown.prototype.clearCache = function () {
        this.cacheManager.clear();
    };

    /**
     * This method should be called when the user input for this dropdown has changed.
     * It will check the cache before fetching data (via options.getDataAndRunCallback)
     * and displaying the dropdown.
     *
     * @param value {String} the new value of the user input
     * @param force {Boolean} force a change to occur regardless of user input
     */
    InputDrivenDropDown.prototype.change = function (value, force) {
        var t = this;
        if (value != t._value) {
            t._value = value;
            t.busy = false;

            clearTimeout(t._timer);

            if (force || (/\S{2,}/).test(value)) {
                var cachedVal = t.cacheManager.get(value);
                if (cachedVal) {
                    makeDropdown(t, cachedVal);
                } else {
                    t.busy = true;
                    var getDataAndRunCallback = function() {
                        t.options.getDataAndRunCallback.call(t, value, t.show);
                    }

                    if (t.options.dropDownDelay === 0) {
                        getDataAndRunCallback();
                    } else {
                        t._timer = setTimeout(function () { // delay sending a request to give the user a chance to finish typing their search term(s)
                            getDataAndRunCallback();
                        }, t.options.dropDownDelay || 200);
                    }
                }
            } else {
                t.dd && t.dd.hide();
            }
        }
    };

    /**
     * Hides the drop down
     */
    InputDrivenDropDown.prototype.hide = function () {
        this.dd && this.dd.hide();
    };

    /**
     * Hides and removes the drop down from the DOM.
     */
    InputDrivenDropDown.prototype.remove = function () {
        var dd = this.dd;
        if (dd) {
            this.hide();
            dd.$.remove();
        }
        this.inactive = true;
        this.options.onDeath && this.options.onDeath();
    };

    /**
     * Shows the drop down with the given matrix data and query.
     * <br> 
     * Matrix property should be an array of arrays, where the sub-arrays represent the different
     * search categories.
     *
     * Expected properties of category sub-array objects are:
     *  - href
     *  - name
     *  - className
     *  - html (optional, replaces href and name)
     *  - icon (optional)
     *
     *
     * @param matrix {Array} matrix to populate the drop down from
     * @param query {String} the user input string that triggered this show
     * @param queryTokens {Array} an array of strings of the query tokens. Use for highlighting search terms.
     */
    InputDrivenDropDown.prototype.show = function (matrix, query, queryTokens) {
        if (this.inactive) {
            AJS.log("Quick search abandoned before server response received, ignoring. " + this);
            return;
        }

        var dropdownData = {
            matrix: matrix,
            query: query,
            queryTokens: queryTokens
        };
        this.cacheManager.put(query, dropdownData);

        makeDropdown(this, dropdownData);
        this.busy = false;
    };

    /**
     * Returns an InputDrivenDropDown. See InputDrivenDropDown for more documentation.
     * @param options {Object} options for the InputDrivenDropDown
     * @constructor
     */
    AJS.inputDrivenDropdown = function (options) {
        return new InputDrivenDropDown("inputdriven-dropdown", options);
    };

})(jQuery);
