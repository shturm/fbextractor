// =========================================================
// External CSS
// =========================================================
X.ready( 'external_css', function() {
    FX.add_option('external_css_url', {"section": "Advanced", "type": "text", "title": 'External CSS url', "description": 'Enter a full HTTPS url for external css to be included in the page. This will create a css LINK element in the page pointing to the css file.\nThe file must be hosted on an HTTPS server or your browser may block its content.', "default": ""});
    FX.on_options_load(function () {
        var url = X.sanitize(FX.option('external_css_url'));
        if (url) {
            X.when('head', function ($head) {
                $head.append(`<link id="sfx_external_css" rel="stylesheet" type="text/css" href="${url}">`);
            })
        }
    });
});
