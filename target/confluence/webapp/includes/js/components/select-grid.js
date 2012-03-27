/**
 * Displays a grid of data with mouse and keyboard selection.
 */
(function ($) {

    /*
     * Returns an AJS.Group-derived object that can be used to manage a table of data with a selection callback.
     * Responds to up/down/enter keys and mouse events.
     *
     * Differs from Group in that focus == select. When a row is focussed by clicking or up/down arrowing to, the
     * row's selection callback is triggered.
     */
    AJS.SelectGrid = AJS.Group.extend({

        /**
         * Called when "new AJS.SelectGrid(options)" is called, where options contains:
         *
         * - gridContainer - the DOM element containing the result table
         * - columns - an array of AJS.SelectGrid.Column objects with keys, headings and classes
         * - selectionCallback - a function to call with a selected row element
         * - getRowId - a function that returns the id of a result data item
         */
        init: function (options) {
            this.type = this.type || 'SelectGrid';
            this._super();

            // Create the table from a template and populate its header row.
            var table = $(Confluence.Templates.SelectGrid.gridOutline());
            var header = table.find("thead tr");
            $(options.columns).each(function (i, column) {
                var headerCell = AJS('th').addClass(column.getClassName()).text(column.heading);
                header.append(headerCell);
            });
            this.gridContainer = $(options.gridContainer).append(table);
            this.getRowId = options.getRowId;
            this.table = table;
            this.columns = options.columns;

            this.selectionCallback = options.selectionCallback;
            this.body = table.find("tbody");

            this.body.delegate("a", "click", function (event) {
                // Don't follow any links in the table - the Group control will handle the row selection
                event.preventDefault();
            });

            // dontShiftFocus is called before shiftFocus in response to key events, and blocks the shift from
            // happening if the returned value isn't falsy.
            this.dontShiftFocus = options.dontShiftFocus || function () {};
        },

        keys: {
            "up": function(e) {
                if (!this.table.is(':visible') || this.dontShiftFocus()) {
                    return;
                }
                this.shiftFocus(-1);
                e.preventDefault();
            },
            "down": function(e) {
                if (!this.table.is(':visible') || this.dontShiftFocus()) {
                    return;
                }
                this.shiftFocus(1);
                e.preventDefault();
            }
        },

        /**
         * Adds a row DOM element with a callback
         * @param row - a filled <tr> element
         * @param data - the data associated with the row
         * @param prepend - true if the row(s) for the data should be at the start of the table, false (default) if at the end
         * @param callback - a function to call if the row is selected, will take the row and its data as arguments
         */
        _addRow: function (row, data, prepend, callback) {
            if ($.isFunction(prepend)) {
                callback = prepend;
                prepend = false;
            }
            prepend ? this.body.prepend(row) : this.body.append(row);
            var rowItem = new SelectableRow({
                row: row,
                data: data,
                callback: callback,
                getRowId: this.getRowId,
                selectionCallback: callback
            });
            this.addItem(rowItem);
            return rowItem;
        },

        clear: function () {
            this.removeAllItems();
            this.body.children().remove();
        },

        _addRows: function (data, prepend) {
            var that = this;
            var rowItems = [];
            $(data).each(function (i, item) {
                var row = makeTableRow(item, that.columns);
                row.attr('data-id', that.getRowId(item));
                rowItems.push(that._addRow(row, item, prepend, that.selectionCallback));
            });
            return rowItems;
        },


        // Updates the table with fresh data.
        // @param data - an array of objects where each object has properties matching the keys from the columns array
        update: function (data) {
            this.clear();

            if (!data || !data.length) {
                AJS.debug('SelectGrid.update called with no data, returning.');
                return;
            }

            this._addRows(data);

            // Listen for keyboard and mouse events on the table rows.
            // HACK - this should be done when the table is focused, not updated
            this.prepareForInput();
        },

        // Prepends the table with fresh data and selects a row added based on selectionIndex
        prependAndSelect: function (data, selectionIndex) {
            if (!data || !data.length) {
                AJS.debug('SelectGrid.prependAndSelect called with no data, returning.');
                return;
            }

            // We call trigger directly rather than calling selectIndex because we don't know where in the table
            // the added rows will be - could be start or end.
            var rowItems = this._addRows(data, true);
            rowItems[selectionIndex || 0].selectRow();
        },


        // Locates the list item with the specified id.
        findItem: function (id) {
            for (var i = 0; i < this.items.length; i++) {
                var rowId = this.items[i].getRowId();
                if (rowId == id)
                    return this.items[i];
            }

            AJS.debug('SelectGrid.findItem didn\'t find item, returning null.');
            return null;
        },

        // Selects the row with the given id.
        select: function (id) {
            var item = this.findItem(id);
            item && item.selectRow();
        },

        // Selects the row with the given index. Defaults to 0 (the first row) if no index passed.
        selectIndex: function (index) {
            index = index || 0;
            if (this.items[index]) {
                this.items[index].selectRow();
            }
            else {
                AJS.debug('SelectGrid.selectIndex couldn\'t select row with index ' + index + ', not found');
            }
        },

        show: function () {
            this.gridContainer.removeClass('hidden');
        },

        hide: function () {
            this.gridContainer.addClass('hidden');
        },

        isVisible: function () {
            return !this.gridContainer.hasClass('hidden');
        }
    });

    // A list item wrapping a <tr> element that handles selection highlighting and a callback.
    var SelectableRow = AJS.Control.extend({
        init: function (options) {
            this.type = 'SelectableRow';
            this.$row = AJS.$(options.row);
            this.$row.data("properties", options.data);
            this.getRowId = function () {
                return options.getRowId(options.data);
            };
            this.selectionCallback = options.selectionCallback;
            this._assignEvents("element", this.$row);
            this._assignEvents("instance", this);
            AJS.debug('SelectableRow initialized');
        },

        _events: {
            instance: {
                focus: function (e) {
                    var row = this.$row;
                    row.addClass('selected');
                    this.selectionCallback(row, row.data("properties"));
                },
                blur: function (e) {
                    this.$row.removeClass('selected');
                }
            },
            element : {
                click: function () {
                    this.trigger('focus');
                }
            }
        },

        /**
         * Selects this table row.
         */
        selectRow: function () {
            this.trigger('focus');
        }

    });

    /**
     * Merges the rowData with the column definition to create a data 'packet' for the
     * table cell.
     *
     * @param rowData the incoming object for the row
     * @param column the AJS.SelectGrid.Column instance describing the column the cell is in
     */
    var getCellData = function (rowData, column) {
        return {
            outerClass: column.getClassName(rowData) || '',
            href: column.getHref && column.getHref(rowData) || '',
            innerClass: column.getInnerClass && column.getInnerClass(rowData) || '',
            title: column.getTitle && column.getTitle(rowData) || '',
            text: column.getText(rowData) || ''
        };
    };

    /**
     * Converts a single row of data to a DOM element. Capable of producing markup like:
     *
     * <th class="search-result-title"><a href="{1}" class="content-type-{2}"><span>{0}</span></a></th>
     * <td class="search-result-space"><a class="space" href="$req.contextPath/display/{4}/" title="{3}">{3}</a></td>
     * <td class="search-result-date"><span class="date" title="{6}">{5}</span></td>
     *
     * @param rowData the object with the row properties
     * @param columns an array of AJS.SelectGrid.Column objects defining the columns to be added to the row
     */
    var makeTableRow = function (rowData, columns) {
        var row, cellData, cellType, cell;
        row = AJS('tr');

        $(columns).each(function (i, column) {

            cellData = getCellData(rowData, column);
            cellType = cellData.href ? 'cellWithLink' : 'cellWithoutLink';
            cell = Confluence.Templates.SelectGrid[cellType](cellData);
            row.append(cell);
        });
        return row;
    };

    /**
     * Represents a table column, with properties:
     *
     * @param key - the column key, will match a property of objects used to fill the table rows. Can be used as a default class - see below.
     * @param heading - the column heading text
     * @param getClassName - (optional) an override fn for the classname, by default 'result-table-{key}' will be used
     * @param getInnerClass - (optional) an override fn for the classname of the inner element of the td cell
     * @param getTitle - (optional) a function to return the title attribute of the cell contents
     * @param getHref - (optional) a function to return the href attribute of the cell contents
     * @param getText - (optional) a function to return the text of the cell, else the row data property for the key is used
     */
    AJS.SelectGrid.Column = function (props) {
        var defaultClassName = function () {
            return props.className || (props.key + '-field');
        },

        defaultText = function (rowData) {
            return rowData[props.key];
        };

        return {
            key: props.key,
            heading: props.heading,
            getClassName: props.getClassName || defaultClassName,

            // If a column specifies an href an <a> link will be appended inside the <td>
            getHref: props.getHref,

            // A column can specify the class to be applied to the element directly inside the <td>
            getInnerClass: props.getInnerClass,

            // Returns a title "tooltip" to display when the user hovers the mouse over a cell's contents
            getTitle: props.getTitle,

            // Returns the text to be displayed in the column
            getText: props.getText || defaultText
        };
    };

})(AJS.$);
