AJS.toInit(function ($) {
    var panelId;

    /**
     * Default controller
     */
    var defaultController = function(context) {

        var getForm = function() {
                return $("#insert-web-image-form", context.baseElement);
            },
            getImageInput = function() {
                return $("input.image-url", context.baseElement);
            },
            focus = function() {
                getImageInput().focus();
            };
        return {
            getForm: getForm,
            getContainer: function() {
                return $(".insert-web-image", context.baseElement);
            },
            getImageInput: getImageInput,
            getPanel: function() {
                return Confluence.Templates.Image.webPanel();
            },
            bindPanelSelection: function() {
                // FIXME - CONFDEV-2365 - can't bind using Jquery
                context.getPanel(panelId).onselect = focus;
            }
        };
    };

    Confluence.Editor.ImageDialog.panelComponent.push({

        id: "external",

        createPanel: function(context, controller) {
            var controller = (controller && controller(context)) || defaultController(context),
                container,
                webImageForm,
                imageInput;

            panelId = context.addPanel(AJS.I18n.getText("image.browser.web.image.title"), controller.getPanel(), "web-image-panel");

            webImageForm = controller.getForm();
            container = controller.getContainer();
            imageInput = controller.getImageInput();

            if (context.options && context.options.imageProperties && context.options.imageProperties.url) {
                context.selectPanel(panelId);
                imageInput.val(context.options.imageProperties.url).click();
                webImageForm.submit();
            }

            imageInput.bind("keyup click", function (e) {
                var val = $(this).val();
                context.clearSelection();
                context.selectedName = val;
                context.allowInsert(val != "" && val != "http://");
            });

            webImageForm.submit(function(e) {
                var src = imageInput.val(),
                    preview = container.find(".image-preview-area"),
                    throbber = container.find(".image-preview-throbber"),
                    killSpinner = Raphael.spinner(throbber[0], 60, "#666"),
                    error = container.find(".image-preview-error");
                throbber.removeClass("hidden");
                preview.addClass("faraway");
                error.addClass("hidden");
                preview.html("");
                $("<img>").load(function () {
                    killSpinner();
                    throbber.addClass("hidden");
                    preview.removeClass("faraway");
                }).error(function () {
                    killSpinner();
                    throbber.addClass("hidden");
                    error.removeClass("hidden");
                }).appendTo(preview).attr("src", src);
                e.preventDefault();
                return false;
            });

            controller.bindPanelSelection();
        }
    });
});
