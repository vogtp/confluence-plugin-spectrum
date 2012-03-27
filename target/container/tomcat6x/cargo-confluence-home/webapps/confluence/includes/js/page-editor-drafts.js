Confluence.Editor.Drafts = (function($){
    var isDraftSaved = false,
        hasUnloaded = false,
        addHiddenElement = function(name, value, appendTo) {
          $("<input>").attr({type: "hidden",name: name, value: value}).appendTo(appendTo);
        };

    var jsTime = function (date) { // dodgy time function
        var h = date.getHours();
        var m = date.getMinutes();
        var ampm = h > 11 ? "PM" : "AM";
        h = h % 12;
        return (h == 0 ? "12" : h) + ":" + (m < 10 ? "0" : "") + m + " " + ampm;
    },
    // function to send the form to discard/use the draft
    sendFormDraft = function(hiddenInput) {
         Confluence.Editor.Drafts.unBindUnloadMessage();
         var form = Confluence.Editor.getCurrentForm();
         addHiddenElement(hiddenInput, "true", form);
         addHiddenElement("contentChanged", "" + Confluence.Editor.hasContentChanged(), form);
         addHiddenElement("pageId", AJS.params.pageId, form);
         if (!form.spaceKey) {
             addHiddenElement("spaceKey", AJS.Meta.get('space-key'), form);
         }

         form.action =  (AJS.params.newPage ? "create" : "edit") + AJS.params.draftType + ".action";
         form.submit();
    };

    return {

        /**
         * Returns true if a draft has been saved.
         */
        isDraftSaved : function() {
            return isDraftSaved;
        },

        unloadMessage: function() {
            if (typeof seleniumAlert != "undefined" || AJS.DarkFeatures.isEnabled('webdriver.test.mode')) { // TODO: Find a better way to detect Selenium.
                //this is not particularly pretty but has to be done
                //unless we want to unload it then bind a specific selenium event for this.
                //this mimics the behaviour close enough
                hasUnloaded || Confluence.Editor.Drafts.save();
                hasUnloaded = true;
                return;
            }
            // You can't rely on the draft being saved before this.
            if (Confluence.Editor.hasContentChanged()) {
                if (AJS.params.saveDrafts) {
                    //this gets around safari invalidating the document on unload, so xhr requests cant be opened.
                    hasUnloaded || Confluence.Editor.Drafts.save();
                    //this bool is needed until this commit hits a jquery release
                    //http://github.com/jquery/jquery/commit/36faab439a1d3a5471847e952d0019e8e4e9b982
                    //onbeforeunload was bound twice inside jquery.
                    hasUnloaded = true;
                    return AJS.I18n.getText("saved.draft");
                }

                return AJS.I18n.getText("unsaved.comment.lost");
            }
            else if (Confluence.Editor.Drafts.isDraftSaved()) {
                return AJS.I18n.getText("saved.draft");
            }
        },
        bindUnloadMessage : function(){

            //bug introduced by jquery 1.5.2, see http://bugs.jquery.com/ticket/8755
            if ($.browser.msie) {
                window.attachEvent("onbeforeunload",  Confluence.Editor.Drafts.unloadMessage);
            }
            else {
                $(window).bind('beforeunload.editor', Confluence.Editor.Drafts.unloadMessage);
            }
        },

        unBindUnloadMessage : function() {
            if ($.browser.msie) {
                window.detachEvent("onbeforeunload",  Confluence.Editor.Drafts.unloadMessage);
            }
            else {
              $(window).unbind('beforeunload.editor');
            }
        },

        useDraft: function() {
            sendFormDraft("useDraft");
        },
        discardDraft: function() {
            sendFormDraft("discardDraft");
        },

        /**
         * Saves a draft, if content has changed and displays the draft saved message.
         * @param options
         *      onSuccessHandler : callback that is invoked on draft save success. Function should be formatted like this: function (responseData) {}
         *      onErrorHandler : callback that is invoked on draft save error. Function should be formatted like this: function (errorMessage) {}
         *      forceSave : forces a draft save even if there are no content changes (that is, AJS.Editor.hasContentChanged() == false)
         */
        save: function (options) {
            options = options || {};
            if (!AJS.params.saveDrafts || Confluence.Editor.isSubmitting || (!Confluence.Editor.hasContentChanged() && !options.forceSave)) {
                AJS.log("skipping draft save");
                return;
            }

            AJS.log("preparing to save editor draft");
            var titleField = $("#content-title"),
                newSpaceKey = $("#newSpaceKey"),
                originalVersion = $("#originalVersion"),
                resetWysiwygContent = Confluence.Editor.inRichTextMode();

            var draftData = {
                pageId : AJS.params.pageId,
                type : AJS.params.draftType,
                title : titleField.hasClass("placeholded") ? "" : titleField.val(),
                spaceKey: newSpaceKey.length ? newSpaceKey.val() : encodeURIComponent(AJS.Meta.get('space-key')),
                content : AJS.Rte.getEditor().getContent()
            };

            if (originalVersion.length) {
                draftData.pageVersion = parseInt(originalVersion.val(), 10);
            }

            var saveDraftCallback = function (data) {
                if(data == null) {
                    //webkit seems to do some odd things with the existing event queue when you unload(), despite the readystate changing to 4 and the data being present
                    //responsetext is always an empty string, however the request was a sucess so we can just fail silently.  
                    return;
                }
                Confluence.Editor.contentHasChangedSinceLastAutoSave = false;
                if (resetWysiwygContent) {
                    AJS.Rte.Content.editorResetContentChanged();
                }
                isDraftSaved = true;
                $("#draft-error").remove();

                var draftStatus = $("#draft-status"),
                    time = data.time || jsTime(new Date());

                if (AJS.params.newPage) {
                    draftStatus.html(AJS.I18n.getText("draft.saved.at.new", time));
                }
                else {
                    draftStatus.html(AJS.I18n.getText("draft.saved.at", time, "<a id='view-diff-link-heartbeat' class='view-diff-link' href='#'>", "</a>"));
                }
                if (!+AJS.Meta.get('content-id')) {
                    // Saved draft for a new page.
                    AJS.Meta.set('content-id', data.draftId);
                }
                if ($.isFunction(options.onSuccessHandler)) {
                    options.onSuccessHandler(data);
                }

                Confluence.Editor.Drafts.lastSaveTime = time;
            };

            var saveDraftErrorHandler = function (request, textStatus) {
                Confluence.Editor.addErrorMessage( "draft-error",
                    Confluence.Editor.Drafts.lastSaveTime ? AJS.I18n.getText("draft.saving.error.previous.draft", Confluence.Editor.Drafts.lastSaveTime) : AJS.I18n.getText("draft.saving.error"),
			        true // show in all modes
                );
                if ($.isFunction(options.onErrorHandler)) {
                     options.onErrorHandler(textStatus);
                }

            };

            $.ajax({
                type: "POST",
                url: AJS.params.contextPath + "/rest/tinymce/1/drafts",
                data : $.toJSON(draftData),
                contentType : "application/json",
                dataType : "text json", // "text json" instead of "json" is critical to solve CONFDEV-4799. Please read comments on this ticket if you want to change this.,
                success : saveDraftCallback,
                error : saveDraftErrorHandler,
                timeout: 30000 // 30 seconds
            });
        }
    };
})(AJS.$);


AJS.toInit(function ($) {

    Confluence.Editor.Drafts.bindUnloadMessage();

    $("#draft-messages a.use-draft").click(function(e) {
        Confluence.Editor.Drafts.useDraft();
        e.stopPropagation();
        return false;
    });
    $("#draft-messages a.discard-draft").click(function(e) {
        Confluence.Editor.Drafts.discardDraft();
        e.stopPropagation();
        return false;
    });

    if(AJS.params.saveDrafts) {
        setInterval(Confluence.Editor.Drafts.save, +AJS.params.draftSaveInterval || 30000);
    }
});
