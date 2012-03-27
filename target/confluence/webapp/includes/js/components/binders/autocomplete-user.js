/**
 * User Autocomplete Binder Component.
 * <br>
 * Expected markup:
 * &lt;input class="autocomplete-user" data-max="10" data-none-message="No results" data-target="#foo" data-template="{username}"&gt;
 * <li>data-template - (required) a template used to populate the value for the input</li>
 * <li>data-none-message - a message to display when no results returned</li>
 * <li>data-max - maximum number of search results, defaults to 10 if not defined</li>
 * <li>data-alignment - alignment of the autocomplete dropdown relative to the input field. Defaults to "left" alignment</li>
 * <li>data-dropdown-target - a target element selector to place the autocomplete dropdown in.
 * If none specified it will be placed in a div immediately after the input field.</li>
 * <li>data-target - a target element selector to update its value with the value provided by data-template.
 * This is typically useful when you want to display the user's full name in the input field but submit the username
 * to the server, so another input element needs to be updated.</li>
 * <li>data-resize-to-input - sets the width of the dropdown to be the same as the input field
 * <br>
 * Events Thrown:
 * open.autocomplete-user, selected.autocomplete-user
 *
 * @since 3.3
 * @class autocompleteUser
 * @namespace AJS.Confluence.Binder
 */
Confluence.Binder.autocompleteUser = function(scope) {
    scope = scope || document.body;
    var $ = AJS.$;

     var makeRestMatrixFromData = function (restObj) {
        if (!restObj || !restObj.result){
            throw new Error("Invalid JSON format");
        }
        var matrix = [];
        matrix.push(restObj.result);
        return matrix;
    };

    $("input.autocomplete-user[data-autocomplete-user-bound!=\"true\"]", scope).each(function() {
        var $this = $(this)
                    .attr("data-autocomplete-user-bound", "true")
                    .attr("autocomplete", "off");
        var maxResults = $this.attr("data-max") || 10,
            alignment = $this.attr("data-alignment") || "left",
            dropDownTarget = $this.attr("data-dropdown-target"),
            dropDownPosition = null;

        if (dropDownTarget) {
            dropDownPosition = $(dropDownTarget);
        }
        else {
            dropDownPosition = $("<div></div>");
            $this.after(dropDownPosition);
        }

        if ($this.attr("data-resize-to-input")) {
            dropDownPosition.width($this.outerWidth());
            dropDownPosition.addClass("resize-to-input");
        } 
        dropDownPosition.addClass("aui-dd-parent autocomplete");

        $this.quicksearch(AJS.REST.getBaseUrl() + "search/user.json",
            function() {
                $this.trigger("open.autocomplete-user");
            }, {
            makeParams : function(val) {
                return {
                    "max-results": maxResults,
                    query: val
                };
            },
            dropdownPlacement: function(dd) {
                dropDownPosition.append(dd);
            },
            makeRestMatrixFromData : makeRestMatrixFromData,
            addDropdownData : function (matrix) {
                if (!matrix.length) {
                    var noResults = $this.attr("data-none-message");
                    if (noResults) {
                        matrix.push([{
                            name: noResults,
                            className: "no-results",
                            href: "#"
                        }]);
                    }
                }

                return matrix;
            },
            ajsDropDownOptions : {
                alignment: alignment,
                displayHandler: function(obj) {
                    if (obj.restObj && obj.restObj.username) {
                        return obj.name + " (" + obj.restObj.username + ")";
                    }
                    return obj.name;
                },
                selectionHandler: function (e, selection) {

                    if (selection.find(".search-for").length) {
                        $this.trigger("selected.autocomplete-user", { searchFor: $this.val() });
                        return;
                    }
                    if (selection.find(".no-results").length) {
                        this.hide();
                        e.preventDefault();
                        return;
                    }

                    var contentProps = $("span:eq(0)", selection).data("properties"),
                        username = contentProps.restObj.username,
                        targetSelector = $this.attr("data-target"),
                        target = targetSelector && $(targetSelector),
                        template = $this.attr("data-template") || "{username}";

                    $this.val(AJS.template(template).fillHtml(contentProps.restObj));
                    target && target.val(username);
                    
                    $this.trigger("selected.autocomplete-user", { content: contentProps.restObj });
                    this.hide();
                    e.preventDefault();
                }
           }
        });
    });

};
