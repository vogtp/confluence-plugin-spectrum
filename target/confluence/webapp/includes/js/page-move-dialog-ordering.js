jQuery.fn.movePageOrdering = function (newSpaceKey, newParentPage, pageTitle, reorderFunction) {
    var $ = jQuery;
    
    var contextPath = $("#confluence-context-path").attr("content");
    var orderingContainer = $("#orderingPlaceHolder",  this);

    orderingContainer.addClass("loading").html(Confluence.Templates.MovePage.panelLoading());
    
    orderingContainer.load(
            contextPath + "/panels/reorderpage.action",
            {
                panelName: "reorder",
                spaceKey: newSpaceKey,
                title: newParentPage,
                movedPageId: AJS.params.pageId,
                pageTitle: pageTitle
            },
            function () {
                orderingContainer.removeClass("loading");                
                initialisePageOrderMechanism(orderingContainer, reorderFunction);
                scrollCurrentPageIntoView($(".siblings",orderingContainer));
            });


    /**
     * Calculate the targetId and the positional indicator for this
     * placement. The possible outcomes are - - previous sibling id, with
     * placement of below - next sibling id, with placement of above If
     * neither situation is found then the reorderFunction will not be
     * called.
     * 
     * @param clickPoint
     *            the place holder position clicked
     * @param reorderFunction
     *            function with the signature (targetId, indicator) which will
     *            be called with the result of the move
     */
    var siblingSelector = function(clickPoint, reorderFunction) {
        var positionIndicator;
        var target = clickPoint.prevAll("li.sibling")[0];
        if (target) {
            positionIndicator = "below";
        } else {
            positionIndicator = "above";
            target = clickPoint.nextAll("li.sibling")[0];
        }
        
        if (target) {
            AJS.log("Reorder: positionIndicator = " + positionIndicator + " and target = " + target.innerHTML);
            var targetId = $("i", target).text();
            reorderFunction(targetId, positionIndicator);
        }
    };
        
    var initialisePageOrderMechanism = function (container, reorderFunction) {
        
        var dropper = $(".dropper", container),
            target = $(".target", dropper);
        
        var placementPlaceholderIdCounter = 0;
        
        $("li", dropper).each(function (i) {
            !i && $(this).before($('<li class="leading">&nbsp;</li>'));
            $(this).after($('<li class="leading">&nbsp;</li>'));
        });
        var targetLeading = target.next();
        $(".leading", dropper).hover(function (e) {
            $(this).addClass("here");
        }, function () {
            $(this).removeClass("here");
        }).click(function () {
            siblingSelector($(this), reorderFunction);
            var lead = this;
            target.hide(150, function () {
                lead != targetLeading[0] && $(lead).after(targetLeading).after(target);
                target.show(150);
            });
        });
    };
    
    var scrollCurrentPageIntoView = function(container) {
        var currentPage = $(".target", container);
        
        if (currentPage.length) {
            // scroll into view
            var topOffset = currentPage.position().top;
            var containerHeight = container.height();
            if (topOffset < 0 || topOffset > containerHeight) {
                container.scrollTop(container.scrollTop() + topOffset - containerHeight / 3);
            }
        }
    };
};