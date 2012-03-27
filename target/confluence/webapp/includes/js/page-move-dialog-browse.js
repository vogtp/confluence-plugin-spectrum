/**
 * The 'Browse' panel with a tree view in the move page dialog.
 *
 * @param controls includes a 'select' and 'error' callback for handling those events on this panel
 * @param newSpaceKey the space key selected by the user in another panel. The tree should change to show this space.
 * @param newSpaceName the name of the space selected by the user
 * @param newParentPage the parent page selected by the user in another panel. The tree should expand to show this page.
 * @param originalParent the original parent page of the current page. The tree should also expand to show this page.
 * @param pageTitle the current title for the page being moved (for display in the tree).
 */

jQuery.fn.movePageBrowse = function (controls, newSpaceKey, newSpaceName, newParentPage, originalParent, pageTitle) {
    var $ = jQuery;
    var contextPath = $("#confluence-context-path").attr("content");
    var container = this;

    var treeContainer = $(".tree", container);
    treeContainer.addClass("loading").html(Confluence.Templates.MovePage.panelLoading());

    var tree,
        onready = function () {
            treeContainer.removeClass("rendering").addClass("expanding");
            $("#parent-selection-tree .dialog-button-panel").remove();

            expandToPage(AJS.Meta.get('space-key'), originalParent, function (found) {
                if (found && originalParent != "") {
                    var parentPageNode = tree.findNodeBy("text", originalParent);
                    if (parentPageNode) {
                        parentPageNode.$.find("> a").addClass("current-parent");
                    }
                }

                // Make the node for the current page unclickable. Additionally, if the title of the current page has
                // been changed in the edit screen then update it in the tree
                var originalTitle = AJS.Meta.get('page-title');
                if (found && originalTitle) {
                    var pageNode = tree.findNodeBy("text", originalTitle);
                    if (pageNode) {
                        pageNode.makeUnclickable();
                        
                        if (originalTitle != pageTitle) {
                            // the user has changed the title on the edit screen so update the tree
                            pageNode.setText(pageTitle);
                        }
                    }
                }

                expandToPage(newSpaceKey, newParentPage, function (found) {
                    if (found) {
                        var selectedNode = tree.findNodeBy("text", newParentPage);
                        if (selectedNode) {
                            selectedNode.$.find("> a").addClass("highlighted");

                            // scroll into view
                            var topOffset = selectedNode.$.position().top;
                            var containerHeight = treeContainer.height();
                            if (topOffset < 0 || topOffset > containerHeight) {
                                treeContainer.scrollTop(treeContainer.scrollTop() + topOffset - containerHeight / 3);
                            }
                        }
                    }

                    treeContainer.removeClass("expanding");
                });
            });
        };

    var clickHandler = function (e) {
        e.preventDefault(); // don't follow the link that was clicked

        $("a.highlighted", treeContainer).removeClass("highlighted");
        $(this).addClass("highlighted");

        newSpaceKey = $("#chosenSpaceKey").val();
        newSpaceName = $("#chosenSpaceKey option:selected").text();
        newParentPage = $(this).hasClass("root-node")
            ? ""                           // clicked on space
            : $(this).find("span").text(); // clicked on page
        controls.select(newSpaceKey, newSpaceName, newParentPage);
    };

    var initialiseSpacePicker = function () {
        // initialise the space selector (if there is one - if only one space available then it will be a hidden input)
        $("select#chosenSpaceKey").val(newSpaceKey).change(function () {
            var spaceKey = $(this).val();
            var spaceName = $(this).find("option:selected").text();

            $("#tree-root-node-item a").text(spaceName)
                .toggleClass("highlighted", newSpaceKey == spaceKey && newParentPage == "")
                .toggleClass("current-parent", AJS.Meta.get('space-key') == spaceKey && originalParent == "");

            treeContainer.addClass("rendering");
            tree = tree.reload({
                initUrl: contextPath + "/pages/children.action?spaceKey=" + encodeURIComponent(spaceKey) + "&node=root"
            });
        });

        // create and initialise the treeRootDiv
        $("#tree-root-div").html(Confluence.Templates.MovePage.browsePanelSpace({linkText: newSpaceName}))
            .find("a").click(clickHandler)
                .toggleClass("highlighted", newParentPage == "")
                .toggleClass("current-parent", AJS.Meta.get('space-key') == newSpaceKey && originalParent == "");
    };

    var expandToPage = function (spaceKey, pageTitle, callback) {
        if (spaceKey != $("#chosenSpaceKey").val()) {
            callback(false);
            return;
        }
        console.log("before breadcrumbs");
        AJS.MoveDialog.getBreadcrumbs({spaceKey:spaceKey, title:pageTitle}, function (breadcrumbs) {
            var toExpand = $.map(breadcrumbs.slice(1), function (o) {
                return { text: o.title };
            });
            console.log("before expandPath");
            tree.expandPath(toExpand, function () {
                console.log("expandPath callback");
                callback(true);
            });
        }, function () {
            controls.error("Could not retrieve tree expansion information.");
            callback(false);
        });
    };

    treeContainer.load(
        contextPath + "/panels/browsepagelocation.action",
        {
            panelName: "browse",
            dialogMode: "view",
            spaceKey: newSpaceKey,
            parentPageString: newParentPage,
            pageId: AJS.params.pageId
        },
        function () {
            treeContainer.removeClass("loading").addClass("rendering");

            initialiseSpacePicker();

            tree = $("#parent-selection-tree").tree({
                url: contextPath + "/pages/children.action",
                initUrl: contextPath + "/pages/children.action?spaceKey=" + encodeURIComponent(newSpaceKey) + "&node=root",
                parameters: ["pageId", "text"],
                undraggable: true,
                spinnerId: "move-page-dialog-spinner",
                nodeId: "pageId",
                click: clickHandler,
                onready: onready,
                oninsert: function () {
                    var $li = this.$;
                    if ($li.parents("li:first").attr("unclickable")) {
                        this.makeUnclickable();
                    }
                }
            });
            AJS.MoveDialog.tree = tree;
        }
    );

};
