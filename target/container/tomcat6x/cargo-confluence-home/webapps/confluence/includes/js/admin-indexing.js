AJS.toInit(function ($) {

    var searchIndexProgress = $("#search-index-task-progress-container"),
        reindexTaskInProgress = $("#reindex-task-in-progress").length > 0,
        buildSearchIndexButton = $("#build-search-index-button"),
        searchIndexExists = $("#search-index-exists").length > 0,
        searchIndexDisablingOverlay = $("#search-index-disabling-overlay"),
        searchOverlayMessage = $("#search-overlay-message"),
        searchIndexPanelContents = $("#search-index-panel-contents"),
        searchIndexElapsedTime = $("#search-index-elapsed-time"),
        searchIndexElapsedTimeContainer = $("#search-index-elapsed-time-container"),
        searchIndexErrorStatus = $("#search-index-error-status"),
        searchIndexSuccessStatus = $("#search-index-success-status"),
        searchIndexInProgressStatus = $("#search-index-inprogress-status");

    var dymIndexProgress = $("#dym-index-task-progress-container"),
        dymIndexInProgress = $("#dym-index-in-progress").length > 0,
        buildDymIndexButton = $("#build-dym-index-button"),
        dymIndexExists = $("#dym-index-exists").length > 0,
        dymIndexDisablingOverlay = $("#dym-index-disabling-overlay"),
        readyToBuildDymIndex = $("#ready-to-build-dym-index").length > 0,
        dymLanguageCorrect = $("#language-correct-for-dym").length > 0,
        dymIndexPanelContents = $("#dym-index-panel-contents"),
        dymOverlayMessage = $("#dym-overlay-message"),
        dymIndexElapsedTime = $("#dym-index-elapsed-time"),
        dymIndexElapsedTimeContainer = $("#dym-index-elapsed-time-container"),
        dymIndexErrorStatus = $("#dym-index-error-status"),
        dymIndexSuccessStatus = $("#dym-index-success-status"),
        dymIndexInProgressStatus = $("#dym-index-inprogress-status");

    searchIndexDisablingOverlay.hide();
    dymIndexDisablingOverlay.hide();

    if (!searchIndexExists || searchIndexElapsedTime.html() == '') {
        searchIndexElapsedTimeContainer.hide();
    }

    if (!dymIndexExists || dymIndexElapsedTime.html() == '') {
        dymIndexElapsedTimeContainer.hide();
    }

    searchIndexProgress.progressBar(0);

    if (reindexTaskInProgress || !readyToBuildDymIndex) {
        // disable dym panel
        dymIndexDisablingOverlay.show();
        dymIndexPanelContents.addClass("faded");
        buildDymIndexButton.attr("disabled", "disabled"); // ie overlay doesn't prevent this button from being pressed, so we have to do it manually :/

        if (reindexTaskInProgress) {
            dymOverlayMessage.html($("#i18n-key-search-build-in-progress").val());
        } else {
            var overlayMessageHtml;
            if (!dymLanguageCorrect)
                overlayMessageHtml = $("#i18n-key-dym-wrong-language").val();
            else
                overlayMessageHtml = $("#i18n-key-build-index-first").val();
            
            dymOverlayMessage.html(overlayMessageHtml);
        }
    }

    if (reindexTaskInProgress) {

        buildSearchIndexButton.attr("disabled", "disabled");

        var searchInterval = setInterval(function () {
            $.getJSON(contextPath + '/json/reindextaskprogress.action', function (data) {
                searchIndexProgress.progressBar(data.percentageComplete);

                searchIndexElapsedTimeContainer.show(); 
                searchIndexElapsedTime.html(data.compactElapsedTime);

                if (data.percentageComplete == 100) {
                    buildSearchIndexButton.removeAttr("disabled");
                    buildDymIndexButton.removeAttr("disabled");

                    // renable dym panel
                    dymIndexDisablingOverlay.hide();
                    dymIndexPanelContents.removeClass("faded");

                    searchIndexSuccessStatus.show();
                    searchIndexErrorStatus.hide();
                    searchIndexInProgressStatus.hide();

                    clearInterval(searchInterval);
                }
            });
        }, 2000);
    }

    if (searchIndexExists && !reindexTaskInProgress) {
        searchIndexProgress.progressBar(100);
    }

    if (reindexTaskInProgress) {
        searchIndexInProgressStatus.show();
        searchIndexErrorStatus.hide();
        searchIndexSuccessStatus.hide();
    } else if (searchIndexExists) {
        searchIndexSuccessStatus.show();
        searchIndexErrorStatus.hide();
        searchIndexInProgressStatus.hide();
    } else {
        searchIndexErrorStatus.show();
        searchIndexSuccessStatus.hide();
        searchIndexInProgressStatus.hide();
    }

    dymIndexProgress.progressBar(0);

    if (dymIndexInProgress) {
        // disable search panel
        searchIndexDisablingOverlay.show();
        searchIndexPanelContents.addClass("faded");
        buildSearchIndexButton.attr("disabled", "disabled"); // ie overlay doesn't prevent this button from being pressed, so we have to do it manually :/

        searchOverlayMessage.html($("#i18n-key-dym-build-in-progress").val());
    }

    if (dymIndexInProgress) {
        buildDymIndexButton.attr("disabled", "disabled");
        var dymInterval = setInterval(function () {
            $.getJSON(contextPath + '/admin/didyoumean/index-progress.action', function (data) {
                dymIndexProgress.progressBar(data.percentComplete);

                dymIndexElapsedTimeContainer.show(); 
                dymIndexElapsedTime.html(data.compactElapsedTime);

                if (data.percentComplete == 100) {
                    buildDymIndexButton.removeAttr("disabled");
                    buildSearchIndexButton.removeAttr("disabled");

                    searchIndexDisablingOverlay.hide();
                    searchIndexPanelContents.removeClass("faded");

                    dymIndexSuccessStatus.show();
                    dymIndexErrorStatus.hide();
                    dymIndexInProgressStatus.hide();

                    clearInterval(dymInterval);
                }
            });
        }, 2000);
    }

    if (dymIndexExists && !dymIndexInProgress) {
        dymIndexProgress.progressBar(100);
    }

    if (dymIndexInProgress) {
        dymIndexInProgressStatus.show();
        dymIndexErrorStatus.hide();
        dymIndexSuccessStatus.hide();
    } else if (dymIndexExists) {
        dymIndexSuccessStatus.show();
        dymIndexErrorStatus.hide();
        dymIndexInProgressStatus.hide();
    } else {
        dymIndexErrorStatus.show();
        dymIndexSuccessStatus.hide();
        dymIndexInProgressStatus.hide();
    }

});

