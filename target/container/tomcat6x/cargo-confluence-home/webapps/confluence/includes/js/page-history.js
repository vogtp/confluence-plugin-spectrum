/**
 * Behaviour for the Page History screen.
 */

AJS.toInit(function($) {

    /**
     * Returns the table row the click/mouseover/mouseout event came from.
     */
    var getTargetRow = function(e) {
        return $(e.target).closest("tr");
    };

    /**
     * Allow the user to check/uncheck the checkbox by clicking anywhere in the row.
     */
	var versionRowClick = function(e) {

		// Don't do anything if a link was clicked.
		if ($(e.target).is('a'))
            return;

        var row = getTargetRow(e);
		var theCheckbox = row.find("input")[0];
        if (!theCheckbox)
            return;   // Ignore clicks in rows without checkboxes (e.g. the header)

        // If user clicked on checkbox itself default handler will toggle it otherwise we do it here.
        if (e.target != theCheckbox) {
            theCheckbox.checked = !theCheckbox.checked;
        }

        // Add a highlight to checked rows
	    if (theCheckbox.checked) {
            // Only allow two boxes to be checked
            if ($("input:checked", this).length <= 2) {
                row.addClass('page-history-item-selected');
            } else {
                theCheckbox.checked = false;
            }
        } else {
            row.removeClass('page-history-item-selected');
        }
	};

    // Use mouseovers instead of :hover for IE.
	var mouseOver = function(e) {
		getTargetRow(e).addClass('page-history-item-mouseover');
	};
	var mouseOut = function(e) {
		getTargetRow(e).removeClass('page-history-item-mouseover');
	};

	$("#page-history-container").click(versionRowClick).mouseover(mouseOver).mouseout(mouseOut);
});