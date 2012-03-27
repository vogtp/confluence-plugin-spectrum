AJS.toInit(function($) {
    var macroList = $("#user-macros-admin");
    if (macroList.length) {
        macroList.delegate(".remove", "click", function () {
            var macroKey = $(this).closest("tr").attr("data-macro-key");
            var confirmMessage = AJS.I18n.getText("remove.macro.confirmation.message", macroKey);
            return confirm(confirmMessage);
        });
    }

    var errors = $("div.error[id^=userMacro.]:first"),
        // Go to first error or first field
        focusId = errors.length ? errors.attr("id").replace("-error", "") : "userMacro.name";

    // Have to get via document method because jQuery doesn't handle dots in ids.
    var focusEl = document.getElementById(focusId);
    focusEl && focusEl.focus();
});