AJS.toInit(function(g){var f=g("#add-members-section");var e=g("#list-members-section");var a=g("#switch-button");var h=g("#cancel-button");var c=g(".errorBox");var b=function(){f.show();e.hide();c.hide();a.text(g("#i18n-cancel-add").val());a.unbind("click",b);a.click(d);return false};var d=function(){e.show();f.hide();a.show();a.text(g("#i18n-add-members").val());a.unbind("click",d);a.click(b);g(".error").remove();return false};a.click(b);h.click(d);d()});function setPickerField(a){AJS.$("#usersToAdd").val(a)};