(function ($) {
    var removeSummary = function(summaryDiv) {
        AJS.$(summaryDiv).slideUp(function() {
            AJS.$(summaryDiv).remove();
        });
    };

    var recordMove = function (sourceId, targetId, position) {
        $.getJSON(
            AJS.params.contextPath + "/pages/movepage.action",
            {pageId: sourceId, position: position, targetId: targetId},
            ajaxCallback
        );
    };

    var ajaxCallback = function(data) {
        var error = "";
        if (data.actionErrors && data.actionErrors.length) {
            error = data.actionErrors.join("<br>");
            AJS.log("ajax parameters invalid : "+error);
        }
        $("#resultsDiv").html(error);
    };

    AJS.toInit(function ($) {
        var tree = $("#tree-div").tree({
            url: AJS.params.contextPath + '/pages/children.action',
            initUrl: AJS.params.contextPath + "/pages/children.action?spaceKey=" + encodeURIComponent(AJS.Meta.get('space-key')) + "&node=root",
            parameters: ["pageId"],
            nodeId: "pageId",
            drop: function () {
                function Colour() {
                    if (arguments.length == 1 && arguments[0][0] == "#") {
                        var colour = arguments[0].substring(1, 7);
                        if (colour.length == 3) {
                            colour = colour[0] + colour[0] + colour[1] + colour[1] + colour[2] + colour[2];
                        }
                        this.R = parseInt(colour.substring(0, 2), 16);
                        this.G = parseInt(colour.substring(2, 4), 16);
                        this.B = parseInt(colour.substring(4), 16);
                    } else if (arguments.length == 3) {
                        this.R = parseInt(arguments[0], 10);
                        this.G = parseInt(arguments[1], 10);
                        this.B = parseInt(arguments[2], 10);
                    } else {
                        return false;
                    }
                    this.toString = function () {
                        return "#" + this.R.toString(16) + this.G.toString(16) + this.B.toString(16);
                    };
                }
                var colourTransition = function (el) {
                    var startColour = new Colour("#d8e4f1"),
                        endColour = new Colour("#fff"),
                        R = startColour.R,
                        dR = endColour.R - startColour.R,
                        G = startColour.G,
                        dG = endColour.G - startColour.G,
                        B = startColour.B,
                        dB = endColour.B - startColour.B;
                    return {
                        start: 0.0,
                        end: 1.0,
                        animate: function (pos) {
                            el.style.backgroundColor = new Colour(R + dR * pos, G + dG * pos, B + dB * pos);
                        },
                        onFinish: function () {
                            el.style.backgroundColor = "";
                        }
                    };
                };
                AJS.animation.add(colourTransition(this.source));
                AJS.animation.duration = 500;
                AJS.animation.start();
                recordMove(this.source.pageId, this.target.pageId, this.position);
            },
            order: function() {
                // "order" means doing the alphanum order, i.e. reverting the manual order
                var pageId = this.source.pageId;
                $.getJSON(
                    AJS.params.contextPath + "/pages/revertpageorder.action",
                    {pageId: pageId},
                    ajaxCallback
                );
            },
            orderUndo: function() {
                // "orderUndo" means undoing the alphanum order, i.e. setting manual order again
                var pageId = this.source.pageId;
                var orderedChildIds = jQuery.map(this.orderedChildren, function(li) {
                    return li.pageId;
                }).join();
                $.getJSON(
                    AJS.params.contextPath + "/pages/setpageorder.action",
                    {pageId: pageId, orderedChildIds: orderedChildIds},
                    ajaxCallback
                );
            },
            // Can only remove directly from the tree if Administrator.
            // CONF-12459 : Power-mode disabled.
            /*isAdministrator: AJS.params.isAdministrator,
            remove: function() {
                var confirmed = window.confirm(AJS.params.removePageConfirmLabel);
                if (confirmed) {
                    var pageNode = this.source;
                    var pageId = pageNode.pageId;
                    $(pageNode).slideUp(function() {
                        $("> ul > li", pageNode).appendTo($(".ui-tree"));
                        pageNode.parentNode.removeChild(pageNode);
                    });
                    $.getJSON(
                        AJS.params.contextPath + "/pages/doremovepage.action",
                        {pageId: pageId}
                    );
                }
            },
            preview: function() {
                var pageNode = this.node;

                var summary = $("div.preview-summary", pageNode);
                if (summary.length) {
                    removeSummary(summary);
                    return;
                }

                var pageId = pageNode.pageId;
                var url = AJS.params.contextPath + "/pages/summary.action?pageId=" + pageId;
                $.getJSON(url, function (summaryData) {
                    var created = summaryData.createddate;

                    //## TODO - Could use templates at back end, to reduce suck?
                    var metaDivHtml = "<p><strong>Created : </strong>" + summaryData.createddate +
                                        " by <em>" + summaryData.createdby + "</em><br>" +
                                        "<strong>Last updated : </strong>" + summaryData.lastupdateddate +
                                        " by <em>" + summaryData.lastupdatedby + "</em></p>";

                    var excerpt = summaryData.excerpt;
                    excerpt = excerpt.replace(/\n/g, "<br>");

                    var div = document.createElement("div");
                    div.className = "preview-summary";

                    var metaDiv = document.createElement("div");
                    metaDiv.className = "preview-excerpt";
                    $(metaDiv).html(metaDivHtml);
                    div.appendChild(metaDiv);

                    var excDiv = document.createElement("div");
                    excDiv.className = "preview-excerpt";
                    $(excDiv).html(excerpt);
                    div.appendChild(excDiv);

                    $(div).hide();
                    pageNode.appendChild(div);
                    $(div).slideDown();

                    $(div).click(function(event) {
                        removeSummary(event.currentTarget);
                    });
                });
            },*/
            onready: function () {
                if(!AJS.params.expandedNodes) {
                    AJS.params.expandedNodes = [];
                }
                if(AJS.params.openId) {
                    var doHighlight = function() {
                        tree.findNodeBy("pageId", AJS.params.openId).highlight();
                    };
                }
                var nodes = [];
                for (var i = 0, ii = AJS.params.expandedNodes.length; i < ii; i++) {
                    nodes[i] = {pageId: AJS.params.expandedNodes[i]};
                }
                tree.expandPath(nodes.reverse(), doHighlight);
            }
        });
    });
})(AJS.$);
