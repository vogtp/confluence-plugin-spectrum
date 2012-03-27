/*
 * menuExpandable3.js - implements an expandable menu based on a HTML list
 * Author: Dave Lindquist (http://www.gazingus.org)
 */

if (!document.getElementById)
    document.getElementById = function() { return null; }

function initializeMenu(menuId, actuatorId) {
    var menu = document.getElementById(menuId);
    var actuator = document.getElementById(actuatorId);

    if (menu == null || actuator == null) return;

    //if (window.opera) return; // I'm too tired

    actuator.parentNode.style.backgroundImage = "url(" + contextPath + "/images/icons/tree_plus.gif)";

    actuator.onclick = function() {
        var display = menu.style.display;

        this.parentNode.style.backgroundImage =
            (display == "block") ? "url(" + contextPath + "/images/icons/tree_plus.gif)" : "url(" + contextPath + "/images/icons/tree_minus.gif)";

        menu.style.display = (display == "block") ? "none" : "block";
        return false;
    }
}

function menuStatus(status, menuId, actuatorId)
{
    var menu = document.getElementById(menuId);
    var actuator = document.getElementById(actuatorId);

    if (menu == null || actuator == null) return;

    //if (window.opera) return; // I'm too tired

    actuator.parentNode.style.backgroundImage =
        (status == 'close') ? "url(" + contextPath + "/images/icons/tree_plus.gif)" : "url(" + contextPath + "/images/icons/tree_minus.gif)";

    menu.style.display = (status == 'close') ? "none" : "block";

    return;
}

function openAll()
{
    var elements = document.getElementsByTagName("ul");

    for (var i = 0; i < elements.length; i++)
    {
        var elId = elements[i].id;

        if (elId.substring(0, 5) == 'menu-')
        {
            var id = elId.substring(5, elId.length);
            menuStatus('open', 'menu-' + id, 'actuator-' + id);
        }
    }
}

function closeAll()
{
    var elements = document.getElementsByTagName("ul");

    for (var i = 0; i < elements.length; i++)
    {
        var elId = elements[i].id;

        if (elId.substring(0, 5) == 'menu-')
        {
            var id = elId.substring(5, elId.length);
            menuStatus('close', 'menu-' + id, 'actuator-' + id);
        }
    }
}
