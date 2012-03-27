/**
 * Returns an object wrapper for a parameter-div jQuery object and the input in
 * that div that stores the internal parameter value (as opposed to the display
 * field, although they may be the same).
 */
AJS.MacroBrowser.Field = function (paramDiv, input, options) {
    options = options || {};

    var setValue = options.setValue || function (value) {
        input.val(value);
    };

    var getValue = options.getValue || function () {
        return input.val();
    };
    
    input.change(options.onchange || AJS.MacroBrowser.paramChanged);

    return {
        paramDiv : paramDiv,
        input : input,
        setValue : setValue,
        getValue : getValue
    };
};

/**
 * ParameterFields defines default "type" logic for fields in the Macro
 * Browser's Insert/Edit Macro form.
 * 
 * Each method in this object corresponds to a parameter type as defined in the
 * MacroParameterType enum.
 */
AJS.MacroBrowser.ParameterFields = (function ($) { 

   /**
     * Update the dependencies of the identified parameter with the supplied value.
     */
    var updateDependencies = function (paramName, dependencies, value) {
        if (dependencies && dependencies.length) {
            for ( var i = 0, length = dependencies.length; i < length; i++) {
                AJS.MacroBrowser.fields[dependencies[i]] && AJS.MacroBrowser.fields[dependencies[i]].dependencyUpdated(paramName, value);
            }
        }
    };

    return {
        "updateDependencies" : updateDependencies,
    	
        "username" : function(param, options) {
            if (param.multiple) {
                return AJS.MacroBrowser.ParameterFields.string(param, options);
            }
        
            options = options || {};

            var paramDiv = $(Confluence.Templates.MacroBrowser.macroParameter());
            var input = AJS.$("input[type='text']", paramDiv);
            input.addClass("autocomplete-user").attr("data-none-message", AJS.I18n.getText("macro.browser.smartfields.not.found"));

            // CONF-16859 - check if mandatory params are now filled
            if (param.required) {
                input.keyup(AJS.MacroBrowser.processRequiredParameters);
            }

            input.bind("selected.autocomplete-content", function(e, data) {
                if (options.onselect) {
                    options.onselect(data.selection);
                }
                else if(options.setValue) {
                    options.setValue(data.content.username);
                }
                else {
                    updateDependencies(param.name, options.dependencies, input.val());
                    (typeof options.onchange == "function") && options.onchange.apply(input);
                }
            });
            AJS.Confluence.Binder.autocompleteUser(paramDiv);

            return AJS.MacroBrowser.Field(paramDiv, input);
        },        
        
        "spacekey" : function(param, options) {
            // for multple space keys just use a String field at the moment
            if (param.multiple) {
                return AJS.MacroBrowser.ParameterFields["string"](param, options);
            }

            options = options || {};

            var paramDiv = $(Confluence.Templates.MacroBrowser.macroParameter());
            var input = AJS.$("input[type='text']", paramDiv);
            input.addClass("autocomplete-space")
                 .attr("data-template", "{key}")
                 .attr("data-none-message", AJS.I18n.getText("macro.browser.smartfields.not.found"));

            // CONF-16859 - check if mandatory params are now filled
            if (param.required) {
                input.keyup(AJS.MacroBrowser.processRequiredParameters);
            }
        
            input.bind("selected.autocomplete-content", function(e, data) {
              if (options.onselect) {
                  options.onselect(data.selection);
              }
              else if(options.setValue) {
                  options.setValue(data.content.key);
              }
              else {
                  updateDependencies(param.name, options.dependencies, input.val());
                  (typeof options.onchange == "function") && options.onchange.apply(input);
              }
            });
            AJS.Confluence.Binder.autocompleteSpace(paramDiv);

            return AJS.MacroBrowser.Field(paramDiv, input);
        },

        "attachment" : function (param, options) {
            if (param.multiple) {
                return AJS.MacroBrowser.ParameterFields["string"](param,
                        options);
            }

            var paramDiv = $(Confluence.Templates.MacroBrowser.macroParameterSelect());
            var input = AJS.$("select", paramDiv);

            options = options || {};
            options.setValue = options.setValue || function(value) {
                // check if the value being set is in the list of options
                // if not then add it as a new option - with an indication that
                // it is not a valid choice for this select box
                var foundOption = false;
                //Don't use a JQuery filter of "[value=" +value+"]" since value is un-escaped user-data
                input.find("option").each(function() {
                    if (this.value == value) {
                        foundOption = true;
                        return false;
                    }
                });

                if (!foundOption) {
                    input.append(AJS.$("<option/>").attr("value", value).text(value + " (" + AJS.I18n.getText("macro.browser.smartfields.not.found") + ")"));
                    input.tempValue = value;
                } else {
                    delete input.tempValue;
                }
                
                // CONF-15415 : Spurious error thrown in IE6
                try {
                    input.val(value);
                } catch (err) {
                    AJS.log(err);
                }

                input.change();
            };

            var field = AJS.MacroBrowser.Field(paramDiv, input, options);
            field.updateDependencies = updateDependencies;
            field.getData = function(req) {
            	if (!((req.title && req.spaceKey) || req.pageId || req.draftId)) {
            		AJS.log("Not enough parameters to send attachmentsearch request");
                    return;	// not enough content info to get attachments
            	}

                var currentValue = input.tempValue || input.val();

                if (options.fileTypes) {
                    req.fileTypes = options.fileTypes;
                }
                
                var url = AJS.params.contextPath + (req.draftId ? "/json/draftattachmentsearch.action" : "/json/attachmentsearch.action");
                $.getJSON(url, req, function(data) {
                    if (data.error) {
                        return;
                    }

                    $("option", input).remove();
                    var attachments = data.attachments;

                    // if there are no attachments on the page then populate the options with
                    // a message stating this
                    if (!attachments || !attachments.length) {
                        // AJS.log("attachment - No attachments so creating message. tempValue = " + input.tempValue);
                        input.append(AJS.$("<option/>").attr("value", "").html(AJS.I18n.getText("macro.browser.smartfields.no.attachments")));

                        if (input.tempValue) {
                            options.setValue(input.tempValue);
                        }
                    } else {
                        for (var i = 0, length = attachments.length; i < length; i++) {
                            input.append(AJS.$("<option/>").attr("value", attachments[i].name).text(attachments[i].name));
                        }

                        currentValue = currentValue || input.tempValue;
                        options.setValue(currentValue || attachments[0].name);
                    }
                    //in IE9 only the first character of the selected option is shown, force a redraw
                    input.attr("style", "");
                });
            };

            return field;
        },

        "confluence-content" : function (param, options) {
    
            // If multiple confluence-content field then only return a String at the moment
            if (param.multiple) {
                return AJS.MacroBrowser.ParameterFields["string"](param, options);
            }

            options = options || {};
            param.options = param.options || {};

            var paramDiv = $(Confluence.Templates.MacroBrowser.macroParameter()),
                input = AJS.$("input[type='text']", paramDiv)
                        .attr("data-none-message", AJS.I18n.getText("macro.browser.smartfields.not.found"))
                        .attr("data-template", ""); // no template as some logic is required to build the value

            // CONF-16859 - check if mandatory params are filled on keypresses in this field.
            if (param.required) {
                input.keyup(AJS.MacroBrowser.processRequiredParameters);
            }

            // CONF-15438 - update any dependencies of the field when it is changed
            options.onchange = options.onchange || function (e) {
                var val = input.val();
                updateDependencies(param.name, options.dependencies, val);
            };
            options.setValue = options.setValue || function (value) {
                input.val(value);
                (typeof options.onchange == "function") && options.onchange.apply(input);
            };
            
            input.bind("selected.autocomplete-content", function(e, data) {
                var datePathPrefix = "";
                if (param.options.includeDatePath == "true" && data.content.type == "blogpost") {
                    var splitDate = data.content.createdDate.date.split("-");
                    datePathPrefix = "/" + splitDate[0] + "/" + splitDate[1]  + "/" + splitDate[2].substring(0, 2) + "/";
                }

                var spaceKey = data.content.space && data.content.space.key,
                    markup = ((spaceKey && spaceKey != AJS.Meta.get('space-key')) ? (spaceKey + ":") : "") + datePathPrefix + data.content.title;

                input.val(markup);

                if (options.onselect) {
                  options.onselect(data.selection);
                }
                else {
                  options.setValue(markup, input);
                }
            });

            if (param.options.spaceKey) {
                if (param.options.spaceKey.toLowerCase() == "@self") {
                    param.options.spaceKey = AJS.Meta.get('space-key');
                }
                input.attr("data-spacekey", param.options.spaceKey);
            }

            var type = param.options.type;
            if (typeof type == "string") {
                if(type == "page") {
                    input.addClass("autocomplete-page");
                    AJS.Confluence.Binder.autocompletePage(paramDiv);
                }
                else if (type == "blogpost") {
                    input.addClass("autocomplete-blogpost");
                    AJS.Confluence.Binder.autocompleteBlogpost(paramDiv);
                }
                else if (type == "attachment") {
                    input.addClass("autocomplete-attachment");
                    AJS.Confluence.Binder.autocompleteAttachment(paramDiv);
                }
            }
            else { // default to pages and blogs
                input.addClass("autocomplete-confluence-content");
                AJS.Confluence.Binder.autocompleteConfluenceContent(paramDiv);
            }

            return AJS.MacroBrowser.Field(paramDiv, input, options);
        },
    
        /**
         * Default field for all unknown types.
         */
        "string" : function (param, options) {

            var paramDiv = $(Confluence.Templates.MacroBrowser.macroParameter());
            var input = $("input", paramDiv);

            if (param.required) {
                input.keyup(AJS.MacroBrowser.processRequiredParameters);
            }

            return AJS.MacroBrowser.Field(paramDiv, input, options);
        },

        /**
         * A checkbox - assumes not true means false, not null.
         */
        "boolean" : function (param, options) {

            var paramDiv = $(Confluence.Templates.MacroBrowser.macroParameterBoolean());
            var input = $("input", paramDiv);

            options = options || {};
            options.setValue = options.setValue || function (value) {
                if (/true/i.test(value) ||
                    (/true/i.test(param.defaultValue) && !(/false/i).test(value))) {
                    input.attr("checked", "checked");
                }
            };

            return AJS.MacroBrowser.Field(paramDiv, input, options);
        },

        "enum" : function (param, options) {
            if (param.multiple) {
                return AJS.MacroBrowser.ParameterFields["string"](param, options);
            }

            var paramDiv = $(Confluence.Templates.MacroBrowser.macroParameterSelect());
            var input = $("select", paramDiv);
            if (!(param.required || param.defaultValue)) {
                input.append(AJS.$("<option/>").attr("value", ""));
            }
            $(param.enumValues).each(function() {
                input.append(AJS.$("<option/>").attr("value", this).html("" + this));
            });

            return AJS.MacroBrowser.Field(paramDiv, input, options);
        },

        /**
         * Like a "string" field but hidden.
         */
        "_hidden" : function (param, options) {

            var paramDiv = $(Confluence.Templates.MacroBrowser.macroParameterHidden()).hide();
            var input = $("input", paramDiv);

            return AJS.MacroBrowser.Field(paramDiv, input, options);
        }
    
    };
})(AJS.$);