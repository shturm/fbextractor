X.ready( 'font_family', function() {
	FX.add_option('font_family', {
		"section": "User Interface"
		, "title": "Custom Font"
		, "description": "Set a custom font name using CSS syntax to override the default Facebook fonts. You may add multiple fonts, separated by comma."
		, "type": "text"
		, "default": ""
	});
	FX.on_options_load(function () {
		var font = FX.option('font_family');
		if (font) {
			var css = 'body, body *, #facebook body, #facebook body._-kb { font-family:' + font + ' !important; }';
			FX.css(css);
		}
	});
});
