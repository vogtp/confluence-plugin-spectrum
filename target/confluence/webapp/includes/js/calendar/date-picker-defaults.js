jQuery(function($){
     var shortestDays = [
            AJS.I18n.getText("sunday.short"),
            AJS.I18n.getText("monday.short"),
            AJS.I18n.getText("tuesday.short"),
            AJS.I18n.getText("wednesday.short"),
            AJS.I18n.getText("thursday.short"),
            AJS.I18n.getText("friday.short"),
            AJS.I18n.getText("saturday.short")
    ], shortDays = [
            AJS.I18n.getText("sunday.abbr"),
            AJS.I18n.getText("monday.abbr"),
            AJS.I18n.getText("tuesday.abbr"),
            AJS.I18n.getText("wednesday.abbr"),
            AJS.I18n.getText("thursday.abbr"),
            AJS.I18n.getText("friday.abbr"),
            AJS.I18n.getText("saturday.abbr")
    ], dayNames = [
            AJS.I18n.getText("sunday"),
            AJS.I18n.getText("monday"),
            AJS.I18n.getText("tuesday"),
            AJS.I18n.getText("wednesday"),
            AJS.I18n.getText("thursday"),
            AJS.I18n.getText("friday"),
            AJS.I18n.getText("saturday")
    ], monthNames   = [
            AJS.I18n.getText("january"),
            AJS.I18n.getText("february"),
            AJS.I18n.getText("march"),
            AJS.I18n.getText("april"),
            AJS.I18n.getText("may"),
            AJS.I18n.getText("june"),
            AJS.I18n.getText("july"),
            AJS.I18n.getText("august"),
            AJS.I18n.getText("september"),
            AJS.I18n.getText("october"),
            AJS.I18n.getText("november"),
            AJS.I18n.getText("december")

    ], monthNamesShort = [
            AJS.I18n.getText("january.abbr"),
            AJS.I18n.getText("february.abbr"),
            AJS.I18n.getText("march.abbr"),
            AJS.I18n.getText("april.abbr"),
            AJS.I18n.getText("may.abbr"),
            AJS.I18n.getText("june.abbr"),
            AJS.I18n.getText("july.abbr"),
            AJS.I18n.getText("august.abbr"),
            AJS.I18n.getText("september.abbr"),
            AJS.I18n.getText("october.abbr"),
            AJS.I18n.getText("november.abbr"),
            AJS.I18n.getText("december.abbr")
    ];//no defaults as will let our internationalisation system handle it


    //we set the default so that we dont have to have lots of .js files handling the language
	$.datepicker.regional[''] = {
		closeText:   AJS.I18n.getText("datepicker.close"),
		prevText:   AJS.I18n.getText("datepicker.prev"),
		nextText:   AJS.I18n.getText("datepicker.next"),
		currentText:   AJS.I18n.getText("datepicker.current"),
		monthNames: monthNames,
		monthNamesShort: monthNamesShort,
		dayNames: dayNames,
		dayNamesShort: shortDays,
		dayNamesMin: shortestDays,
		weekHeader:  AJS.I18n.getText("datepicker.week"),
		dateFormat: $.datepicker.ISO_8601,
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: false,
		yearSuffix: ''};
	$.datepicker.setDefaults($.datepicker.regional['']);
});