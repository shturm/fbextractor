X.ready( 'post_font', function() {
	FX.add_option('post_font_size', {
		"section": "User Interface"
		, "title": "Post Body Font Size"
		, "description": "Set a custom size for the body text of posts (FB default is 14). This will also force short status updates that Facebook enlarges to be the same size as all other posts."
		, "type": "number"
        , "min": 5
		, "default": ""
	});
    FX.add_option('post_font_family', {
        "section": "User Interface"
        , "title": "Post Body Font Family"
        , "description": "Set a custom font to be used only on post body text."
		, "type": "text"
        , "default": ""
    });
    FX.add_option('post_comment_font_size', {
        "section": "User Interface"
        , "title": "Post Comment Font Size"
        , "description": "Set a custom size for the font used in comments to posts."
        , "type": "number"
		, "min": 5
        , "default": ""
    });
    FX.add_option('post_comment_font_family', {
        "section": "User Interface"
        , "title": "Post Comment Font Family"
        , "description": "Set a custom font to be used only on the comments to posts."
        , "type": "text"
        , "default": ""
    });

	FX.on_options_load(function () {
		var post_font_size = FX.option('post_font_size');
        var post_font_family = FX.option('post_font_family');
        var post_comment_font_size = FX.option('post_comment_font_size');
        var post_comment_font_family = FX.option('post_comment_font_family');

        var css = "";
		if (post_font_size && +post_font_size>5) {
			css += `.userContent, .userContent *:not([aria-hidden="true"]) { font-size: ${post_font_size}px !important; }`;
		}
        if (post_font_family) {
            css += `.userContent, .userContent * { font-family: "${post_font_family}" !important; }`;
        }
        if (post_comment_font_size && +post_comment_font_size>5) {
            css += `.UFICommentContent, .UFICommentContent *:not([aria-hidden="true"]) { font-size: ${post_comment_font_size}px !important; }`;
        }
        if (post_comment_font_family) {
            css += `.UFICommentContent, .UFICommentContent * { font-family: "${post_comment_font_family}" !important; }`;
        }

		if (css) {
            FX.css(css);
        }
	});
});
