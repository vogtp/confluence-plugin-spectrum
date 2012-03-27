AJS.toInit(function ($) {


    var switchSimpleButton = $("#switch-simple");
    var switchAdvancedButton = $("#switch-advanced");

    var showUserSearch = function() {
        $("#user-search-section").show();
        $("#membership-search-section").hide();
        $("#user-tab").parent().addClass("current")
        $("#membership-tab").parent().removeClass("current");
        $("#searchTerm").select();
        return false;
    }

    var showMembershipSearch = function() {
        $("#membership-search-section").show();
        $("#user-search-section").hide();
        $("#membership-tab").parent().addClass("current")
        $("#user-tab").parent().removeClass("current");
        $("#groupTerm").select();
        return false;
    }

     switchSimpleButton.click(function() {
        $("#search-simple").show();
        $("#search-advanced").hide();
        return false;
    });

     switchAdvancedButton.click(function() {
        $("#search-advanced").show();
        $("#search-simple").hide();
        return false;
    });
    
    var disableSimpleMode = function() {
        $("#search-advanced").show();
        $("#search-simple").hide();
        $("#switch-simple").hide();
        return false;
    }


    $("#user-tab").click(showUserSearch).click(function(){$("#search-results").hide();});
    $("#membership-tab").click(showMembershipSearch).click(function(){$("#search-results").hide();});

    if($("#user-search").val() === "true") {
        showUserSearch();
    } else {
        showMembershipSearch();
    }

    if ($("#disable-simple-mode").val() === "false") {
        disableSimpleMode();
    }
});