(function ($) {

    /**
     * A ResultGrid has a SelectGrid that is displayed when there are results and a 'no-result' message when there are
     * none.
     *
     * It accepts the same options as a SelectGrid, plus a 'no-result' message. Rather than delegating all calls to the
     * SelectGrid it provides access to it to be called directly.
     */
    AJS.ResultGrid = AJS.Control.extend({

        /**
         * Creates a SelectGrid sub-component and initializes it with the options.
         *
         * @param options including:
         * - baseElement: an element containing the table and the messageContainer
         * - columns - an array of AJS.SelectGrid.Column objects with keys, headings and classes
         * - selectionCallback - a function to call with a selected row element
         * - getRowId - a function that returns the id of a result data item
         * - gridContainer (optional): the DOM element containing the result table
         * - messageHandler (optional): the MessageHandler that will handle no-result messages
         * - noResultMessage (optional): a String or Function returning a String, to be shown when there are no results
         */
        init: function (options) {
            this.type = this.type || 'ResultGrid';

            // Locals and 'private' members.
            var grid, gridContainer, getRowId, spinner, spinnerDiv, messageHandler, noResultMessage;

            // Set up the result table
            gridContainer = options.gridContainer || $(options.baseElement).find('.data-table');
            if (!gridContainer.length) {
                AJS.debug("gridContainer for AJS.ResultGrid not found!");
            }

            // By default get row Id by looking for the 'id' property of the row data
            getRowId = function (rowData) {
                return rowData.id;
            };

            grid = new AJS.SelectGrid({
                gridContainer: gridContainer,
                columns: options.columns,
                selectionCallback: options.selectionCallback,
                getRowId: options.getRowId || getRowId,
                dontShiftFocus: options.dontShiftFocus
            });

            messageHandler = options.messageHandler || AJS.MessageHandler({
                baseElement: $(options.baseElement).find('.message-panel')
            });

            function startSpinner(width, height) {
                // If called when a spinner's spinning, let that spinner do its thing.
                if (spinner) return;

                // Calculate the width and padding of the spinner container so that the spinner is centred in the table
                // space.
                var paddingLeft, paddingTop, fudge, radius;

                radius = 60;
                fudge = 13;     // distance from centre of spinner to spinner element outer-left is 'a bit' more than radius.
                paddingLeft = width/2 - (radius + fudge);
                paddingTop = height/2 - (radius + fudge);

                width = width - paddingLeft;
                height = height - paddingTop;

                spinnerDiv = AJS('div')
                        .addClass('spinner-container')
                        .width(width)
                        .height(height)
                        .css({
                                 'padding-left': paddingLeft,
                                 'padding-top': paddingTop
                             })
                        .insertAfter(gridContainer);

                spinner = Raphael.spinner(spinnerDiv[0], radius, "#666");
            }

            /**
             * Removes any Raphael spinner active for this grid. Shouldn't normally need calling from outside
             * this control - it should be called by 'update' or some other method that alters the table
             * content.
             */
            function stopSpinner() {
                if (spinner) {
                    spinner();     // kills the spinner
                    spinnerDiv.remove();
                    spinner = null;
                }
            }

            noResultMessage = options.noResultMessage || AJS.I18n.getText("result.grid.no.result.message");

            $.extend(this, {

                /**
                 * Updates the table with fresh data.
                 *
                 * @param data - an array of objects where each object has properties matching the keys and methods from the columns array
                 * @param query - a string associated with the update (e.g. a search query) that may be used if no data is passed
                 * @return true if data was updated, false if no data and a message displayed
                 */
                update: function (data, query) {
                    messageHandler.clearMessages();
                    stopSpinner();
                    grid.clear();

                    if (!data || !data.length) {
                        grid.hide();

                        // If the message should include the search term, e.g. "No results for search 'fliegelmitscher'",
                        // allow a function to interpolate it.
                        var msg = $.isFunction(noResultMessage) ? noResultMessage(query) : noResultMessage;
                        messageHandler.displayMessages(msg);

                        return false;
                    }

                    grid.update(data);
                    grid.show();

                    return true;
                },

                /**
                 * Updates the table with data and selects a row by index if any rows exist.
                 *
                 * @param data - an array of objects where each object has properties matching the keys and methods from the columns array
                 * @param query - (optional) a string associated with the update (e.g. a search query) that may be used if no data is passed
                 * @param index - (optional) a 0-based index integer, defaults to 0
                 */
                updateAndSelect: function (data, query, index) {
                    if (this.update(data, query)) {
                        this.selectIndex(index)
                    }
                },

                /**
                 * Adds the supplied data to the start of the table - without clearing it - and selects the first element
                 * inserted.
                 */
                prependAndSelect: function (data, selectionIndex) {
                    if (!data || !data.length) {
                        AJS.debug('ResultGrid.prependAndSelect called with no data, returning.');
                        return;
                    }

                    // If this is the first data added to the grid it may be hidden and the no-result message showing.
                    // Clear the message and show the grid.
                    messageHandler.clearMessages();
                    grid.prependAndSelect(data, selectionIndex);
                    grid.show();
                },

                /**
                 * Select the result grid row where the row data item has the given id.
                 * @param id a content entity id
                 */
                select: function (id) {
                    grid.select(id);
                },

                /**
                 * Select the result grid row with the specified index.
                 * @param index a 0-based index integer
                 */
                selectIndex: function (index) {
                    grid.selectIndex(index);
                },

                clear: function () {
                    messageHandler.clearMessages();
                    grid.hide();
                },

                /**
                 * Clears the grid and displays a Raphael spinner in place of the table, useful when waiting for an
                 * AJAX request to return data for the table.
                 */
                loading: function () {
                    grid.show();
                    var width = gridContainer.width();
                    var height = gridContainer.height();
                    this.clear();
                    startSpinner(width, height);
                },

                isVisible: function () {
                    return grid.isVisible();
                }
            });
        }
    });

})(AJS.$);