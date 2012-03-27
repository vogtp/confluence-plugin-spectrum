/**
 * User Hover Binder component.
 * Expected markup:
 * &lt;a class="confluence-userlink" data-username="test"&gt;Test User&lt;/a&gt;
 * <br>
 * Events Thrown:
 * hover-user.open, hover-user.follow
 * 
 * @class userHover
 * @namespace AJS.Confluence.Binder
 */
Confluence.Binder.userHover = (function() {

    // global list of IDs to ensure user-hovers don't get reloaded unnecessarily
    var users = [],
        contextPath = Confluence.getContextPath(),
        $ = AJS.$;

    var contentHoverPostProcess = function(id) {
        var username = users[id],
            data = { username: username, target: this };
        $(self).trigger("hover-user.open", data);
        $(".ajs-menu-bar", this).ajsMenu();
        $(".follow, .unfollow", this).each(function() {
            var $this = $(this).click(function(e) {
                if ($this.hasClass("waiting")) {
                    return;
                }
                var url = $this.hasClass("unfollow") ? "/unfollowuser.action" : "/followuser.action";
                $this.addClass("waiting");
                AJS.safe.post(contextPath + url + "?username=" + username + "&mode=blank", {}, function() {
                    $this.removeClass("waiting");
                    $this.parent().toggleClass("follow-item").toggleClass("unfollow-item");
                    $(self).trigger("hover-user.follow", data);
                });
                return AJS.stopEvent(e);
            });
        });
    };

    var selectors = [
            "span.user-hover-trigger",
            "a.confluence-userlink",
            "img.confluence-userlink",
            "a.userLogoLink"
    ].join(", ");

    return function () {
        $(selectors).filter("[data-user-hover-bound!='true']").each(function() {
            var userlink = $(this),
                username = userlink.attr("data-username");

            // Ensure no "popup" title will clash with the user hover.
            userlink.attr("title", "")
                    .attr("data-user-hover-bound", "true");
            $("img", userlink).attr("title", "");

            var arrayIndex = $.inArray(username, users);
            if (arrayIndex == -1) {
                users.push(username);
                arrayIndex = $.inArray(username, users);
            }
            $(this).addClass("userlink-" + arrayIndex);
        });

        $.each(users, function(i) {
            AJS.contentHover($(".userlink-" + i), i, contextPath + "/users/userinfopopup.action?username=" + users[i], contentHoverPostProcess);
        });
    };
})();