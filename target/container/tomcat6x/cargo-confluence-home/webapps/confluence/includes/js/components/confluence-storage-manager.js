/**
 * Manager to store stuff in localStorage, only if supported by the browser.
 * It ensures that the keys are namespaced with 'confluence' to avoid clashing with anything else.
 *  
 * @param id of the storageManager to be returned. This is used to create a unique namespace prefex for keys.
 */
Confluence.storageManager = function(id) {
    return AJS.storageManager("confluence", id);
};
