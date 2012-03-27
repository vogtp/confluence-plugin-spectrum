AJS.toInit(function ($) {
    var panelId;

    /**
     * Default controller
     */
    var defaultController = function(context) {
        var getPanelElement = function() {
                return $(".search-panel", context.baseElement);
            },
            getContainer = function() {
                return $("#searched-images");
            },
            getForm = function() {
                return $(".search-form", context.baseElement);
            },
            getSearchText = function() {
                return $("input.search-text", getForm());
            },
            getQuery = function() {
                return getSearchText().val();
            },
            getSpaceKey = function() {
                return $(".search-space", getForm()).val();
            },
            focus = function() {
                getSearchText().focus();
            };
        return {
            clearContainer: function() {
                var imageContainer = getContainer();
                imageContainer.find(".loading-message").removeClass("hidden");
                imageContainer.find(".image-list").empty();
                imageContainer.find(".warning").remove();
            },
            getPanelElement: getPanelElement,
            getForm: getForm,
            getContainer: getContainer,
            getSpaceKey: getSpaceKey,
            getQuery: getQuery,
            getPanel: function() {
                return Confluence.Templates.Image.searchPanel({
                    spaceKey: AJS.Meta.get("space-key"),
                    spaceName: AJS.Meta.get("space-name")
                });
            },
            /**
             *
             * @param params { success: function() {...}, error: function() {...} }
             */
            loadImages: function(params) {
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    url: Confluence.getContextPath() + AJS.REST.getBaseUrl() + "search.json",
                    data: {
                        spaceKey: getSpaceKey(),
                        query: getQuery(),
                        search: "name",
                        type: "attachment",
                        attachmentType: [ "image" ],
                        groupResults: false,
                        searchParentName: true,
                        pageSize: Confluence.Defaults.maxResults
                    },
                    success: params.success,
                    error: params.error
                });
            },
            bindPanelSelection: function() {
                // FIXME - CONFDEV-2365 - can't bind using Jquery
                context.getPanel(panelId).onselect = focus;
            }

        };
    };

    Confluence.Editor.ImageDialog.panelComponent.push({

        id: "search",

        /**
         *
         * @param context the parent context
         * @param controller (optional) a function for constructing a controller.
         */
        createPanel: function(context, controller) {
            var controller = (controller && controller(context)) || defaultController(context),
                searchForm,
                searchContainer;

            panelId = context.addPanel(AJS.I18n.getText("image.browser.search.title"), controller.getPanel(), "search-panel");

            searchForm = controller.getForm();
            searchForm.focusin(context.clearSelection);
            searchContainer = controller.getContainer();

            searchForm.submit(function(e) {
                var query = controller.getQuery();

                try {
                    if (query) {
                        controller.clearContainer();
                        controller.loadImages({
                            success: function(json) {
                                if (json.result) {
                                    controller.clearContainer();
                                    var highlighter = new Confluence.Highlighter(query.split(" "));
                                    context.imageContainerSupport.refreshImageList(context, { /* panelContext */
                                        imageContainer: controller.getContainer(),
                                        images: json.result,
                                        noImageMessage: AJS.I18n.getText("image.browser.search.no.attachments"),
                                        justAttached: false,
                                        showParentTitle: true,
                                        highlighter: highlighter
                                    });
                                }
                            },
                            error: function () {
                                searchContainer.find(".loading-message").addClass("hidden");
                                searchContainer.append($("<p></p>").addClass("warning").text(AJS.I18n.getText("image.browser.error.search")));
                            }
                        })
                    }
                } finally {
                    e.preventDefault();
                }
                return false;
            });

            controller.bindPanelSelection();
            context.imageContainerSupport.bindImageContainer(searchContainer, context);
        }
    });
});