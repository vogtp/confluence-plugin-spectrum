// TODO CONFDEV-4208 - note, this is forked from JIRA code as of r142772 - if it works in Confluence it should be moved to AUI. dT
// See https://atlaseye.atlassian.com/browse/jira/jira/trunk/jira-components/jira-webapp/src/main/webapp/includes/ajs/group/Group.js
// for the original.

/**
 * A group manages focus for a list of items so that only one item has focus at a time.
 *
 * @constructor AJS.Group
 * @extends AJS.Control
 */
AJS.Group = AJS.Control.extend({

	init: function() {
        this.type = this.type || 'Group';
		this.items = [];
		this.index = -1;
        this._assignEvents("instance", this);
	},

    /**
     * Add an item to this group.
     *
     * @method addItem
     * @param {AJS.Control} item
     */
	addItem: function(item) {
		this.items.push(item);
		this._assignEvents("item", item);
	},

    /**
     * Remove an item from this group.
     *
     * @method removeItem
     * @param {AJS.Control} item
     */
	removeItem: function(item) {
        var index = AJS.$.inArray(item, this.items);
        if (index < 0) {
            throw new Error("AJS.Group: item [" + item + "] is not a member of this group");
        }
        item.trigger("blur");
        if (index < this.index) {
            this.index--;
        }
        this.items.splice(index, 1);
        this._unassignEvents("item", item);
	},

    /**
     * Remove all items from this group.
     *
     * @method removeAllItems
     */
	removeAllItems: function() {
        for (var i = 0; i < this.items.length; i++) {
            this._unassignEvents("item", this.items[i]);
            this.items[i].trigger("blur");
        }
        this.index = -1;
        this.items.length = 0;
        this._unassignEvents("keys", document);
	},

    /**
     * Move focus to a new item, relative to the currently focused item.
     *
     * @method shiftFocus
     * @param {Number} offset -- The position of the item to focus, relative to the position of the currently focused item.
     */
	shiftFocus: function(offset) {
        AJS.debug('Group.shiftFocus called with offset: ' + offset);
        if (this.index === -1 && offset === 1) {
            offset = 0;
        }
		if (this.items.length > 0) {
            var i = (Math.max(0, this.index) + this.items.length + offset) % this.items.length;
			this.items[i].trigger("focus");
		}
	},

    /**
     * Assigns events so that (ie in the case of a dropdown, if no items are focused that key down will focus first time)
     * @method prepareForInput
     *
     */
    prepareForInput: function () {
        this._assignEvents("keys", document);
    },

	_events: {
        "instance": {
            "focus": function() {
                if (this.items.length === 0) {
                    return;
                }
                if (this.index < 0) {
                    this.items[0].trigger("focus");
                } else {
                    this._assignEvents("keys", document);
                }
            },
            "blur": function() {
                if (this.index >= 0) {
                    this.items[this.index].trigger("blur");
                } else {
                    this._unassignEvents("keys", document);
                }
            }
        },
		"keys": {
			"keydown keypress": function(event) {
				this._handleKeyEvent(event);
			}
		},
		"item": {
			"focus": function(event) {
                var index = this.index;
                this.index = AJS.$.inArray(event.target, this.items);
                if (index < 0) {
                    this.trigger("focus");
                } else if (index !== this.index) {
                    this.items[index].trigger("blur");
                }
			},
			"blur": function(event) {
				if (this.index === AJS.$.inArray(event.target, this.items)) {
					this.index = -1;
                    this.trigger("blur");
				}
			},
			"remove": function(event) {
                this.removeItem(event.target);
			}
		}
	},

	keys: {
		// Key handlers may be added by descendant classes.
	}
});
