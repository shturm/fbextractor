// Check to make sure that the extension's storage is working correctly
X.ready('storage_check', function() {
    FX.on_options_load(function () {
        var now = X.now();
        var success = null;
        var error = function (err) {
            success = false;
            // Oops, storage didn't work!
            var error_msg="";
            if (err) {
                error_msg = "\n\nError: "+err;
            }
            bubble_note("Social Fixer was not able to write to storage. This might be a problem with your browser profile or configuration. Please see the Support tab in Options for help with this issue. Until fixed, options and changes will reset each time you load the page."+error_msg, {"close": true, "title": "Extension Storage Error", "style": "width:300px;"});
        };
        setTimeout(function () {
            if (success === null) {
                error("Timeout waiting for storage response");
            }
        }, 8000);
        try {
            X.storage.set('storage_check', 'storage_checked_on', now, function () {
                // Storage should have persisted by now
                // Try retrieving it
                try {
                    X.storage.get('storage_check', null, function (stats) {
                        if (!stats || !stats.storage_checked_on || (Math.abs(now - stats.storage_checked_on) > 60 * X.seconds)) {
                            return error();
                        }
                        success = true;
                    }, false);
                } catch(e) {
                    error(e);
                }
            });
        } catch(e) {
            error(e);
        }
    });
});
