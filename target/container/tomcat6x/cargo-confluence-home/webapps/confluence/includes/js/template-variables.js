function updateOthers(e) {
    var fields = AJS.$("input[name='" + e.name + "']");

    AJS.$.each(fields, function(index, field) {
       field.value = e.value;
    });
}
