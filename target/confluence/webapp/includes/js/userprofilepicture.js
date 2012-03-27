(function ($){
	$(function () {
		var toggleDeleteButton = function() {
			var deleteButton = $("#userphoto-delete-button");
			if ($(".userphoto-selected").is(".userphoto-uploaded")) {
				deleteButton.attr("disabled", false);
			} else {
				deleteButton.attr("disabled", true);
			}
		}
		var toggleSelected = function (e) {
            var selectedPrefix = $("#i18n-accessibility-profile-picture-selected").val();
            var availablePrefix = $("#i18n-accessibility-profile-picture-available").val();

            var newSelectedImage = $(e.target);
            var newSelectedImageAlt = newSelectedImage.attr("alt").split(":", 2)[1];

            var oldSelectedImage = $(".userphoto-selected");
            if (oldSelectedImage.size() > 0) {
                var oldSelectedImageAlt = oldSelectedImage.attr("alt").split(":", 2)[1];
                oldSelectedImage.removeClass("userphoto-selected");
                oldSelectedImage.attr("alt", availablePrefix + ":" + oldSelectedImageAlt);
            }
			newSelectedImage.addClass("userphoto-selected");
            newSelectedImage.attr("alt", selectedPrefix + ":" + newSelectedImageAlt);

            /* Just in case. The fact the image is inside a label should do this for us. */
            $(e.target).parent().prev().click();

            toggleDeleteButton();
		}

		$(".userphoto").click(toggleSelected);

		toggleDeleteButton();
    });
})(jQuery);
