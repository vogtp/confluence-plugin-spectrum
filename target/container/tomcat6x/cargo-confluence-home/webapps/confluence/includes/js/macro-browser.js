AJS.MacroBrowser = (function($) {

    /**
     * Stores overridden JS behaviour for particular macros.
     * This map contains override objects keyed by macro name.
     *
     * Use the getMacroJsOverride and setMacroJsOverride methods to interact with this map.
     */
    var jsOverrides = {};
    
    return {

    hasInit: false,
    metadataList : [],
    aliasMap: {}, // maps each alias to the corresponding macro name
    fields: {}, // stores fields for a given macro form.

    /**
     * @deprecated Since 3.3. Macros is an ambiguous name, use getMacroJsOverride and setMacroJsOverride.
     */
    Macros: jsOverrides,

    getMacroJsOverride: function (macroName) {
        return jsOverrides[macroName];
    },

    setMacroJsOverride: function (macroName, override) {
        return jsOverrides[macroName] = override;
    },
    
    
    // converts wiki markup into a macro object
    parseMacro : function(macroMarkup) {
        var macroParts = macroMarkup.match(/(\{(.+?)(?::(.*?(?=[^\\]\}).)?)?\})(?:((?:\n|.)*?)\{\2\})?/);
        var macro = {
            markup:     macroParts[0], // entire macro markup
            startTag:   macroParts[1], // full start tag
            name :      macroParts[2], // macro name
            paramStr:   macroParts[3],
            bodyMarkup: macroParts[4], // macro bodyMarkup text
            params: {}
        };
        if (macro.markup) {
            var beforeAndAfter = macroMarkup.split(macro.markup);
            macro.beforeTag = beforeAndAfter[0];
            macro.afterTag = beforeAndAfter[1];
        }
        if (macro.paramStr) {
            var paramStrs = macro.paramStr.split("|");
            $(paramStrs).each(function(i, param) {
                var index = param.indexOf("=");
                if (index < 0 && !macro.params[""]) { // unnamed parameter
                    macro.params[""] = param;
                }
                else {
                    macro.params[param.substring(0, index)] = param.substring(index+1);
                }
            });
        }
        return macro;
    },

    // Creates a div for a single macro parameter.
    makeParameterDiv : function(metadata, param, jsOverride) {
        var t = this, field;
        var type = param.type.name;

        // Plugin point - other JS files can define more specific field-builders based on macro name, param name and
        // type.
        if (jsOverride) {
            var builder = jsOverride.fields && jsOverride.fields[type];
            if (builder && typeof builder != "function") {
                // Types can be overridden for specific parameters - so the "type" object contains a "name" function.
                builder = builder[param.name];
            }
            if (typeof builder == "function") {
                field = builder.call(jsOverride, param);
            }
        }
        // If no override specific to the macro, look for general overrides specific to the parameter type.
        if (!field) {
            if (!(type in t.ParameterFields && typeof t.ParameterFields[type] == "function")) {
                type = "string";
            }
            field = t.ParameterFields[type](param);
        }

        t.fields[param.name] = field;
        var paramDiv = field.paramDiv;
        var input = field.input;

        var paramId = "macro-param-" + param.name;
        paramDiv.attr("id", "macro-param-div-" + param.name);
        input.addClass("macro-param-input").attr("id", paramId);
        if(param.hidden) {
            paramDiv.hide();
        }

        // Use param label and desc or correct fallback.
        var pluginKey = metadata.pluginKey;
        if (param.displayName == t.makeDefaultKey(pluginKey, metadata.macroName, "param", param.name, "label")) {
            param.displayName = param.name;
        }
        if (param.description == t.makeDefaultKey(pluginKey, metadata.macroName, "param", param.name, "desc")) {
            param.description = "";
        }

        var labelText = param.displayName;
        if (param.required) {
            labelText += " *";
            paramDiv.addClass("required");  // set class against div, not input, to allow styling of label if nec
        }
        $("label", paramDiv).attr("for", paramId).text(labelText);

        if (param.description) {
            paramDiv.append(Confluence.Templates.MacroBrowser.macroParameterDesc({ description: param.description }));
        }
        return paramDiv;
    },
    // Creates a div for a macro body.
    makeBodyDiv : function(macroBodyFormComponent, macroDefinition) {
        var t = AJS.MacroBrowser,
            bodyDiv = $(Confluence.Templates.MacroBrowser.macroBody()), bodyTextareaValue;

        if (macroDefinition) { // we are editing an existing macro
            bodyTextareaValue = macroDefinition.body;
        } else { // check if there is selected text in the editor
            bodyTextareaValue = t.settings.selectedText;
        }

        $("textarea", bodyDiv).val(bodyTextareaValue || "");

        if (macroBodyFormComponent.label) {
            $("label", bodyDiv).text(macroBodyFormComponent.label);
        }
        if (macroBodyFormComponent.description) {
            bodyDiv.append(Confluence.Templates.MacroBrowser.macroParameterDesc({ description: macroBodyFormComponent.description }));
        }
        if(macroBodyFormComponent.hidden) {
            bodyDiv.hide();
        }
        return bodyDiv;
    },
    // Checks and returns true if all the required macro parameters have values.
    // It disables the insert/preview buttons if false.
    processRequiredParameters: function() {
        var blankRequiredInputs = $("#macro-insert-container .macro-param-div.required .macro-param-input")
        .filter(function() {
            var val = $(this).val();
            return (val == null || val == "");
        });
        var hasAllRequiredData = (blankRequiredInputs.length == 0);
        var disabled = hasAllRequiredData ? "" : "disabled";
        var classFn = disabled ? "addClass" : "removeClass";

        AJS.$("#macro-browser-dialog button.ok").attr("disabled", disabled);
        AJS.$("#macro-browser-dialog .macro-preview-header .refresh-link").attr("disabled", disabled)[classFn]("disabled");

        return hasAllRequiredData;
    },

    /**
     * Called when a parameter field value changes.
     */
    paramChanged: function () {
        // TODO - Could be used to preview?
        AJS.MacroBrowser.processRequiredParameters();
    },

    // Loads the given macro json in the browser's insert macro page.
    loadMacroInBrowser : function(metadata, mode) {
        if (!metadata || !metadata.formDetails) {
            alert(AJS.I18n.getText("macro.browser.unknown.macro.message"));
            return;
        }

        var t = AJS.MacroBrowser,
            detail = metadata.formDetails,
            macroName = detail.macroName,
            jsOverride = jsOverrides[macroName],
            selectedMacro = t.settings.selectedMacro,
            placeHolderTitle = mode=="edit" ? t.editTitle : t.insertTitle,
            selectedMacroElement = tinymce.confluence.macrobrowser.editedMacroDiv;

        if (macroName){
            var jsOverride = t.getMacroJsOverride(macroName);
            if (jsOverride && typeof jsOverride.opener == "function"){
                t.close();
                jsOverride.opener({ name: macroName });
                return;
            }
        }

        $("#save-warning-span").addClass("hidden"); // gadgets may have put it in this state
        AJS.MacroBrowser.dialog.gotoPage(1).addHeader(placeHolderTitle.replace(/\{0\}/, metadata.title));

        // Update the button label
        var okButton = AJS.$("#macro-browser-dialog .dialog-button-panel .ok");
        if (mode == "edit") {
            okButton.text(AJS.I18n.getText("save.name"));
        } else {
            okButton.text(AJS.I18n.getText("insert.name"));
        }

        // Macro description and documentation link
        AJS.$("#macro-insert-container .macro-name").val(macroName);
        var macroDescription = metadata.extendedDescription ? metadata.extendedDescription : metadata.description;
        var macroDesc = $(Confluence.Templates.MacroBrowser.macroDescription({ description: macroDescription })),
            macroDiv = $("#macro-insert-container .macro-input-fields").html(macroDesc);
        if (detail.documentationUrl) {
            var doco = $(Confluence.Templates.MacroBrowser.macroDocLink({ href: detail.documentationUrl}));
            macroDesc.append(doco);
        } else if (!macroDesc.text()) { // remove the div and its padding style
            macroDesc.remove();
        }

        if (detail.body && detail.body.bodyType != "NONE" && (selectedMacroElement && AJS.$(selectedMacroElement).hasClass("editor-inline-macro"))) { // only enable editing of the body in the macro browser for inline body macros
            var pluginKey = metadata.pluginKey;
            if (detail.body.label == t.makeDefaultKey(pluginKey, macroName, "body", "label")) {
                detail.body.label = "";
            }
            if (detail.body.description == t.makeDefaultKey(pluginKey, macroName, "body", "desc")) {
                detail.body.description = "";
            }
            var body = t.makeBodyDiv(detail.body, t.selectedMacroDefinition);
            if (body) {
                macroDiv.append(body);
            }
        }

        // Parameters may have dependencies so all fields need to be created before values are set.
        $(detail.parameters).each(function() {
            macroDiv.append(t.makeParameterDiv(metadata, this, jsOverride));
        });

        var selectedParams = selectedMacro ? $.extend({}, selectedMacro.params) : {}; // make a copy

        // Fully-implemented macros may have JS overrides defined in a Macro object.
        if (jsOverride && typeof jsOverride.beforeParamsSet == "function") {
            selectedParams = jsOverride.beforeParamsSet(selectedParams, !selectedMacro);
        }

        $(detail.parameters).each(function() {
            var param = this,
                    value;

            if (param.name == "") {
                value = t.selectedMacroDefinition ? t.selectedMacroDefinition.defaultParameterValue : param.defaultValue;
            } else {
                value = selectedParams[param.name];
            }

            if (value != null) {
                delete selectedParams[param.name];
            } else {
                // try looking for aliased parameters
                $(param.aliases).each(function() {
                    if (selectedParams[this]) {
                        value = selectedParams[this];
                        delete selectedParams[this];
                    }
                });
            }
            if (value == null) {
                value = param.defaultValue;
            }
            if (value != null) {
                t.fields[param.name].setValue(value);
            }
        });

        // Any remaining "selectedParameters" are unknown for the current Macro details.
        t.unknownParams = selectedParams;

        // open all links in a new window
        $("a", macroDiv).click(function() {
            window.open(this.href, '_blank').focus();
            return false;
        });

        if (!$("#macro-browser-dialog:visible").length) {
            t.showBrowserDialog();
        }

        var $firstInput = $(":input:visible:first", macroDiv);
        if ($firstInput.length) {
            $firstInput.focus();
            if (!t.selectedMacroDefinition && $firstInput.val() != "") {
                // prefilled data in new macro form - select first field for easy overwrite.
                $firstInput.select();
            }
        }
        
        var macroData = {};
        $.extend(true, macroData, metadata); // clone the metadata to a new object
        
        // for safety ensure that we have a 'formDetails', containing a body.
        if (!macroData.formDetails) macroData.formDetails = {};
        if (!macroData.formDetails.body) macroData.formDetails.body = {};
        
        t.dialog.activeMetadata = macroData; // This is important to getMacroBody.

        // do we have have selected text for the macro body or are we editing an existing macro (in which case any selected text is ignored)
        if (t.settings.selectedMacro) {
            macroData.formDetails.body.content = t.settings.selectedMacro.body;
        } else if (macroData.formDetails.body.bodyType && macroData.formDetails.body.bodyType.toLowerCase() == "plain_text") {
            macroData.formDetails.body.content = t.settings.selectedText;
        } else {
            macroData.formDetails.body.content = t.settings.selectedHtml;
        }

        t.previewMacro(macroData); // load preview with default params
    },

    makeParamStringFromMap : function(paramMap) {
        var strs = [];

        if (paramMap[""]) {
            strs.push(paramMap[""]); // no named param must be first
            delete paramMap[""]; // todo find out why this delete is here
        }

        for (var param in paramMap) {
            strs.push(param + "=" + paramMap[param]);
        }

        return strs.join("|");
    },

    // Constructs the macro markup from the insert macro page
    getMacroDefinitionFromForm : function(metadata) {
        var macroName = $("#macro-insert-container .macro-name").val(),
            defaultParameterValue,
            t = AJS.MacroBrowser,
            paramMap = {},
            sharedParamMap = {},
            paramDetails = metadata.formDetails.parameters;

        // Get parameter markup
        $(paramDetails).each(function() {
            var paramInput = AJS.$("#macro-param-" + this.name);
            var paramVal = paramInput.val();
            if (paramInput.attr("type") == "checkbox") {
                paramVal = "" + paramInput.attr("checked");
            }
            if (this.shared && paramVal) {
                sharedParamMap[this.name] = paramVal;
            }
            else if (paramVal && (this.hidden || (!this.defaultValue || this.defaultValue != paramVal))) { // only add the parameter value if its not the default
                if (this.name == "") {
                    defaultParameterValue = paramVal;
                } else {
                    paramMap[this.name] = paramVal;
                }
            }
        });
        if (t.unknownParams) {
            $.each(t.unknownParams, function(key, value) {
                paramMap[key] = value; // TODO - can do this better with extend? dT
            });
        }
        var jsOverride = jsOverrides[macroName];
        if (jsOverride && typeof jsOverride.beforeParamsRetrieved == "function") {
            paramMap = jsOverride.beforeParamsRetrieved(paramMap, metadata, sharedParamMap);
        }

        var theBodyHtml = t.getMacroBody();

        var res = {
            name : macroName,
            bodyHtml : theBodyHtml,
            params : paramMap,
            defaultParameterValue: defaultParameterValue
        };

        return res;
    },

    /**
     * Returns a Map of all parameter values from the form, including the default parameter value which has a zero
     * length string as a key.
     * @param macroParamDetails meta data about each parameter in the macro
     */
    getMacroParametersFromForm : function(macro) {
        var macroParamDetails = macro.formDetails.parameters,
            macroName = $("#macro-insert-container .macro-name").val(),
            t = AJS.MacroBrowser,
            paramMap = {},
            sharedParamMap = {};

        // Get parameter markup
        $(macroParamDetails).each(function() {
            var paramInput = AJS.$("#macro-param-" + this.name);
            var paramVal = paramInput.val();
            if (paramInput.attr("type") == "checkbox") {
                paramVal = "" + paramInput.attr("checked");
            }

            if (paramVal && (this.hidden || (!this.defaultValue || this.defaultValue != paramVal))) { // only add the parameter value if its not the default
                paramMap[this.name] = paramVal;
            }

            if (this.shared && paramVal) {
                sharedParamMap[this.name] = paramVal;
            }
            /*
             if (paramInput.attr("type") == "checkbox") {
             paramVal = "" + paramInput.attr("checked");
             }
             else if (paramVal && (this.hidden || (!this.defaultValue || this.defaultValue != paramVal))) { // only add the parameter value if its not the default
             paramMap[this.name] = paramVal;
             }
             */
        });
        if (t.unknownParams) {
            $.each(t.unknownParams, function(key, value) {
                paramMap[key] = value; // TODO - can do this better with extend? dT
            });
        }
        var macroConfig = t.getMacroJsOverride(macroName);
        if (macroConfig && typeof macroConfig.beforeParamsRetrieved == "function") {
            paramMap = macroConfig.beforeParamsRetrieved(paramMap, macro, sharedParamMap);
        }

        return paramMap;
    },

    // Makes an ajax request to render the macro markup and updates the preview
    previewMacro : function(macro) {
        var t = AJS.MacroBrowser;
        $("#macro-insert-container .macro-preview").html("");
        if (!t.processRequiredParameters()) {
            AJS.log("previewMacro: missing required params");
            return;
        }
        AJS.log("previewMacro: required params ok");
        t.showPreviewWaitImage(true);

        var params = t.getMacroParametersFromForm(macro),
            defaultParameterValue;

        var macroConfig = t.getMacroJsOverride(macro.macroName);
        if (macroConfig && typeof macroConfig.updateMacroParametersForPreview == "function") {
            params = macroConfig.updateMacroParametersForPreview(params);
        }

        if (params[""])
        {
            defaultParameterValue = params[""];
            delete params[""];
        }

        var macroForServer = {
            name: macro.formDetails.macroName,
            body : t.getMacroBody(),
            params: params,
            defaultParameterValue: defaultParameterValue
        };

        $.ajax({
            type: "POST",
            contentType: "application/json; charset=utf-8",
            url: AJS.params.contextPath + "/rest/tinymce/1/macro/preview",
            data: AJS.$.toJSON({
                contentId: Confluence.Editor.getContentId(),
                macro: macroForServer
            }),
            dataType: "html",
            success: function(html) {
                AJS.MacroBrowser.showPreviewWaitImage(false);
                // Set the iframe source to an empty JS statement to avoid secure/nonsecure warnings on https, without
                // needing a back-end call.
                var src = AJS.params.staticResourceUrlPrefix + "/blank.html";
                var previewDiv = AJS.$("#macro-insert-container .macro-preview");

                previewDiv.html('<iframe src="' + src + '" frameborder="0" name="macro-browser-preview-frame" id="macro-preview-iframe"></iframe>');

                AJS.log("previewMacro: Created iframe");
                var iframe = AJS.$("#macro-insert-container .macro-preview iframe")[0];
                var doc = iframe.contentDocument || iframe.contentWindow.document;
                doc.write(html);
                doc.close(); // for firefox
                var errorSpan = $("div.error span.error", doc);
                if (errorSpan.length) {
                    AJS.log("Error rendering macro definition : ");
                    AJS.log(macroForServer);
                }

                AJS.log("previewMacro: rendered");
            }
        });
    },
    showPreviewWaitImage : function(flag) {
        if (flag) {
            $("#macro-browser-preview-link").attr("disabled", true).addClass("disabled");
            var throbber = AJS("div").addClass("macro-loading");
            $("#macro-browser-preview").append(throbber);
            AJS.MacroBrowser.previewSpinner = Raphael.spinner(throbber[0], 60, "#666");
            AJS.MacroBrowser.previewSpinner.throbber = throbber;
        } else if (AJS.MacroBrowser.previewSpinner) {
            $("#macro-browser-preview").removeClass("macro-loading");
            AJS.MacroBrowser.previewSpinner();
            AJS.MacroBrowser.previewSpinner.throbber.remove();
            delete AJS.MacroBrowser.previewSpinner;
            $("#macro-browser-preview-link").attr("disabled", false).removeClass("disabled");
        }
    },
    // This gets called on the preview window's onload to re-adjust the height of the frame
    previewOnload: function(body) {
        var selectedMacroName = AJS.MacroBrowser.dialog.activeMetadata.macroName;
        var jsOverride = jsOverrides[selectedMacroName];
        if (jsOverride && jsOverride.postPreview) {
            jsOverride.postPreview(AJS.$("#macro-preview-iframe")[0], AJS.MacroBrowser.dialog.activeMetadata);
        }
        AJS.Editor.disableFrame(body);
        // open all links in a new window
        $(body).click(function(e) {
            if (e.target.tagName.toLowerCase() === "a") {
                var a = e.target;
                var link = $(a).attr("href");
                if (link && link.indexOf("#") != 0 && link.indexOf(window.location) == -1) {
                    window.open(link, '_blank').focus();
                }
                return false;
            }
        });
    },

    /**
     * Returns the macro metadata object for a given macro name.
     *
     * Call jsOverride.getMacroDetailsFromSelectedMacro instead of this method for macros such as "gadget" that map
     * multiple macros to a single name.
     *
     * @param macroName macro name to search metadata for
     */
    getMacroMetadata: function (macroName) {
        for (var i = 0, len = this.metadataList.length; i < len; i++) {
            var metadata = this.metadataList[i];
            if (metadata.macroName == macroName) {
                return metadata;
            }
        }
        return null;
    },

    /**
     * Called when the user either clicks the Macro Browser button or clicks Edit in a
     * macro placeholder in the RTE.
     *
     * Note that the macro browser is not initialsed/loaded until opened for the first time.
     *
     * @param settings macro browser settings include:
     *      presetMacroMetadata : the metadata for a preset macro to load into the macro browser
     *      selectedHtml : string of selected HTML from RTE when no macro selected
     *      selectedText: the text contents of the selected HTML from the RTE when no macro selected
     *      onComplete : function to call when Macro Browser's "Insert" button is pressed
     *      onCancel : function to call when Macro Browser is closed when incomplete
     *      searchText : text to filter on if opening to the "Select Macro" page, if omitted no filter is done
     *      selectedCategory: the category name that should be selected by default
     */
    open : function(settings) {
        if (!settings) {
            settings = {};
            AJS.log("No settings to open the macro browser.");
        }
        var t = AJS.MacroBrowser;
        
        // if there is a custom editor for this macro, launch that instead
        var macro = settings.selectedMacro;

        if (!macro && settings.presetMacroMetadata) {
            macro = {
                name: settings.presetMacroMetadata.macroName
            }
        }
        if (macro && macro.name){
            var jsOverride = t.getMacroJsOverride(macro.name);
            if (jsOverride && typeof jsOverride.opener == "function"){
                jsOverride.opener(macro);
                return;
            }
        }
        
        if (!t.hasInit) { // init the macro browser for the first time
            AJS.log("init macro browser");
            t.showBrowserSpinner(true);

            if (t.initData) {
                t.initBrowser();
            }
            else { // ajax request not returned yet, set a flag to init the browser later
                t.initMacroBrowserAfterRequest = settings;
                return;
            }
        }
        t.openMacroBrowser(settings);
        
    },

    // This method must be called after the dialog has been initialised
    openMacroBrowser: function(settings) {
        var t = AJS.MacroBrowser;
        t.settings = settings;
        t.selectedMacroDefinition = settings.selectedMacro;
        var selectedMacroName = (t.selectedMacroDefinition && t.selectedMacroDefinition.name) || settings.presetMacroName;

        // Preset macro overrides everything, just use it if present
        if (settings.presetMacroName)
            settings.presetMacroMetadata = t.getMacroMetadata(settings.presetMacroName);

        var metadata = settings.presetMacroMetadata;
        if (!metadata) {
            var selectedMacro = settings.selectedMacro;
            if (selectedMacro) {
                // Editing an existing macro - find metadata for it
                var selectedMacroName = selectedMacro.name.toLowerCase();
                selectedMacroName = t.aliasMap[selectedMacroName] || selectedMacroName;

                var jsOverride = jsOverrides[selectedMacroName];
                if (jsOverride) {
                    if (typeof jsOverride.updateSelectedMacro == "function") {
                        jsOverride.updateSelectedMacro(selectedMacro);
                    }
                    // Could be a gadget (or other) macro that has a custom metadata lookup function
                    var macroDetailsFunction = jsOverride.getMacroDetailsFromSelectedMacro;
                    if (macroDetailsFunction) {
                        metadata = macroDetailsFunction(t.metadataList, selectedMacro);
                    }
                }
                if (!metadata) {
                    metadata = AJS.MacroBrowser.getMacroMetadata(selectedMacroName);
                }
            }
        }

        if (metadata) {
            AJS.log("Open macro browser to edit macro: "+ metadata.macroName);
            $("#macro-browser-dialog button.back").hide();
            t.replicateSelectMacro(metadata, settings.mode || "edit");
        }
        else if (selectedMacroName && !metadata) {
            // the user chose to edit a macro but no metadata was available
            $("#macro-browser-dialog button.back").show();
            t.dialog.overrideLastTab();
            t.dialog.gotoPage(2);
            t.showBrowserDialog();
        } else {
            $("#macro-browser-dialog button.back").show();
            if(settings.selectedCategory) {
                var categoryIndex = $('#select-macro-page .dialog-page-menu button').index($('#category-button-' + settings.selectedCategory));
                if(categoryIndex < 0) {
                    categoryIndex = 0;
                }
                t.dialog.overrideLastTab();
                t.dialog.gotoPanel(0, categoryIndex);
            }
            else {
                t.dialog.gotoPage(0);
            }
            t.showBrowserDialog();

            // If non-blank searchText has been passed in, filter on it
            var searchText = $.trim(settings.searchText);
            var searchBox = $("#macro-browser-search");
            searchBox.val(searchText).keyup();
            searchText && searchBox.removeClass("blank-search");    // needs removing so focus won't delete the text
            searchBox.focus();
        }
    },
    showBrowserDialog: function() {
        AJS.MacroBrowser.dialog.show();
        AJS.MacroBrowser.showBrowserSpinner(false);
    },
    // Called when dialog is closed by Inserting/Saving.
    complete : function (dialog) {
        if (!$("#macro-browser-dialog .dialog-button-panel .ok").is(":visible:not(:disabled)")) {
            // If triggered by enter key but not ready to complete, ignore.
            return;
        }
        var t = AJS.MacroBrowser;
        var metadata = t.dialog.activeMetadata;
        var jsOverride = jsOverrides[metadata.macroName];
        if (jsOverride && jsOverride.manipulateMarkup) {
            jsOverride.manipulateMarkup(metadata);
        }

        var macroDefinition = t.getMacroDefinitionFromForm(metadata);

        t.close();
        if (t.settings.onComplete) {
            t.settings.onComplete(macroDefinition);
        }
    },
    // Called when dialog is closed by various cancel buttons or via Esc key.
    cancel : function() {
        var t = AJS.MacroBrowser;
        t.close();
        if (typeof t.settings.onCancel == "function") {
            t.settings.onCancel();
        }
        return false;
    },
    close : function() {
        var t = this;
        t.unknownParams = {};
        t.fields = {};
        t.dialog.hide();
    },
    // Replicates the user behaviour of selecting a macro and displaying the insert macro page
    replicateSelectMacro : function (metadata, mode) {
        AJS.MacroBrowser.loadMacroInBrowser(metadata, mode);
    },
    makeDefaultKey : function() {
        return $.makeArray(arguments).join(".");
    },
    showBrowserSpinner: function(flag) {
        var elm = AJS.Editor.inRichTextMode() ? ".defaultSkin span.mce_conf_macro_browser" : "#editor-insert-macro";
        if (flag) {
            $(elm).addClass("wait");
        } else {
            $(elm).removeClass("wait");
        }
    },
    // Loads the categories and macros into the dialog
    initBrowser : function() {
        var t = AJS.MacroBrowser,
            data = t.initData;
        if (!data.categories || !AJS.MacroBrowser.metadataList.length) {
            alert(AJS.I18n.getText("macro.browser.load.error.message"));
            AJS.MacroBrowser.showBrowserSpinner(false);
            return false;
        }
        var startTime = new Date();
        var dialog = t.dialog = AJS.ConfluenceDialog({
            width : 865,
            height: 530,
            id: "macro-browser-dialog",
            onSubmit: t.complete,
            onCancel: t.cancel
        });

        // Set an id on the "Select Macro Page"
        dialog.getPage(0).element.attr('id','select-macro-page');

        dialog.addHeader(data.title);
        t.editTitle = data.editTitle;
        t.insertTitle = data.insertTitle;

        // sort the categories and macros
        // Skip the hidden category unless option is set, in which case append it to end of array.
        var hiddenCat;
        data.categories = $.map(data.categories, function (cat) {
            if (cat.name == "hidden-macros") {
                hiddenCat = cat;
                return null;
            }
            return cat;
        });
        data.categories.sort(function(one, two) {
            return (one.displayName.toLowerCase() > two.displayName.toLowerCase() ? 1 : -1);
        });
        if (hiddenCat && AJS.params.showHiddenUserMacros) {
            data.categories.push(hiddenCat);
        }

        var makeCategoryList = function(id) {
            return $(Confluence.Templates.MacroBrowser.macroSummaryList({ category: id }));
        };
        var makeMacroSummary = function(metadata) {
            var macroDiv = $(Confluence.Templates.MacroBrowser.macroSummaryItem())
            .click(function(e) {
                AJS.MacroBrowser.loadMacroInBrowser(metadata, "insert");
            });
            if (metadata.icon) {
                var iconLocation = (metadata.icon.relative ? AJS.params.staticResourceUrlPrefix : "") + metadata.icon.location;
                if(!metadata.icon.relative && AJS.$.browser.msie && !window.location.href.indexOf("https") && iconLocation.indexOf("https")) {
                    macroDiv.prepend("<span class='macro-icon-holder icon-" + metadata.macroName + "'></span>");
                }
                else {
                    macroDiv.prepend("<img src='" +  iconLocation + "' alt='icon' " +
                        "width='" + metadata.icon.width + "' height='" + metadata.icon.height + "' title='" + metadata.title + "'/>");
                }
            } else {
                macroDiv.prepend("<span class='macro-icon-holder icon-" + metadata.macroName + "'></span>");
            }

            $(".macro-title", macroDiv).text(metadata.title);
            $(".macro-desc", macroDiv).prepend(metadata.description);
            if (metadata.macroName == "gadget") {
                var url;
                for (var i = 0; i < metadata.formDetails.parameters.length; i++) {
                    if (metadata.formDetails.parameters[i].name == "url") {
                        url = encodeURI(metadata.formDetails.parameters[i].defaultValue);
                        break;
                    }
                }
                if (url) {
                    if (!url.match("^https?://.*")) {
                        url = AJS.params.contextPath + "/" + url;
                    }
                    $(".macro-title", macroDiv).after(Confluence.Templates.MacroBrowser.gadgetLink({url: url}));
                }
            }
            return macroDiv;
        };
        var categoryDivs = { all: makeCategoryList("all") },
            i, ii, j, jj;

        // Content on the right, setup macro list items
        for (i = 0, ii = t.metadataList.length; i<ii; i++) {
            var metadata = t.metadataList[i];
            if (metadata.hidden) {
                if (t.isHiddenMacroShown(metadata)) {
                    metadata.categories.push("hidden-macros");
                } else {
                    continue;
                }
            }

            var macroDiv = makeMacroSummary(metadata).attr("id", metadata.id);
            categoryDivs.all.append(macroDiv);

            for (j = 0, jj = metadata.categories.length; j < jj; j++) {
                var catKey = metadata.categories[j];
                categoryDivs[catKey] = categoryDivs[catKey] || makeCategoryList(catKey);
                categoryDivs[catKey].append(makeMacroSummary(metadata).attr("id", catKey + "-" + metadata.id));
            }
        }

        // menu on the left, setup category panels
        dialog.addPanel(AJS.I18n.getText("macro.browser.category.all"), categoryDivs["all"], "all", "category-button-all");
        for (i = 0, ii = data.categories.length; i < ii; i++) {
            var category = data.categories[i];
            dialog.addPanel(category.displayName, categoryDivs[category.name] || makeCategoryList(category.name), category.name, "category-button-" + category.name)
              .getPanel(i).setPadding(0); // remove the default dialog padding
        }
        dialog.addCancel(AJS.I18n.getText("cancel.name"), AJS.MacroBrowser.cancel);
        dialog.popup.element.find(".dialog-title").append(Confluence.Templates.MacroBrowser.helpLink());
        dialog.addHelpText(AJS.I18n.getText("macro.browser.shortcut.tip"));

        // prepare insert macro page
        var insertMacroBody = AJS.$(Confluence.Templates.MacroBrowser.insertMacroPanel());

        $("#macro-browser-preview-link", insertMacroBody).click(function(e) {
            AJS.MacroBrowser.previewMacro(dialog.activeMetadata);
            return AJS.stopEvent(e);
        });

        dialog.addPage()
        .addPanel("X", insertMacroBody, "macro-input-panel")
        .addLink(AJS.I18n.getText("macro.browser.title"), function(dialog) {
            dialog.prevPage();
            $("#macro-browser-search").focus();
        }, "dialog-back-link")
        .addButton("insert.name", function () { AJS.MacroBrowser.complete(); }, "ok")
        .addCancel(AJS.I18n.getText("cancel.name"), function () { return AJS.MacroBrowser.cancel(); })
        .getPanel(0).setPadding(0); // remove the default dialog padding
        $("#macro-browser-dialog .dialog-button-panel .ok").before("<span id='save-warning-span' class='hidden'/>");

        var filterSearch = function(text) {
            var ids = null;
            if (text != '') {
                if (dialog.getCurrentPanel() != dialog.getPanel(0)) {
                    dialog.gotoPanel(0);
                }
                var filteredSummaries = t.searchSummaries(text);
                ids = {};
                $.each(filteredSummaries, function() {
                    ids[this.id] = this;
                });
            }
            $("#macro-browser-dialog .dialog-panel-body #category-all .macro-list-item").each(function() {
                (!ids || this.id in ids) ? $(this).show() : $(this).hide();
            });
        };

        // add search box
        var searchForm = $("<form id='macro-browser-search-form'><input type='text'/></form>");
        var searchInput = $("input", searchForm)
            .attr("id", "macro-browser-search")
            .keyup(function(e) {
                filterSearch($.trim(searchInput.val()));
            })
            .focus(function(e) {
                var searchInput = $(e.target);
                if (searchInput.hasClass("blank-search")) {
                    searchInput.removeClass("blank-search").val("");
                }
                e.target.select();
            })
            .blur(function (e) {
                var searchInput = $(e.target);
                if ($.trim(searchInput.val()) == "") {
                    searchInput.addClass("blank-search").val(AJS.I18n.getText("search.name"));
                }
            })
            .blur();
        searchForm.submit(function(e) {
            var filteredMacros = $("#macro-browser-dialog .dialog-panel-body #category-all .macro-list-item:visible");
            if ($.trim(searchInput.val()) != "" && filteredMacros.length == 1) {
                // Only one macro found with search - select it.
                filteredMacros.click();
            }
            return AJS.stopEvent(e);
        });
        dialog.page[0].header.append(searchForm);
        dialog.page[0].ontabchange = function(newPanel, oldPanel) {
            if (newPanel != dialog.getPanel(0, 0)) {
                // Moving away from the "All" macro panel; reset the search value if present
                if (!searchInput.hasClass("blank-search")) {
                    searchInput.val('').blur();
                }
                filterSearch("");
            }
        };

        // Create the missing meta-data page
        var missingMetadataBody = AJS.$(Confluence.Templates.MacroBrowser.missingUserMacroMetadataPanel({ showAdminMessage: AJS.Meta.getBoolean("is-admin") }));
        dialog.addPage()
        .addPanel(AJS.I18n.getText("macro.browser.missing.metadata.title"), missingMetadataBody, "missing-metadata-panel")
        .addLink(AJS.I18n.getText("macro.browser.back.button"), function(dialog) {
            dialog.gotoPage(0);
            $("#macro-browser-search").focus();
        }, "dialog-back-link")
        .addCancel(AJS.I18n.getText("cancel.name"), function () { return AJS.MacroBrowser.cancel(); });      
        dialog.gotoPage(2);
        dialog.addHeader(AJS.I18n.getText("macro.browser.missing.metadata.title"));
        
        dialog.gotoPanel(0, 0);
        dialog.ready = true;
        t.hasInit = true;

        var time = (new Date()).getTime() - startTime.getTime();
        AJS.log("loading macro browser took " + time + "ms");
        return true;
    },

    /**
     * Called when the macro data is returned from the back-end, loads the macro metadata into a JS model for the
     * browser (and autocomplete) to use.
     *
     * @param macros the macros array from the browse-macros.action JSON response
     */
    loadModel: function (macros) {
        if (!macros) {
            AJS.log("AJS.MacroBrowser.loadModel - no macro data, aborting");
            return;
        }
        AJS.log("AJS.MacroBrowser.loadModel - starting");

        var t = AJS.MacroBrowser;
        t.metadataList = [];
        t.aliasMap = {};

        // Clean up unset titles and descriptions before sorting
        for (var i = 0, ii = macros.length; i < ii; i++) {
            var metadata = macros[i];

            if (metadata.aliases) {
                for (var j = 0, jl = metadata.aliases.length; j < jl; j++) {
                    metadata.aliases[j] = metadata.aliases[j].toLowerCase();
                    t.aliasMap[metadata.aliases[j]] = metadata.macroName.toLowerCase();
                }
            }

            if (metadata.title == t.makeDefaultKey(metadata.pluginKey, metadata.macroName, "label")) {
                metadata.title = metadata.macroName.charAt(0).toUpperCase() + metadata.macroName.substring(1).replace(/-/g, ' ');
            }
            if (metadata.description == t.makeDefaultKey(metadata.pluginKey, metadata.macroName, "desc")) {
                metadata.description = "";
            }
            metadata.id = "macro-" + (metadata.alternateId || metadata.macroName);

            // Store two copies of keywords - for Macro Browser and Macro Autocomplete searching
            var keywordsArr = [metadata.macroName, metadata.title].concat(metadata.aliases);
            metadata.keywordsNoDesc = keywordsArr.join(',');

            var desc = (metadata.description && metadata.description.replace(/,/g, ' ')) || "";
            keywordsArr.push(desc);
            metadata.keywords = keywordsArr.join(',');

            t.metadataList.push(metadata);
        }
        t.metadataList.sort(function(one, two) { return (one.title.toLowerCase() > two.title.toLowerCase() ? 1 : -1); });
        AJS.log("AJS.MacroBrowser.loadModel - complete, " + t.metadataList.length + " macros loaded");
    },

    /**
     * Search macro name, title and description for the given text.
     * @param text (required) text to search on
     * @param options options to pass to the AJS.filterBySearch method
     * @return array of macro summaries matching the search text.
     */
    searchSummaries: function (text, options) {
        options = $.extend({
            splitRegex: /[\s\-]+/
        }, options);
        return AJS.filterBySearch(this.metadataList, text, options);
    },

    /**
     * Convenience method to return the macro body. This will be one of -
     * - the text in the body textarea on the macro browser dialog
     * - currently selected text in the editor
     * - the current body if editing an existing macro (disregarding any editor selection)
     * - empty String if neither previous case applies.
     */
    getMacroBody: function () {
        var t = AJS.MacroBrowser;
        var body = "";
        if (AJS.$("#macro-insert-container .macro-body-div textarea").length) {
            body = AJS.$("#macro-insert-container .macro-body-div textarea").val();
        } else if (t.selectedMacroDefinition) {
            if (t.selectedMacroDefinition.body) {
                body = t.selectedMacroDefinition.body;
            }
        } else if (t.dialog.activeMetadata) {
            body = t.dialog.activeMetadata.formDetails.body.content; // this is encoded as appropriate for the current macro
        }

        return body;
    },

    /**
     * Checks if a normally-hidden macro should be displayed in the UI or not.
     * @param macro - a macro summary
     */
    isHiddenMacroShown : function (macro) {
        return AJS.params.showHiddenUserMacros && macro.pluginKey == "_-user-macro-_";
    },

    /**
     * Returns true if the metadata indicates that there are required parameters for this macro
     */
    hasRequiredParameters : function (macroMetadata) {
        var parameters = macroMetadata.formDetails.parameters;

        for (var i = 0, ii = parameters.length; i < ii; i++)
            if (parameters[i].required) return true;

        return false;
    }

};})(AJS.$);

AJS.toInit(function($) {
    // bind the function to be run when the macro browser preview frame is loaded
    $(window).bind("render-content-loaded", function(e, body) {
        var iframe = $("#macro-preview-iframe");
        if (iframe.contents().find("body")[0] == body) {
            AJS.MacroBrowser.previewOnload(body);
        }
    });

    var t = AJS.MacroBrowser;
    AJS.$.ajax({
        type: "GET",
        dataType: "json",
        url: AJS.params.contextPath + "/plugins/macrobrowser/browse-macros.action",
        success: function(data) {
            t.initData = data;
            t.loadModel(data.macros);
            if (t.initMacroBrowserAfterRequest) {
                t.initBrowser();
                t.openMacroBrowser(t.initMacroBrowserAfterRequest);
            }
        },
        error: function(e) {
            AJS.log("Error requesting macro browser metadata:");
            AJS.log(e);
            t.initData = {};
        }
    });
});
