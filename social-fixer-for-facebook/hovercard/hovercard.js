// Hide hovercards
X.ready('trending_bars', function() {
    FX.add_option('hide_hovercards', {
        "section": "User Interface"
        , "title": "Hide Hovercards"
        , "description": "Don't show the popup panel when hovering over user names or profile photos, unless the Ctrl key is held down."
        , "default": false
    });
    FX.on_option('hide_hovercards', function () {
        X.capture(window, 'mouseover', function (e) {
            var $t = X.target(e, true);
            if ($t.parent().is('a')) {
                $t = $t.parent();
            }
            var hc = $t.attr('data-hovercard');
            if (e.ctrlKey) {
                var xhc = $t.attr('data-x-hovercard');
                if (xhc) {
                    $t.attr('data-hovercard', xhc);
                }
            }
            else if ($t.is('a') && !/\/pubcontent/.test(hc)) {
                $t.attr('data-x-hovercard', hc);
                $t.removeAttr('data-hovercard');
            }
        });
    });
});
