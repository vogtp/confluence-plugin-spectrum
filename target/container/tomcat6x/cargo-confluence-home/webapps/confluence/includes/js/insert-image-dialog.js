jQuery.fn.sizeToFit = function () {
    var $ = jQuery;
    this.each(function () {
        var content = this;
        var container = $(this).parent();
        var outerHeight = container.height();
        container.children().each(function () {
            if (this != content) {
                outerHeight -= $(this).outerHeight();
            }
        });
        var paddingAndBorderHeight = $(this).outerHeight() - $(this).height();
        $(this).css("height", Math.max(0, outerHeight - paddingAndBorderHeight) + "px");
    });
    return this;
};

Confluence.Editor.ImageDialog = {
    /**
     * Listeners called just before the image dialog is shown
     */
    beforeShowListeners: [],

    /**
     * Listeners called after thumbnails of images have been drawn
     */
    afterThumbnailsDisplayedListeners: [],

    /**
     * Component that creates and maintains a panel.
     *
     * Structure:
     * {
     *      id: unique identifier for the component
     *      createPanel: function(context) {...},
     *      refresh: (optional) - can be called to reload the contents of the panel
     * }
     */
    panelComponent: []

};


AJS.toInit(function ($) {

    /**
     * Finds and returns the first panelComponent matching the specified id, or null if not found.
     *
     * @param id the panelComponent.id to find.
     */
    Confluence.Editor.ImageDialog.findPanelComponentById = function (id) {
        var panels = Confluence.Editor.ImageDialog.panelComponent;
        for (var i = 0, ii = panels.length; i < ii; i++) {
            if (panels[i].id == id) {
                return panels[i];
            }
        }
        return undefined; // just making it obvious
    };

    AJS.wikiAttrToString = function (attr) {
        var res = [];
        for (var prop in attr) if (attr.hasOwnProperty(prop)) {
            res.push(typeof attr[prop] == "boolean" ? attr[prop] ? prop : "" : prop + "=" + attr[prop]);
        }
        return res.length ? "|" + res.join(",") : "";
    };

    Confluence.Editor.defaultInsertImageDialog = function() {
        var insertCallback = function (properties) {
            AJS.Rte.BookmarkManager.restoreBookmark();
            tinymce.confluence.ImageUtils.insertFromProperties(properties);

            // CONFDEV-5203 - Prevent cursor loss when using arrow keys after inserting an
            // image. This is a FF-specific issue that occurs when adding or editing comments.
            if (!!$("#comments-section").length) {
                AJS.Rte.fixEditorFocus();
            }
        },
        cancelCallback = function () {
            AJS.Rte.BookmarkManager.restoreBookmark();
        };
        AJS.Rte.BookmarkManager.storeBookmark();
        Confluence.Editor.insertImageDialog(insertCallback, cancelCallback);
    };

    Confluence.Editor.insertImageDialog = function (insertCallback, cancelCallback) {
        this.openImageDialog({
            submitCallback: insertCallback,
            cancelCallback: cancelCallback
        });
    };

    /**
     * Applies key binding to a particular image container, i.e. for fancybox navigation.
     * @param imageContainer
     * @param context
     * @param panelContext {
     *              @param imageSelector
     *          }
     */
    var bindImageContainer = function(imageContainer, context, panelContext) {
        $(document).bind("keydown.insert-image", function (e) {
            if (!imageContainer.is(":visible")) return;
            if ($("#fancybox-overlay").is(":visible")) {
                if (e.which == 32) { // space bar
                    $("#fancybox-close").click();
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            } else {
                function moveSelection(delta) {
                    var results = $(".attached-image", imageContainer);
                    var selected = $(".attached-image.selected", imageContainer);
                    var index = results.index(selected) + delta;
                    if (index < 0) index = results.length - 1;
                    if (index >= results.length) index = 0;

                    var next = results.eq(index);
                    next.click().focus();
                    imageContainer.simpleScrollTo(next);
                }

                if (e.which == 37) { // left
                    moveSelection(-1);
                    return AJS.stopEvent(e);
                } else if (e.which == 38) { // up
                    moveSelection(-4);
                    return AJS.stopEvent(e);
                } else if (e.which == 39) { // right
                    moveSelection(1);
                    return AJS.stopEvent(e);
                } else if (e.which == 40) { // down
                    moveSelection(4);
                    return AJS.stopEvent(e);
                } else if (e.which == 32 && $(".attached-image.selected").length > 0) { // space bar
                    $(panelContext.imageSelector + ".selected .zoom").click();
                    return AJS.stopEvent(e);
                } else if (e.which == 13 && context.isInsertAllowed()) { // enter
                    context.insert();
                    return AJS.stopEvent(e);
                }
            }
        });
    };

    /**
     * Renders an individual images
     * @param img an image object containing the image properties
     * @param showParentTitle indicates if the parent title should be rendered
     * @param highlighter highlight
     */
    var renderImage = function(context, img, showParentTitle, highlighter) {

        var dim = 100,
            highlighter = highlighter || new Confluence.Highlighter(),
            imageName = img.name || img.fileName,
            result;

        if (Math.max(img.thumbnailWidth, img.thumbnailHeight) > dim) {
            if (img.thumbnailHeight > img.thumbnailWidth) {
                img.thumbnailWidth = img.thumbnailWidth * dim / img.thumbnailHeight;
                img.thumbnailHeight = dim;
            } else {
                img.thumbnailHeight = img.thumbnailHeight * dim / img.thumbnailWidth;
                img.thumbnailWidth = dim;
            }
        }

        // REST API
        if (!img.thumbnailUrl && img.thumbnailLink) {
            img.thumbnailUrl = img.thumbnailLink.href;
        }
        if (!img.downloadUrl && img.link) {
            for (var i=0,ii=img.link.length; i<ii; i++) {
                var link = img.link[i];
                if (link.rel == "download") {
                    img.downloadUrl = link.href;
                    break;
                }
            }
        }

        result = $(Confluence.Templates.Image.imageDialogListItem({
            image: img,
            nonceUrl: img.thumbnailUrl && img.thumbnailUrl + (img.thumbnailUrl.indexOf("?") + 1 ? "&" : "?") + "nonce=" + (+new Date),
            imageTooltip: imageName + (img.space && (" (" + img.space.name + ")") || ""),
            topMargin: img.thumbnailHeight && (100 - img.thumbnailHeight) / 2,
            parentTitleClass: showParentTitle ? "" : "hidden",
            imageName: imageName,
            parentTitle: img.parentTitle || "",
            highlightedImageName: highlighter.highlight(imageName),
            highlightedParentTitle: highlighter.highlight(img.parentTitle || "")
        }));

        result.attr("data-owner-id", img.ownerId || "");
        result.attr("data-destination", AJS.REST.wikiLink(img).destination);
        result.find(".image-container").andSelf().hover(function () {
            $(this).addClass("hover");
        }, function () {
            $(this).removeClass("hover");
        });
        result.find("img").load(function () {
            result.find(".image-container").removeClass("loading");
        });
        result.click(function (e) {
            $("#insert-image-dialog .image-list .selected").removeClass("selected");
            $(this).addClass("selected").focus();
            context.selectedName = this.name = this.name || $(".caption.filename", this).text();
            context.selectedOwnerId = $(this).attr("data-owner-id");
            context.selectedDestination = $(this).attr("data-destination");
            context.allowInsert(true);
            // prevent propagation to container, which when clicked deselects
            e.stopPropagation();
            return false;
        });
        result.dblclick(function () {
            $(this).click();
            context.insert();
        });
        $(".zoom", result).fancybox({
            padding: 0,
            zoomSpeedIn: 500,
            zoomSpeedOut: 500,
            overlayShow: true,
            overlayOpacity: 0.5
        });
        return result;
    };

    /**
     * Refreshes images on an image-list in a particular panel.
     *
     * @param context the image dialog context
     * @param panelContext the panel specific context:
     *          {
     *              @param imageContainer the panel to display the images
     *              @param images the list of images to diplay
     *              @param noImageMessage a text message to diplay if there a no images
     *              @param justAttached a list of files recent attached
     *              @param showParentTitle true indicates that the parent title of the page is to be shown under the filename.
     *              @param displayErrors callback for displaying errors
     *          }
     */
    var refreshImageList = function(context, panelContext) {
        var imageList = panelContext.imageContainer.find(".image-list"),
            justAttached = $.map(panelContext.justAttached || [], function (filename) {
                return filename && filename.toLowerCase();
            }), // ensure we dealing with lowercase filenames
            options = context.options,
            imageContainer = panelContext.imageContainer,
            images = panelContext.images || [],
            noImageMessage = panelContext.noImageMessage,
            showParentTitle = panelContext.showParentTitle,
            highlighter = panelContext.highlighter,
            displayErrors = panelContext.displayErrors,
            notThumbnailableErrors = [],
            imageFilenames;

        imageContainer.find(".loading-message").addClass("hidden");
        imageContainer.find(".no-images").remove();

        $(images).each(function () {
            if (this.name && $.inArray(this.name.toLowerCase(), justAttached) != -1) {
                imageList.prepend(renderImage(context, this, showParentTitle, highlighter));
            } else {
                imageList.append(renderImage(context, this, showParentTitle, highlighter));
            }
        });
        if (imageList.find("li").length == 0) {
            imageContainer.append($("<p></p>").addClass("no-images").text(noImageMessage));
        }
        imageContainer.sizeToFit().click(function () {
            // deselect when clicking outside the images
            context.clearSelection();
        });

        if (justAttached.length) {
            // ensure the first attached image is selected
            imageList.find("li:first").click();
        } else if (options.imageProperties && options.imageProperties.imageFileName) {
            // If editing an existing image, select the image
            imageContainter.find("img[src*=/" + options.imageProperties.imageFileName + "?]").click();
        }

// FIXME Delegate to panel
//        AJS.log(Confluence.Editor.ImageDialog.afterThumbnailsDisplayedListeners.length + " afterThumbnailsDisplayed listeners registered.");
//        $.each(Confluence.Editor.ImageDialog.afterThumbnailsDisplayedListeners, function () {
//            this();
//        });

        // handle non-thumbnailable files
        notThumbnailableErrors = [];
        imageFilenames = $.map(images, function (image) {
            return image.name && image.name.toLowerCase();
        });
        $.each(justAttached, function (index, value) {
            if ($.inArray(value, imageFilenames) == -1)
                notThumbnailableErrors.push(AJS.I18n.getText("unsupported.file.error", value));
        });
        if (notThumbnailableErrors.length)
            displayErrors(notThumbnailableErrors);
    };

    /**
     * Opens the image dialog. If the options include an imageProperties object, the image represented by the
     * properties will be edited. If not, an insert dialog is shown.
     *
     * @param options for opening the dialog, includes:
     *  - submitCallback called when the dialog form is submitted
     *  - cancelCallback called when the dialog is cancelled
     *  - imageProperties properties of an image to load in the dialog
     */
    Confluence.Editor.openImageDialog = function (options) {
        options = options || {};

        var dialog = new AJS.Dialog(800, 590, "insert-image-dialog"),
            /**
             * The context passed into panel factories
             */
            context = {
                baseElement: dialog.popup.element,
                selectedName: "",
                selectedOwnerId: null,
                selectedDestination: null,
                /**
                 * Indicates if the dialog insert button should be enabled or disabled
                 * @param allow
                 */
                allowInsert: null,

                isInsertAllowed: null,
                /**
                 * Inserts the selected content.
                 */
                insert: null,
                // For pages and blogs this is their own pageId. For comments, pageId is the page they are on.
                // For drafts it is contentId.
                attachmentSourceContentId: AJS.Meta.get('attachment-source-content-id'),
                options: options,
                clearSelection: null,
                /**
                 * Provides support for panels implementing an image container to show a list of images.
                 */
                imageContainerSupport: {
                    bindImageContainer: bindImageContainer,
                    refreshImageList: refreshImageList
                },
                /**
                 * @param title {string} panel title
                 * @param reference {string} or {object} jQuery object or selector for the contents of the Panel
                 * @param className {string} [optional] HTML class name
                 * @param panelButtonId {string} [optional] The unique id for the panel's button.
                 * @return the panel id
                 */
                addPanel: function(title, reference, className, panelButtonId) {
                    var nextPanelId = dialog.getPage(0).panel.length;
                    dialog.addPanel(title, reference, className, panelButtonId);
                    return nextPanelId;
                },
                /**
                 * Selects the specified panel in the UI.
                 * @param panelId
                 */
                selectPanel: function(panelId) {
                    dialog.selectPanel(panelId);
                },
                /**
                 * Selects the panel by id.
                 * @param panelId
                 */
                getPanel: function(panelId) {
                    return dialog.getPanel(panelId);
                }
            },
            dialogTitle = AJS.I18n.getText("image.browser.insert.title"),
            submitText = AJS.I18n.getText("image.browser.insert.button"),
            dialogElement,
            insertButton;

        context.clearSelection = function() {
            context.selectedName = "";
            context.selectedOwnerId = null;
            context.selectedDestination = null;
            context.allowInsert(false);
            context.baseElement.find(".image-list .selected").removeClass("selected");
        };

        function killDialog() {
            dialog.hide().remove();
            $(document).unbind(".insert-image");
            options.cancelCallback && options.cancelCallback();
            return false;
        }

        $(document).bind("keydown.insert-image", function (e) {
            if (e.which == 27 && !$("#fancybox-overlay").is(":visible")) {
                killDialog();
                return AJS.stopEvent(e);
            }
        });

        if (options.imageProperties) {
            dialogTitle = AJS.I18n.getText("image.browser.edit.title");
            submitText = AJS.I18n.getText("image.browser.edit.button");
        }
        dialog.addHeader(dialogTitle);

        dialog.addButton(submitText, function (dialog) {
            var panelBody = dialog.getCurrentPanel().body;
            var url = $("input.image-url", panelBody).val();

            var placeholderRequest = {
                    url: url,
                    filename: context.selectedName,
                    contentId: context.selectedOwnerId || context.attachmentSourceContentId
            };

            dialog.remove();
            $(document).unbind(".insert-image");
            if (options.submitCallback) {
                options.submitCallback(placeholderRequest);
            }
        }, "insert");

        dialogElement = dialog.popup.element;
        dialogElement.attr("data-tab-default", "0");
        insertButton = dialogElement.find(".dialog-button-panel .insert");
        context.allowInsert = function(allow) {
            insertButton.attr("disabled", (allow ? "" : "disabled"));
        };
        context.allowInsert(false);
        context.isInsertAllowed = function() {
            return !insertButton.is(":disabled");
        };
        context.insert = function() {
            insertButton.click();
        };

        // Construct panels

        $.each(Confluence.Editor.ImageDialog.panelComponent, function () {
            this && this.createPanel && this.createPanel(context);
        });

        // Cancel Button
        dialog.addCancel(AJS.I18n.getText("cancel.name"), killDialog);

        for (var curPanel, i = 0; curPanel = dialog.getPanel(i); i++) {
            curPanel.setPadding(0);
        }

        AJS.log(Confluence.Editor.ImageDialog.beforeShowListeners.length + " beforeShow listeners registered.");
        $.each(Confluence.Editor.ImageDialog.beforeShowListeners, function () {
            this();
        });

        dialog.show();
        dialog.popup.element.find(".dialog-button-panel")
                .append($("<div></div>")
                .addClass("dialog-tip")
                .html(AJS.I18n.getText("insert.image.did.you.know")));
    };
});
