AJS.Keyboard={};(function(e){var f={},i={},d={};var g=AJS.Keyboard.SpecialKey={BACKSPACE:h("backspace",8,true),TAB:h("tab",9,true),RETURN:h("return",13,true),SHIFT:h("shift",16),CTRL:h("ctrl",17),ALT:h("alt",18),PAUSE:h("pause",19),CAPS_LOCK:h("capslock",20),ESC:h("esc",27,true),SPACE:h("space",32,true),PAGE_UP:h("pageup",33),PAGE_DOWN:h("pagedown",34),END:h("end",35),HOME:h("home",36),LEFT:h("left",37),UP:h("up",38),RIGHT:h("right",39),DOWN:h("down",40),INSERT:h("insert",45),DELETE:h("del",46),F1:h("f1",112),F2:h("f2",113),F3:h("f3",114),F4:h("f4",115),F5:h("f5",116),F6:h("f6",117),F7:h("f7",118),F8:h("f8",119),F9:h("f9",120),F10:h("f10",121),F11:h("f11",122),F12:h("f12",123),NUMLOCK:h("numlock",144),SCROLL:h("scroll",145),META:h("meta",224)};function h(l,m,k){f[m]=l;i[l]=m;if(k){d[m]=true}return l}g.eventType=function(){return e.browser.mozilla?"keypress":"keydown"};g.fromKeyCode=function(k){return f[k]};g.toKeyCode=function(k){return i[k]};g.isAscii=function(k){return !!d[k]};g.isSpecialKey=function(k){return !!g.toKeyCode(k)};function a(k){return k.originalEvent||k}AJS.Keyboard.characterEntered=function(k){var m=a(k);if(m.type==="keypress"){var l=c(m);if(l!==null&&(!g.isAscii(l)||g.fromKeyCode(l)===g.SPACE)){return String.fromCharCode(l)}}return undefined};function c(k){var l=a(k);if(l.which==null){return l.keyCode}else{if(l.which!=0&&l.charCode!=0){return l.which}else{return null}}}AJS.Keyboard.specialKeyEntered=function(l){l=a(l);if(e.browser.mozilla){if(l.type==="keypress"){var k=c(l);if(k===null){return g.fromKeyCode(l.keyCode)}else{if(g.isAscii(k)){return g.fromKeyCode(k)}}}}else{if(l.type!=="keypress"){return g.fromKeyCode(l.keyCode)}}return undefined};function j(m){m=a(m);var l=AJS.Keyboard.specialKeyEntered(m);if(l){return l}else{if(e.browser.mozilla){if(m.type==="keypress"){var k=c(m);if(k!==null){return String.fromCharCode(k).toLowerCase()}}}else{if(m.type!=="keypress"){return String.fromCharCode(m.keyCode).toLowerCase()}}}return undefined}AJS.Keyboard.shortcutEntered=function(n){n=a(n);if(n.type===AJS.Keyboard.SpecialKey.eventType()){var m=AJS.Keyboard.specialKeyEntered(n),k="";if(n.altKey&&m!==g.ALT){k+=b(g.ALT)}if(n.ctrlKey&&m!==g.CTRL){k+=b(g.CTRL)}if(n.metaKey&&!n.ctrlKey&&m!==g.META){k+=b(g.META)}if(n.shiftKey&&m!==g.SHIFT){k+=b(g.SHIFT)}if(m){return k+m}else{if(k.length>0&&k!=="shift+"){var l=j(n);if(l){return k+l}}}}return undefined};function b(k){return k+"+"}})(AJS.$);