/**
 * Activates smart fields support for a pair of Page / Attachment fields in a macro.
 * 
 * Expects the following macro parameters for the "macroName" to be defined:
 * 
 *   <parameter name="page" type="confluence-content"/>
 *   <parameter name="name" type="attachment" required="true">
 *     <alias name=""/>
 *   </parameter>
 * 
 * Usage in macro specific js file:
 *   AJS.MacroBrowser.activateAttachmentsFromPageSmartFields("multimedia", ["swf","avi"]);
 *
 * Note this function uses AJS.MacroBrowser.setMacroJsOverride for the specified macro, so
 * this will replace any existing override previous set, or this functionality will stop working
 * if an override is set after calling activateSmartFieldsAttachmentsOnPage. 
 *
 * @param macroName the name of the macro to add page/attachment smart field support to
 * @param fileTypes an array containing the file extensions to be shown
 */
(function($) {

    var MacroJsOverrideForSmartFields = function(fileTypes) {
        this.fileTypes = fileTypes;
    };

    MacroJsOverrideForSmartFields.prototype.beforeParamsSet = function(params, inserting) {
        // If the macro has no parameters set for the page, date or space set the page to the one
        // currently being edited. See beforeParamsRetrieved for the reverse.
        if (!params.page && !(params.date || params.space)) {
            if (AJS.params.contentType == "page" || AJS.params.contentType == "blogpost") {
                params.page = AJS.Editor.getCurrentTitle();
            } else if (AJS.params.contentType == "comment") {
                params.page = AJS.params.pageTitle;
            }
        }
        if (params.date) {
            // will be in format mm/dd/yyyy, should be yyyy/mm/dd
            var parts = params.date.split("/");
            params.page = ["", parts[2], parts[0], parts[1], params.page].join("/");
        }
        if (params.space) {
            params.page = params.space + ":" + params.page;
        }
        return params;
    };

    MacroJsOverrideForSmartFields.prototype.beforeParamsRetrieved = function(params) {
        if (params.page) {
            var spacePageArr = params.page.split(":");
            if (spacePageArr.length > 1) {
                params.space = spacePageArr[0];
                params.page = spacePageArr[1];
            }
            var parts = params.page.split("/");
            if (parts.length > 1) {
                // will be in format yyyy/mm/dd/Page, should be mm/dd/yyyy
                params.date = [parts[2], parts[3], parts[1]].join("/");
                params.page = parts[4];
            }
            // If the page specified is the current page being edited, remove the page title parameter.
            // Even if a user entered it manually it is good to get rid of it as the macro parameters don't handle page renames
            // See beforeParamsSet for the reverse.
            if (((AJS.params.contentType == "page" || AJS.params.contentType == "blogpost") && params.page == AJS.Editor.getCurrentTitle()) ||
                 (AJS.params.contentType == "comment" && params.page == AJS.params.pageTitle)) {
                delete params.page;
            }
        }
        return params;
    };

    MacroJsOverrideForSmartFields.prototype.fields = {
        "attachment" : function(param) {

            /**
             *  Assumes value in form SPACEKEY:(/yyyy/mm/dd/)Title
             */
            var parsePageLink = function(pageLink) {
                var o = {};

                var bits = pageLink.split(":", 2);
                o.spaceKey = ((bits.length == 2) && bits[0]) || AJS.Meta.get('space-key');
                o.title = bits[bits.length - 1];

                if (o.title.indexOf("/") == 0) {
                    // blogpost
                    o.postingDay = o.title.substr(1, 10);
                    o.title = o.title.substr(12);
                }

                // If the page title is the same as the page being edited, leave it blank and use the content Id.
                if (o.title == AJS.Editor.getCurrentTitle()) {
                    o.title = "";
                }
                if (!o.title) {
                    if (AJS.params.newPage) {
                        o.draftId = AJS.Meta.get('content-id');
                    } else {
                        o.pageId = AJS.params.pageId;
                    }
                }
                return o;
            };

            var attachmentOptions = {
                fileTypes : this.fileTypes
            }

            var field = AJS.MacroBrowser.ParameterFields["attachment"](param, attachmentOptions);

            field.dependencyUpdated = function(dependencyName, dependencyValue) {
                AJS.log("attachment:dependencyUpdated called: " + dependencyName + ", " + dependencyValue);

                var req = parsePageLink(dependencyValue);
                this.getData(req);
            };
            return field;
        },

        "confluence-content" : function(param) {
            var options = {
                dependencies : ["name"]
            };

            return AJS.MacroBrowser.ParameterFields["confluence-content"](param, options);
        }
    };

    AJS.MacroBrowser.activateSmartFieldsAttachmentsOnPage = function(macroName, fileTypes) {
        AJS.MacroBrowser.setMacroJsOverride(macroName, new MacroJsOverrideForSmartFields(fileTypes));
    }

})(AJS.$);
