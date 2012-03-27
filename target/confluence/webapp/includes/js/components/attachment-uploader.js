(function ($) {

/**
 * Returns a controller for an Attachment Uploader component as a default object with optional overrides.
 * The default controller assumes a standard upload form layout.
 * 
 * @param context - the context in which the uploader is located, contains:
 * - baseElement: the DOM element containing the upload form and its message container
 *
 * @param getOverrideController (optional) a function returning override controller methods
 */
var getController = function (context, getOverrideController) {
    var messageHandler;

    return $.extend({

        // Returns the form that when submitted uploads an attachment
        getForm: function () {
            return $("form", context.baseElement);
        },

        // Returns the element displayed while the upload is in progress
        getUploadingMessageElement: function () {
            return $(".upload-in-progress", context.baseElement);
        },

        // Called after message elements are altered to fix the layout around the upload form.
        pack: function () {},

        displayErrors: function (messages) {
            messageHandler.displayMessages(messages);
            this.pack();
        },

        clearErrors: function () {
            messageHandler.clearMessages();
            this.pack();
        },

        // Hides the upload form and displays the uploading-status message.
        setUploadInProgress: function (inprogress, message) {
            var uploadingMessage = this.getUploadingMessageElement();

            if (inprogress) {
                uploadingMessage.html(message || this.getDefaultUploadingMessage());
            }
            AJS.setVisible(uploadingMessage, inprogress);
            AJS.setVisible(this.getForm(), !inprogress);
        },

        // Implemented by overriding controllers, this gets called after an attachment is uploaded without errors.
        onUploadSuccess: function() {},

        // Returns a new or existing message handler for error messages relating to uploads.
        getMessageHandler: function () {
            if (!messageHandler) {
                messageHandler = AJS.MessageHandler({
                    baseElement: $(".warning", context.baseElement)
                });
            }
            return messageHandler;
        },

        // A message like "Could not upload the file to Confluence. The server may be unavailable."
        getDefaultErrorMessage: function () {
            return AJS.I18n.getText("attachment.uploader.error");
        },

        // A message like "File uploading&hellip;"
        getDefaultUploadingMessage: function () {
            return AJS.I18n.getText("attachment.uploader.uploading");
        },

        // Returns the id of the content the attachment should be loaded against
        getContentId: function () {
            return AJS.Meta.get('attachment-source-content-id');
        }
    },
        getOverrideController && getOverrideController(context)
    );
};

/**
 * Handles the upload of an attachment.
 *
 * @param context with:
 *  - baseElement: the jQuery-wrapped upload div DOM element containing the form and upload/warning messages
 *
 *  @param getOverrideController (optional), a function that takes the context and returns a controller
 *
 *  Requires metadata 'can-attach-files' to be true if the form is to be displayed.
 */
Confluence.AttachmentUploader = function (context, getOverrideController) {

    var controller, messageHandler, uploadForm;

    // The main controller for the upload process, includes default behaviour overridden by calling code.
    controller = getController(context, getOverrideController);

    // Creates a MessageHandler for showing and hiding errors.
    messageHandler = controller.getMessageHandler();

    uploadForm = controller.getForm();

    if (AJS.Meta.getBoolean('can-attach-files')) {
        // Replaces the HTML form behaviour with an AJAX call, to allow uploads without leaving the page
        uploadForm.ajaxForm({
            dataType: "json",
            data: {
                contentId: controller.getContentId(),
                responseFormat: "html" // ensure response comes back as HTML for IE compatibility
            },
            resetForm: true,
            beforeSubmit: function () {
                controller.setUploadInProgress(true);
                messageHandler.clearMessages();
            },
            success: function (response) {
                controller.setUploadInProgress(false);

                // If there are errors to be displayed by the message handler, abort
                // Replace any found errors with the stock "upload error" message, if one exists.
                if (messageHandler.handleResponseErrors(response, controller.getDefaultErrorMessage())) return;

                // Pass attachmentsAdded, an array of Attachments converted to JSON with the AttachmentJsonator,
                // to a success callback almost sure to be overridden by the calling controller.
                controller.onUploadSuccess(response.attachmentsAdded || []);
            },
            error: function (xhr) {
                controller.setUploadInProgress(false);
                messageHandler.displayMessages(controller.getDefaultErrorMessage());
                AJS.log("Response from server was: " + xhr.responseText);
            }
        });

        // Hook the submit action to the file input changing so the user doesn't have to double-handle.
        uploadForm.find("input:file").change(function () { uploadForm.submit(); });
    } else {
        // If the user cannot attach files to the content, no upload form should be shown.
        uploadForm.remove();
    }

    return controller;
};

})(AJS.$);
