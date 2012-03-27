AJS.toInit(function ($) {
    var panelId,

    // The controller for the Upload Attachments form - refer to it sparingly to avoid coupling.
    uploader,

    // The controller for displaying error messages in the panel - refer to it sparingly to avoid coupling too.
    messenger,

    // The default controller is the one that will normally be used. It is only usually overridden during testing.
    defaultController = function(context) {
        var getPanelElement = function() {
                return $(".attachments-panel", context.baseElement);
            },
            getContainer = function() {
                return $("#attached-images");
            },
            getImageListContainer = function() {
                return $(".image-list", getContainer());
            },
            getForm = function() {
                return $("form", getPanelElement());
            },
            /**
             * Fetch and render all latest images
             * @param justAttached [optional] an array of filenames that have just been attached (we want to promote these in some way)
             */
            refreshWithLatestImages = function (notifSource, justAttached) {

                justAttached = justAttached ? $.map(justAttached, function (filename) {
                    return filename && filename.toLowerCase();
                }) : []; // ensure we dealing with lowercase filenames

                var imageContainer = getContainer();
                imageContainer.find(".image-list").empty();

                AJS.getJSONWrap({
                    url: "/pages/attachedimages.action",
                    data: {
                        contentId: context.attachmentSourceContentId
                    },

                    // Handler for error messages.
                    messageHandler: messenger,

                    // An element to show while the AJAX request is running and hide when finished.
                    loadingElement: imageContainer.find(".loading-message"),

                    // A message to display when unknown server or network errors occur.
                    errorMessage: AJS.I18n.getText("image.browser.error.retrieving.attachments"),

                    successCallback: function (data) {
                        context.imageContainerSupport.refreshImageList(context, { /* panelContext */
                            imageContainer: imageContainer,
                            images: data.images,
                            noImageMessage: AJS.I18n.getText("image.browser.no.attachments"),
                            justAttached: justAttached,
                            showParentTitle: false,

                            // Delegate displaying image errors to the uploader controller so that messages are
                            // shown in the error box associated with the upload form.
                            displayErrors: function (messages) {
                                uploader.displayErrors(messages);
                            }
                        });
                        AJS.Meta.set("num-attachments", +data.totalImages);
                        $("#rte-button-attachments").trigger("updateLabel");
                        notifSource.trigger('afterThumbnail', [ getImageListContainer() ]);
                    }
                });
            };

        return {
            getPanelElement: getPanelElement,
            getContainer: getContainer,
            getForm: getForm,
            refreshWithLatestImages: refreshWithLatestImages,
            getPanel: function() {
                var panel = Confluence.Templates.Image.attachedImagesPanel();
                if (AJS.Meta.getBoolean("can-attach-files")) {
                    panel = Confluence.Templates.Image.uploadFileForm() + panel;
                }
                return panel;
            },
            focus: function() {
                $("select.img-align", getPanelElement()).focus();
            },
            /**
             * @param params { success: function() {...}, error: function() {...} }
             */
            upload: function(params) {
                $.ajax({
                    dataType: "json",
                    data: {
                        contentId: context.attachmentSourceContentId,
                        responseFormat: "html" // ensure response comes back as HTML for IE compatibility
                    },
                    resetForm: true,
                    error: params.error,
                    success: params.success
                });
            },

            // Returns the sub-controller that will drive the attachment-uploader form.
            // The image attachment panel mainly uses the default sub-controller, overriding methods to
            // refresh images after an upload and fix the layout after messages are shown/cleared.
            getUploaderController: function () {
                var uploaderControllerOverride = function (context) {
                    return {

                        // Override the default upload success behaviour to refresh the thumbnail grid with the uploaded
                        // image(s).
                        onUploadSuccess: function (attachmentsAdded) {
                            controller.refreshWithLatestImages(
                                $attachmentPanelComponent,
                                $.map(attachmentsAdded || [], function (element) {
                                    return element.name.toLowerCase();
                                })
                            );
                        },

                        // When errors are displayed the image grid changes size.
                        pack: function () {
                            getContainer().sizeToFit();
                        },

                        getDefaultErrorMessage: function () {
                            return AJS.I18n.getText("image.browser.upload.error");
                        },

                        getDefaultUploadingMessage: function () {
                            return AJS.I18n.getText("image.browser.upload.image.uploading");
                        },

                        // The element to be show when the upload is in progress
                        getUploadingMessageElement: function () {
                            return $(".image-uploading", context.baseElement);
                        }
                    };
                };

                return Confluence.AttachmentUploader({
                    baseElement: $('#upload-attachment', context.baseElement)
                }, uploaderControllerOverride);
            }
        };
    },

    controller,
    attachmentPanelComponent = {

        id: "attachments",

        createPanel: function (context, overrideController) {

            // Use the default controller or an override for testing/customization.
            controller = (overrideController && overrideController(context)) || defaultController(context),

            // Add the panel element to the image Dialog.
            panelId = context.addPanel(AJS.I18n.getText("image.browser.attached.images.title"), controller.getPanel(), "attachments-panel");

            // Bind an AttachmentUploader to the upload form.
            uploader = controller.getUploaderController(context);

            messenger = uploader.getMessageHandler();

            // Bind key events for the grid of thumbnails.
            context.imageContainerSupport.bindImageContainer(controller.getContainer(), context);

            controller.refreshWithLatestImages($attachmentPanelComponent);
        },

        refresh: function(justAttached) {
            controller.refreshWithLatestImages($attachmentPanelComponent, justAttached);
        },

        getImageContainer: function() {
            return controller.getContainer();
        },

        clearErrors: function() {
            messenger.clearMessages();
        },

        displayErrors: function() {
            messenger.displayErrors();
        },

        // Exposed for plugins like drag-and-drop to call.
        setUploadInProgress: function (inprogress, message) {
            uploader.setUploadInProgress(inprogress, message);
        }
    },

    $attachmentPanelComponent = $(attachmentPanelComponent);

    Confluence.Editor.ImageDialog.panelComponent.push(attachmentPanelComponent);

});
