AJS.toInit(function($) {
	var shouldSumbitProfileForm = false;
	var dialog = new AJS.ConfluenceDialog({
        width: 465,
        height: 230,
        id: "password-dialog"
	});
	dialog.addHeader(AJS.I18n.getText("reenter.password.dialog.name"));
	dialog.addPanel("Password", "pwd");
	var $passwordField = $("#password");
	dialog.getCurrentPanel().html(AJS.renderTemplate("re-enter-password-dialog"));
	var submitPassword = function() {
		$("#passwordconfirmation").attr("value", $("#password").attr("value"));
		shouldSumbitProfileForm = true;
		$('#editmyprofileform').submit();
		return false;
	};

	dialog.addButton(AJS.I18n.getText("reenter.password.button") , submitPassword);
	dialog.addCancel(AJS.I18n.getText("cancel.name") , function(){
		dialog.hide();
        return false;
	});
	
	$('#confirm-password').submit(submitPassword);
	var originalEmail = $("#originalemail").attr("value");
	var $emailField = $("#email");
	
	$('#editmyprofileform').submit(function(e) {
		if (shouldSumbitProfileForm){
			shouldSumbitProfileForm = false;
			return true;
		}
		if ($emailField.attr("value") != originalEmail)
		{
			dialog.show();
			$passwordField.focus();
			return false;
		} else {
			return true;
		}
	});
	
	$('#cancel').click(function(e) {
		shouldSumbitProfileForm = true;
		return true;
	});
});