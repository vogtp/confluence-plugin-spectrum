AJS.toInit(function ($) {

    // CONF-13119 - not all themes will make use of the supporting-site-search-form so only do this is necessary
    var transferQueryStringValue = function() { /* do nothing */ };
    var supportingSiteSearchForm = $('#supporting-site-search-form');
    
    if (supportingSiteSearchForm.length) {
        supportingSiteSearchForm.append($('#query-string')).append('&nbsp;').append($('#search-query-submit-button'));
        $('#site-search-form').prepend('<input type="hidden" id="hidden-query-string" name="queryString">');        
        transferQueryStringValue = function() {
            $("#hidden-query-string").val($("#query-string").val());
        };        
    }

    $("#supporting-site-search-form").submit(function (e) {
        transferQueryStringValue();
        $("#site-search-form").submit();

		e.preventDefault();
		return false; 
	});

	// set timeout on ajax json requests to 15s
	$.ajaxSetup({timeout: 15000});
	
    var lastSelectedValue,
        userSearchField = $("#search-filter-by-contributor-autocomplete");

    userSearchField.bind("selected.autocomplete-user", function(e, data){
        lastSelectedValue = userSearchField.val();
    });

	$("#site-search-form").submit(function(e) {
        transferQueryStringValue();
		// decide on whether the last selection made in the autocomplete list has since been over-typed
		// and if it has use the content of the field instead of the hidden field populated by the last selection.
		if (lastSelectedValue != userSearchField.val()) {
			$("#search-filter-by-contributor-hidden").val("");
		}
	});

    $("#secondary-search").submit(function (e) {
        $("#query-string").val($("#secondary-search input[type=text]").val());

        $("#supporting-site-search-form").submit();

		return AJS.stopEvent(e);
    });
});

