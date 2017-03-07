// =========================================================
// Remove Columns
// =========================================================
X.ready('remove_columns', function() {
    FX.add_option('remove_left_column', {"section": "User Interface", "title": 'Remove Left Column', "description": 'Remove the left column of shortcuts and make the news feed a bit wider', "default": false});
    FX.on_options_load(function () {
        var cn = "hasLeftCol";
        if (FX.option('remove_left_column')) {
            X.when('body', function ($body) {
                $body.removeClass(cn);
                X.on_attribute_change($body[0], 'class', function () {
                    if ($body.hasClass("SettingsPage")) {
                        $body.addClass(cn);
                    }
                    else {
                        $body.removeClass(cn);
                    }
                });
            });
        }
    });

    FX.add_option('remove_ticker_sidebar', {"section": "User Interface", "title": 'Remove Sidebar', "description": 'Remove the "ticker" sidebar on the right side.', "default": false});
    FX.on_options_load(function () {
        var html = null;
        if (FX.option('remove_ticker_sidebar')) {
            X.poll(function () {
                if (!html || html.length == 0) {
                    html = X('html');
                }
                if (html && html.length && html.hasClass('sidebarMode')) {
                    html.removeClass('sidebarMode');
                }
                return false;
            }, 100, 100);
        }
    });

    FX.add_option('remove_right_column', {"section": "User Interface", "title": 'Remove Right Column', "description": 'Remove the right column of widgets and make the news feed a bit wider', "default": false});
    FX.on_options_load(function () {
        var contentCol = null;
        if (FX.option('remove_right_column')) {
            FX.css("#rightCol { display:none !important; }");
            X.poll(function () {
                if (!contentCol || contentCol.length == 0) {
                    contentCol = X('#contentCol');
                }
                if (contentCol && contentCol.length && contentCol.hasClass('hasRightCol')) {
                    contentCol.removeClass('hasRightCol');
                }
                return false;
            }, 100, 100);
        }
    });
});
