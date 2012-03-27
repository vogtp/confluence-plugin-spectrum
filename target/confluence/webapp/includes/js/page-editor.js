AJS.log("page-editor starting");
Confluence.Editor = (function($) {

    return {
        bookmark : '',
        MODE_RICHTEXT: "richtext",
        MODE_SOURCE: "source",
        MODE_PREVIEW: "preview",

        currentEditMode: null,
        contentHasChangedSinceLastAutoSave: false,
        sourceInitialValue: false,

        //Stops the drafts from saving if the form is submitting.
        isSubmitting: false,

        hasContentChanged: function() {
            if (!this.inRichTextMode() && !this.contentHasChangedSinceLastAutoSave) {
                return false;
            }
            return this.editorHasContentChanged();
        },

        editorHasContentChanged: function() {
            //TODO bit of a hack, dies during init otherwise sometimes
            if (tinyMCE.activeEditor == null) {
                AJS.log("No TinyMCE editor present. Returning empty string in editorHasContentChanged ");
                return false;
            }
            return AJS.Rte.Content.editorHasContentChanged();
        },

        /**
         * Returns a relative URL to resume the draft saved for this page
         */
        getResumeDraftUrl: function() {
            var urlParts = [];
            urlParts.push(Confluence.getContextPath());
            urlParts.push("/pages/" + (AJS.params.newPage ? "create" : "edit") + AJS.params.draftType + ".action");
            urlParts.push("?useDraft=true");
            urlParts.push("&pageId=" + AJS.params.pageId);
            urlParts.push("&contentChanged=" + this.hasContentChanged());
            this.getCurrentForm().spaceKey && urlParts.push("&spaceKey=" + AJS.Meta.get('space-key'));
            return urlParts.join("");
        },

        /**
        * Returns the currently entered title.
        *
        * @return the current editor title, null if not in edit mode, or editing a comment (i.e. something without a title)
        */
        getCurrentTitle : function() {
            return $('#content-title') && $('#content-title').val();
        },

        /* This function will be invoked when the form gets submitted. */
        contentFormSubmit: function(e) {
            Confluence.Editor.Drafts.unBindUnloadMessage();

            // CONF-12750 Disable the title field outside the form
            // to prevent Safari 2.0 from sending the "title" field twice
            AJS.$(".editable-title #content-title").attr("disabled", "disabled");

            return true;
        },

        /**
         * When editing a page then heartbeats will double up in function and also detect concurrent edits.
         * When creating a new page 'concurrent edit' is a bit meaningless so the heartbeat will serve just
         * the single purpose of keeping the session alive.
         */
        heartbeat: function() {
            var data = {
                dataType: "json",
                contentId: AJS.params.pageId,
                draftType: AJS.params.draftType,
                spaceKey: AJS.params.spaceKey
            };
            
            if (AJS.params.pageId == "0" || AJS.params.contentType == "comment") {
                AJS.safe.post(AJS.params.contextPath + "/json/heartbeat.action", {});
            } else {
                AJS.safe.post(AJS.params.contextPath + "/json/startheartbeatactivity.action", data, function(activityResponses) {
                    var otherUsersAreEditing = activityResponses.length;
                    if (otherUsersAreEditing) {
                        var outerSpan = AJS.$("#other-users-span");
                        outerSpan.empty();
                        for (var i = 0; i < otherUsersAreEditing; ++i) {
                            if (i > 0) {
                                outerSpan.append(", ");
                            }
    
                            var activityResponse = activityResponses[i];
                            outerSpan.append(AJS('a').attr('href', AJS.params.contextPath + '/display/~' + encodeURIComponent(activityResponse.userName)).text(activityResponse.fullName));
                            if (activityResponse.lastEditMessage != null) {
                                outerSpan.append(" ").append(AJS('span').addClass('smalltext').text(activityResponse.lastEditMessage));
                            }
                        }
                    }
                    AJS.setVisible("#heartbeat-div", !!otherUsersAreEditing);
                    $(document).trigger("resize.resizeplugin");
                },
                "json");
            }
        },

        disableFrame: function(body) {
            //disable all forms, buttons and links in the iframe
            AJS.$("form", body).each(function() {
                AJS.$(this).unbind();
                this.onsubmit = function() {
                    return false;
                };
            });
            AJS.$("a", body).each(function() {
                AJS.$(this).attr("target", "_top").unbind();
            });
            AJS.$("input, img", body).each(function() {
                AJS.$(this).unbind();
            });
        },

        /* This function should be invoked when the preview frame has finished loading its content.
       It is responsible for updating the height of frame body to the actual content's height.
      */
        previewFrameOnload: function(body, iframe) {
            AJS.log("previewFrameOnload");
            Confluence.Editor.setMode(Confluence.Editor.MODE_PREVIEW);
            tinyMCE.activeEditor.setProgressState(false);
            Confluence.Editor.disableFrame(body);
            var content = AJS.$("#main", body)[0];

            if(AJS.Meta.get("content-type") != "comment" && AJS.$(content).find("#main-header").length == 0) {
                AJS.$(content).prepend('<div id="preview-header"><h1 class="pagetitle">' + AJS.$('#title-heading').html() + "</h1></div>");
            }

            /* CONFDEV-6350 If there are no error messages to be displayed then do not display
               The #editor-precursor div
             */
            if($('#all-messages').children().length < 1) {
                $('#editor-precursor').css({'display': 'none'});
            }

            if (AJS.Rte.getEditorContainer().hasClass("resize")) {
                var $iframe = $(iframe || "#previewArea iframe"),
                    prevHeight = 0,
                    counter = 0,
                    timer,
                    originalHeight = $iframe.height();
                content && (function() {
                    var height = $(content).outerHeight(true);
                    if (prevHeight != height) {
                        if (height != $iframe.height()) {
                            $iframe.height(0).height(Math.max(height, originalHeight));
                        }
                        prevHeight = height;
                        counter = 0;
                    } else {
                        counter++;
                    }

                    // upper limit check for content height changes
                    if (counter < 500) {
                        timer = setTimeout(arguments.callee, 500);
                    }
                })();
                $(document).one("mode-changed.resize-editor", function (_, mode) {
                    if (mode != Confluence.Editor.MODE_PREVIEW) {
                        timer && clearTimeout(timer);
                    }
                });
            //This is only needed for IE/Opera where our 100% height solution does not work with CSS alone.
            } else if (tinymce.isIE || tinymce.isOpera) {
                var windowHeight = $(window).height(),
                    headerHeight = $("#header-precursor").height() + $("#header").height() + $("#editor-precursor").height(),
                    footerHeight = $("#savebar-container").height(),
                    magicNumber = 4; //HACK - CONF41 BN The bottom of the preview iframe is off by this much (no idea why).

                $("#preview iframe").height(windowHeight - headerHeight - footerHeight - magicNumber);

                // Reset the value used by the editor.
                $("#content.edit").height("auto");
            }
        },

        showRichText: function(show) {
            AJS.setVisible("#wysiwyg", show);
            $('#editor-precursor').css({'display': 'table-row'});
            $(".toolbar-group-preview").toggleClass("assistive", !show);
            $(".toolbar-group-edit").toggleClass("assistive", show);

            $("#main").toggleClass("active-richtext", show);

            // CONFDEV-5601 - When the visibility of the editor is toggled in Firefox, the
            // arrow keys erroneously scroll instead of moving the cursor position. Toggling
            // the contenteditable state is a hack fix for buggy browser behaviour.
            if (tinymce.isGecko && show) {
                AJS.Rte.fixEditorFocus(Confluence.Editor.bookmark);
            }
        },

        showPreview: function(show) {
            // update the display title for preview
            var $contentTitle = $("#content-title");
            if($contentTitle.hasClass("placeholded")){
                $("#preview-title-text").text("");
                $("#title-text").text("");
            }else{
                $("#preview-title-text").text($contentTitle.val());
                $("#title-text").text($contentTitle.val());
            }

            AJS.setVisible("#preview", show);

            $(".toolbar-group-preview").toggleClass("assistive", show);
            $(".toolbar-group-edit").toggleClass("assistive", !show);

            $("#main").toggleClass("active-preview", show);
            !!$("#full-height-container").length && $("#full-height-container").toggleClass("active-preview", show);
        },

        showSource: function(show) {
            if (show) {
                this.showSourceArea();
            } else {
                this.hideSourceArea();
            }
            $("#main")[show ? "addClass" : "removeClass"]("active-source");
        },

        /**
         * Set up the page for rich text or markup editing
         */
        setMode: function(mode) {
            AJS.log("Set mode: " + mode);
            if (mode == Confluence.Editor.MODE_RICHTEXT) {
                this.showRichText(true);
                this.showPreview(false);
                this.showSource(false);
            } else if (mode == Confluence.Editor.MODE_SOURCE) {
                this.showSource(true);
                this.showRichText(false);
                this.showPreview(false);
            } else if (mode == Confluence.Editor.MODE_PREVIEW) {
                this.showPreview(true);
                this.showRichText(false);
                this.showSource(false);
            }

            this.currentEditMode = mode;
            $(document).trigger("mode-changed", [mode]);
        },

        /**
         * Returns the ID of the appropriate content object to use when rendering the editor's content.
         * For pages, blogs, existing comments or drafts it is the ID of that object.
         * For new comments it is the ID of the page or blog to which the comment belongs.
         */
        getContentId: function() {
            var id = AJS.Meta.get('content-id');
            if (!+id)
                id = AJS.Meta.get('page-id');
            if (!+id)
                id = "0"; // ensure we always return "0" or an actual id.
            return id;
        },

        addErrorMessage: function (id, message, showInAllModes) {
            var container = $("#" + id);
            var appendToId = (showInAllModes ? "#all-messages" : "#editor-messages"); 
            if (container.length) {
                container.empty();
            } else {
                container = $("<div></div>").attr("id", id).appendTo(appendToId);
            }
            AJS.messages.error(container, {
                closeable: true,
                body: message
            });
        },

        changeMode: function(newMode, options) {
            AJS.log("Change mode: " + newMode);
            options = options || {};
            // Only allow the mode to be changed if the editor has been initialised
            if (this.inRichTextMode() && !AJS.Rte.BootstrapManager.isInitComplete()) {
                return false;
            }
            if (this.currentEditMode == newMode) {
                return false;
            }

            var prevMode = this.currentEditMode;
            Confluence.Editor.Drafts.save();

            if (newMode == Confluence.Editor.MODE_PREVIEW) {
                var editor = AJS.Rte.getEditor();

                if (prevMode == Confluence.Editor.MODE_SOURCE) {
                    Confluence.Editor.transferSourceToEditor();
                }

                if (tinyMCE.isGecko && (prevMode == Confluence.Editor.MODE_RICHTEXT)) { // CONFDEV-5601
                    Confluence.Editor.bookmark = tinymce.activeEditor.selection.getBookmark();
                }

                this.currentEditMode = newMode;
                var queryParams = {
                    "contentId": this.getContentId(),
                    "contentType": AJS.params.contentType,
                    "spaceKey": AJS.Meta.get('space-key'),
                    "xHtml": editor.getContent()
                };

                $.ajax({
                    type: "POST",
                    url: AJS.params.contextPath + "/pages/rendercontent.action",
                    data: queryParams,
                    success: Confluence.Editor.replysetPreviewArea,
                    timeout: 20000,
                    error: function() {
                        Confluence.Editor.addErrorMessage("preview-error", AJS.I18n.getText("editor.preview.error"));
                        Confluence.Editor.currentEditMode = prevMode;
                        options.errorCallback && options.errorCallback();
                    }
                });
            } else {
                this.setMode(newMode);
            }
            if (newMode == Confluence.Editor.MODE_RICHTEXT) {
                $(document).trigger("resize.resizeplugin");
            }

            return false;
        },

        replysetPreviewArea: function(html) {
            $("#preview-error").remove();
            // Set the iframe source to an empty JS statement to avoid secure/insecure warnings on HTTPS, without
            // needing a back-end call.
            var src = AJS.params.staticResourceUrlPrefix + "/blank.html";
            tinyMCE.activeEditor.setProgressState(true);

            AJS.$("#previewArea").html('<iframe src="' + src + '" scrolling="yes" frameborder="0"></iframe>');
            var iframe = AJS.$("#previewArea iframe")[0];
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.write(html);
            doc.close(); // for firefox
        },

        inRichTextMode: function() {
            return this.currentEditMode == Confluence.Editor.MODE_RICHTEXT;
        },

        // Called by Bootstrap oninit
        onInit: function() {
           Confluence.Editor.setMode(Confluence.Editor.MODE_RICHTEXT);
           tinyMCE.activeEditor.onClick.add(function(ed, e) {
             $("#PostingDate").datepicker("hide");
           });
        },

        contentChangeHandler: function() {
            this.contentHasChangedSinceLastAutoSave = true;
        },

        getCurrentForm: function() {
            return AJS.$("form[name=" + AJS.params.formName + "]")[0];
        },

        transferSourceToEditor: function () {
            var ed = Confluence.Editor;
            if (ed.sourceInitialValue) {
                var newContent = ed.getSourceAreaVal();
                if (newContent != ed.sourceInitialValue) {
                    var editor = tinyMCE.activeEditor;
                    editor.setContent(newContent);
                    editor.setDirty(newContent);
                }
            }
            ed.sourceInitialValue = false;
        },

        hideSourceArea: function() {
            AJS.$("#editor-html-source-container").addClass("hidden");
            this.setToolBarInactive(false);
            this.transferSourceToEditor();
            $("#rte-button-source-mode").removeClass("active");
            $("#rte-button-publish").unbind('click.source-save');
        },

        showSourceArea: function() {
            AJS.$("#editor-html-source-container").removeClass("hidden");
            this.setSourceAreaHeight();
            this.setToolBarInactive(true);
            this.sourceInitialValue = tinyMCE.activeEditor.getContent();
            this.setSourceAreaVal(this.sourceInitialValue);
            $("#rte-button-source-mode").addClass("active");
            $("#rte-button-publish").bind("click.source-save", Confluence.Editor.transferSourceToEditor);
        },

        getSourceAreaVal: function() {
            return AJS.$("#editor-html-source").val();
        },

        setSourceAreaVal: function(val) {
            AJS.$("#editor-html-source").val(val);
        },

        setSourceAreaHeight: function() {
            //TODOXHTML doing this properly is difficult and inefficient, hack for now
            var height = AJS.Rte.getTinyMceEditorMinHeight();
            AJS.log("HTML source height= " + height);
            var scrollHeight = $("#editor-html-source")[0].scrollHeight;
            if (scrollHeight > height) {
                height = scrollHeight;
                AJS.log("ACTUAL HEIGHT " + scrollHeight);
            }
            $("#editor-html-source-container").height(height + "px");
        },

        setToolBarInactive: function(val) {
            $("#rte-toolbar").toggleClass("disabled", val);
        }
    };
})(AJS.$);

AJS.toInit(function($) {

    var saveButton = $('#rte-button-publish'),
        overwriteButton = $('#rte-button-overwrite'),
        editButton = $('#rte-button-edit'),
        previewButton = $('#rte-button-preview'),
        previewLabel = previewButton.text(),
        cancelButton = $('#rte-button-cancel'),
        buttons = [ saveButton, overwriteButton, editButton, previewButton, cancelButton ],
        cancelling = false,
        editor = Confluence.Editor;

    // Can only style buttons as disabled, as disabling them prevents
    // the button type being sent to the action (i.e. cancel doesn't work). :/
    var setButtonState = function(enable) {
        var i, bLen = buttons.length;
        for(i = 0; i < bLen; i++) {
            buttons[i].toggleClass('disabled', !enable);
        }
    };

    var isFormEnabled = function() {
        return !saveButton.hasClass('disabled');
    };

    $(editor.getCurrentForm()).submit(function(e){
        //if we ever want to put validation or use an ajaxy submit please move this into a click handler.
        if(!isFormEnabled()) {
            // prevent multiple submits
            return false;
        }

        if(!cancelling) {
            var content = AJS.Rte.getEditor().getContent().replace("&nbsp;", " ");
            if (AJS.Meta.get("content-type") === "comment" && !$.trim(content)) {
                alert(AJS.I18n.getText("content.empty"));
                return false;
            }

            saveButton.text(AJS.I18n.getText("saving.name"));
            overwriteButton.text(AJS.I18n.getText("overwriting.name"));
        }
        cancelling = false;
        setButtonState(false);
        return editor.contentFormSubmit(e);
    });
    this.currentEditMode = this.MODE_RICHTEXT;

    cancelButton.click(function(e) {
        cancelling = true;
    });

    if (AJS.DarkFeatures.isEnabled('move.page.on.save')) {
        saveButton.click(function(e){
            e.preventDefault();
             if ($("#move-page-dialog").length > 0) {
                $("#move-page-dialog, body > .shadow, body > .aui-blanket").remove();
            }
            var currentSpaceName;
            if(AJS.Meta.getBoolean("new-page") && AJS.Meta.get("content-type") != "blogpost") {
                new Confluence.MovePageDialog({
                    spaceName: currentSpaceName,
                    spaceKey: $("#newSpaceKey").val(),
                    pageTitle: $("#content-title").val(),
                    parentPageTitle: $("#parentPageString").val(),
                    buttonName: AJS.I18n.getText("save.name"),
                    title: AJS.I18n.getText("move.page.dialog.title.edit"),
                    hint: {text: AJS.I18n.getText("move.page.dialog.hint")},
                    moveHandler: function (dialog, newSpaceKey, newSpaceName, newParentPage, targetId, newPositionIndicator, setErrors) {
                        $("#newSpaceKey").val(newSpaceKey);
                        $("#parentPageString").val(newParentPage);
                        if (newParentPage != "") {
                            $("#position").val("append");
                        } else {
                            $("#position").val("topLevel");
                        }
                        // If explicit position has been set then override the positions that may have been set up
                        if (targetId) {
                            $("#targetId").val(targetId);
                            $("#position").val(newPositionIndicator);
                        }
                        $(editor.getCurrentForm()).submit();
                    }
                });
            } else {
                $(editor.getCurrentForm()).submit();
            }
        });
    }

    editButton.click(function(e) {
        if(isFormEnabled()) {
            Confluence.Editor.changeMode(editor.MODE_RICHTEXT);
            setTimeout(function() {
               AJS.Rte.getEditor().focus();
               if(tinymce.isGecko && Confluence.Editor.bookmark) {
                AJS.Rte.getEditor().selection.moveToBookmark(Confluence.Editor.bookmark);
               }
            }, 0);
        }
        e.preventDefault();
    });

    previewButton.click(function(e) {
        if(isFormEnabled() && editor.currentEditMode != editor.MODE_PREVIEW) {
            setButtonState(false);
            previewButton.text(AJS.I18n.getText("show.previewing"));

            if(tinymce.isGecko && !Confluence.Editor.bookmark) {
                Confluence.Editor.bookmark = tinymce.activeEditor.selection.getBookmark();
            }

            editor.changeMode(editor.MODE_PREVIEW, {
                errorCallback: function() {
                    // preview load failed
                    setButtonState(true);
                    previewButton.text(previewLabel);
                }
            });
        }
        e.preventDefault();
    });
    
    $("#editor-html-source").change(editor.setSourceAreaHeight).keyup(editor.setSourceAreaHeight);

    $("#rte-button-attachments").bind("updateLabel", function() {
        // Update the Attachments button with the number of attachments.
        var numAttachments = AJS.Meta.get("num-attachments");
        var labelName = (numAttachments > 1) ? AJS.I18n.getText("editor.attachments.plural", numAttachments) : (numAttachments == 0) ? AJS.I18n.getText("editor.attachments.zero", numAttachments): AJS.I18n.getText("editor.attachments.singular", numAttachments);
        $("#rte-button-attachments > .trigger-text").text(labelName);
    });

    $("#rte-button-labels").bind("updateLabel", function() {
        var numLabels = AJS.Meta.get("num-labels");
        var labelName = (numLabels > 1) ? AJS.I18n.getText("editor.labels.plural", numLabels) : (numLabels == 0) ? AJS.I18n.getText("editor.labels.zero", numLabels): AJS.I18n.getText("editor.labels.singular", numLabels);
        $("#rte-button-labels  > .trigger-text").text(labelName);
    });

    //init the date picker for the blog post stuff
    $("#PostingDate").datepicker({maxDate: new Date()});
    // CONFDEV-4862 - After the date picker is inited make sure its is not visible.
    // If it is visible the editor height calculations don't work
    $("#PostingDate").datepicker("widget").css("display", "none");

    // Initialisation
    // We should note here that the content has NOT finished loading
    AJS.Rte.BootstrapManager.addOnInitCallback(editor.onInit);

    // CONFDEV-4913 if the user clicks on the spinner put the focus on the editor
    $(".mceProgress, .mceBlocker", $("#wysiwygTextarea_parent")[0]).live("click", function() {
        AJS.Rte.getEditor().focus();
    });

    // bind the function to be run when the preview frame is loaded
    $(window).bind("render-content-loaded", function(e, body) {
        var iframe = $("#previewArea iframe");
        if (iframe.contents().find("body")[0] == body) {
            editor.previewFrameOnload(body, iframe);
            previewButton.text(previewLabel);
            setButtonState(true);
            iframe.focus();
            //This tells AUI that we have added a new iframe. In particular it makes whenitype.js pass through
            //keypress events from the iframe to the parent, which makes our keyboard shortcuts work.
            $(document).trigger("iframeAppended", iframe);
        }
    });

    if (AJS.params.heartbeat) {
        editor.heartbeat();
        setInterval(editor.heartbeat, +AJS.Meta.get('heartbeat-interval') || 30000);
    }
});

/**
 * @deprecated since 4.0, Use Confluence.Editor instead.
 */
AJS.Editor = Confluence.Editor;
