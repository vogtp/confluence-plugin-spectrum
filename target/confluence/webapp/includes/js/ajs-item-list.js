(function () {
    var AJS = window.AJS || {};

    function ListUnique() {
        this.node = AJS("ol").addClass("aui-items-list").hide();
    }

    function ListNotUnique() {
        this.node = AJS("ol").addClass("aui-items-list").hide();
    }

    ListUnique.prototype.beforeAdd = ListNotUnique.prototype.beforeAdd = function () { return true; };

    ListUnique.prototype.onAdd = ListNotUnique.prototype.onAdd = function () {};

    ListUnique.prototype.beforeRemove = ListNotUnique.prototype.beforeRemove = function () { return true; };

    ListUnique.prototype.onRemove = ListNotUnique.prototype.onRemove = function () {};

    ListUnique.prototype.add = function (value, name) {
        var list = this;
        name = name || value;
        this.items = this.items || [];
        this.values = this.values || {};
        if (!(value in this.values) && this.beforeAdd.call({ value: value, name: name})) {
            this.items.push(value);
            this.values[value] = {
                name: name,
                id: this.items.length - 1,
                remove: function (isForced) {
                    list.items.splice(list.values[value].id, 1);
                    delete list.values[value];

                    list.onRemove.call({ value: value });
                    if (isForced === true) {
                        li.remove();
                    } else {
                        li.slideUp("fast", function () {
                            li.remove();
                        });
                    }
                    if (!list.length) {
                        list.node.hide();
                    }
                }};
            var li = AJS("li"),
                span = AJS("span", name),
                btn = AJS("button", "x").click(this.values[value].remove);
            li.append(span).append(btn);
            this.node.append(li);
            this.onAdd.call({
                li: li,
                span: span,
                button: btn,
                value: value,
                name: name,
                remove: list.values[value].remove
            });
            if (list.length) {
                list.node.show();
            }
            return true;
        } else {
            return false;
        }
    };

    ListNotUnique.prototype.add = function (value, name) {
        var list = this;
        name = name || value;
        this.items = this.items || [];
        this.values = this.values || [];
        if (this.beforeAdd.call({ value: value, name: name})) {
            this.items.push(value);
            this.values.push({
                name: name,
                value: value,
                remove: (function (id) {
                    return function (isForced) {
                        list.items.splice(id, 1);
                        list.values.splice(id, 1);

                        list.onRemove.call({ value: value });
                        if (isForced === true) {
                            li.remove();
                        } else {
                            li.slideUp("fast", function () {
                                li.remove();
                            });
                        }
                        if (!list.length) {
                            list.node.hide();
                        }
                    };
                })(this.items.length - 1)});
            var li = AJS("li"),
                span = AJS("span", name),
                btn = AJS("button", "x").click(this.values[this.values.length - 1].remove);
            li.append(span).append(btn);
            this.node.append(li);
            this.onAdd.call({
                li: li,
                span: span,
                button: btn,
                value: value,
                name: name,
                remove: list.values[list.values.length - 1].remove
            });
            if (list.length) {
                list.node.show();
            }
            return true;
        }
        return false;
    };

    ListNotUnique.prototype.remove = function (value, isForced) {
        if (this.beforeRemove.call({ value: value })) {
            var item = this.values[AJS.$.inArray(value, this.items)];
            item && item.remove(isForced);
            return !!item;
        }
        return false;
    };

    ListUnique.prototype.remove = function (value, isForced) {
        if (this.beforeRemove.call({ value: value })) {
            this.values[value] && this.values[value].remove(isForced);
            return !!this.values[value];
        }
        return false;
    };

    ListNotUnique.prototype.clear = function () {
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            this.remove(this.items[i], true);
        }
    };
    
    ListUnique.prototype.clear = function () {
        for (var value in this.values) {
            this.remove(value, true);
        }
    };

    ListNotUnique.prototype.length = ListUnique.prototype.length = function () {
        return this.items.length;
    };

    ListUnique.prototype.contains = function (value) {
        return (value in this.values);
    };

    ListNotUnique.prototype.contains = function (value) {
        return !!(AJS.$.inArray(value, this.items) + 1);
    };

    ListUnique.prototype.get = ListNotUnique.prototype.get = function () {
        return this.items.concat([]);
    };

    AJS.itemsList = function (isNotUnique) {
        return new (isNotUnique ? ListNotUnique : ListUnique)();
    };
})();