(function() {
    function addEvent(obj, type, fn)
    {
        if (obj.addEventListener)
            obj.addEventListener(type, fn, false);
        else if (obj.attachEvent)
        {
            obj["e" + type + fn] = fn;
            obj[type  + fn] = function() {
                obj["e" + type + fn](window.event);
            };
            obj.attachEvent("on" + type, obj[type + fn]);
        }
    }


    function stopEvent(e) {
        if (e.stopPropagation)
            e.stopPropagation();
        if (e.preventDefault)
            e.preventDefault();

        e.cancelBubble = true;
        e.returnValue  = false;
        return false;
    }


    var EP = {
        name: "Entity Picker",
        rows: {
            length: 0,
            last: null,
            add: function(cb) {
                this[this.length++] = cb;
            },
            changeTo: function(value, shifted) {
                var from = (typeof shifted == "undefined")?0:(this.lastrow == null)?0:this.lastrow;
                var to = (typeof shifted == "undefined")?this.length:shifted + 1;
                for (var i = Math.min(from, to), ii = Math.max(from, to); i < ii; i++) {
                    this[i].parentNode.parentNode.checked = this[i].checked = value;
                }
            },
            update: function() {
                var allChecked = true;
                for (var i = 0, ii = this.length; i < ii; i++) {
                    allChecked = allChecked && this[i].checked;
                }
                EP.topcheckbox.checked = allChecked;
            },
            toString: function() {
                var res = [];
                for (var i = 0, ii = this.length; i < ii; i++) {
                    if (this[i].checked) {
                        res.push(this[i].value.replace(/([\\,])/g, "\\$1"));
                    }
                }
                return res.join(", ");
            }
        }
    };

    function init() {
        var table = document.getElementById("entitySearchResults");
        if (table) {
            try {
                EP.topcheckbox = table.getElementsByTagName("thead")[0].getElementsByTagName("input")[0];
                if (!EP.topcheckbox) {
                    throw "Top checkbox does not exist";
                }
                EP.topcheckbox.onclick = function() {
                    EP.rows.changeTo(this.checked);
                };
                EP.button = document.getElementById("select-entities");
                if (!EP.button) {
                    throw "Select button does not exist";
                }
                EP.button.onclick = function() {
                    // callback className may be something like "AJS.PagePermissions.addUserPermissions"
                    var callback = opener;
                    var callbackPath = this.className.split(".");
                    while (callbackPath.length) {
                        callback = callback[callbackPath.shift()];
                    }
                    callback(EP.rows.toString());
                    window.close();
                };
                var trs = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
                for (var i = 0, ii = trs.length; i < ii; i++) {
                    var cb = trs[i].getElementsByTagName("input")[0];
                    if (cb.type = "checkbox") {
                        trs[i].checked = cb.checked;
                        EP.rows.add(cb);
                    }
                    trs[i].number = i;
                    trs[i].onclick = function(e) {
                        var ev = e || window.event;
                        if (ev.shiftKey) {
                            EP.rows.changeTo(!this.checked, this.number);
                        } else {
                            EP.rows[this.number].checked = this.checked = !this.checked;
                        }
                        if (this.checked) {
                            EP.rows.last = this.number;
                        }
                        EP.rows.update();
                    };
                }
            } catch (e) {
                if (typeof console != "undefined") {
                    console.log(e);
                }
            }
        }
    }

    addEvent(window, "load", init);
})();