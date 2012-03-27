if (typeof AJS.followCallbacks == "undefined") AJS.followCallbacks = [];

AJS.toInit(function($) {
    var followbox = $(".follow-user-box");
    followbox.length && followbox.autocomplete(contextPath + "/json/usersearch.action?filterDisabledUsers=true&query=", 2, function (data) {
		$("input[name=username]", $(data.input).parent()).val(data.username);
	});

    $(".follow-user").submit(function(e) {
        var hiddenInput = $("input[name=username]", $(this).parent());
        var user = hiddenInput.val();
        if (!user) {
            user = $(".follow-user-box").val();
        }
        AJS.safe.post(contextPath + "/ajax/followuser.action", { username : user },
                function(data) {
                    var $followUserResult = $(".follow-user-result");
                    $followUserResult.html(data);
                    $followUserResult.show(); 
                    var $followUserBox = $(".follow-user-box"); 
                    $followUserBox.val("");
                    $followUserBox.focus();
                    hiddenInput.val("");
                }
        );
        return AJS.stopEvent(e);
    });

    /**
     * follow text field place holder
     */
    var followUser = $(".follow-user-box");
    if (!followUser.length) {
        return;
    }

    var followUserDataKey = "followUserDataKey";
    var followUserBoxPlaceholder = AJS.params.followUserBoxPlaceholder;

    followUser.each(function() {
        $followUserBox = $(this);
        $followUserBox.data(followUserDataKey, {
            placeholder: followUserBoxPlaceholder,
            placeholded: true
        });
    });

    if (!$.browser.safari) {
        followUser.val(followUser.data(followUserDataKey).placeholder);

        followUser.addClass("placeholded");

        followUser.focus(function () {
            var $this = $(this);
            if ($this.data(followUserDataKey).placeholded) {
                $this.data(followUserDataKey).placeholded = false;
                $this.val("");
                $this.removeClass("placeholded");
            }
        });

        followUser.blur(function () {
            var $this = $(this);
            if ($this.data(followUserDataKey).placeholder && (/^\s*$/).test($this.val())) {
                $this.val($this.data(followUserDataKey).placeholder);
                $this.data(followUserDataKey).placeholded = true;
                $this.addClass("placeholded");
            }
        });

    }
    else {
        followUser.each(function() {
            $followUserBox = $(this);
            $followUserBox.attr("placeholder", followUserBoxPlaceholder);
        });
        followUser.val("");
    }

});
