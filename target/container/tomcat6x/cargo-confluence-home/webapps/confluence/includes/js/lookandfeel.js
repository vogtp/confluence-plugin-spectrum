AJS.toInit(function ($) {
    $(".colour-input").change(function () {
        $("#swatch." + this.id).css("background-color", this.value);
    });

    $(".colour-image").click(function () {
        // todo - better way to get the colour key?
        var list = this.id.split("image.");
        var colourKey = list[1];
        window.open(AJS.params.contextPath + '/colourpicker.action?colourKey=' + colourKey, 'colourPicker',
        'menubar=yes,location=no,personalbar=no,scrollbar=yes,width=580,height=300,resizable');
    });

    $("#edit-scheme-link").click(function () {
        $("#edit-scheme").toggleClass("hidden");
        return false;
    });
});
