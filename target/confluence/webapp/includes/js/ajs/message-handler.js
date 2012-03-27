(function ($) {

    // Represents a default message-handling controller.
    // Expects a context with a message container as the baseElement.
    // By default, errors will be added to an unordered list element directly inside this container.
    var getDefaultController = function (context) {
        var getMessageContainer, getMessageList;

        // Returns the message container that is generally shown and hidden based on whether messages exist.
        getMessageContainer = function () {
            return context.baseElement;
        };

        // Returns a new or existing list element inside the message container
        getMessageList = function (messageContainer) {
            var messageList = $('ul', messageContainer);
            if (!messageList.length) {
                messageList = AJS('ul').appendTo(messageContainer);
            }
            return messageList;
        };

        return {

            getMessageContainer: getMessageContainer,

            // Removes any messages from the container and hides it.
            clearMessages: function() {
                getMessageContainer().addClass("hidden").empty();
            },

            // Adds errors to the container and displays it
            displayMessages: function (messages) {
                if (!messages || !messages.length) return;
                if (!$.isArray(messages)) messages = [messages];

                var messageContainer = getMessageContainer(),
                    messageList = getMessageList(messageContainer);

                for (var i = 0, ii = messages.length; i < ii; i++) {
                    AJS('li').text(messages[i]).appendTo(messageList);
                }
                messageContainer.removeClass("hidden");
            },

            // Extracts XWork-style errors from a response object and displays them.
            // Returns true if errors were found and handled, false otherwise.
            handleResponseErrors: function (response, defaultMessage) {
                var errors = [].concat(response.validationErrors || []).concat(response.actionErrors || []).concat(response.errorMessage || []);
                if (errors.length) {
                    this.displayMessages(defaultMessage || errors);
                    return true;
                }
                return false;
            }
        };
    };

    /**
     * Handles the display of messages in a container.
     *
     * @param context with:
     *  - baseElement: the DOM element containing the message container, or the message container itself
     *
     *  @param getOverrideController (optional), a function that takes the context and returns a controller
     */
    AJS.MessageHandler = function (context, getOverrideController) {

        var controller = $.extend(
            getDefaultController(context),
            getOverrideController && getOverrideController(context)
        );

        // Used for styling messages consistently
        controller.getMessageContainer().addClass('message-handler');

        controller.clearMessages();
        return controller;
    };

})(AJS.$);
