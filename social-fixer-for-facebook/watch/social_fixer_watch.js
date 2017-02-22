// ===================================================
// Add a link to watch posts in SFX Watch util
// ===================================================
X.ready('social_fixer_watch', function() {
	FX.add_option('sfx_watch', {"section": "Experiments", "title": 'Social Fixer Watch', "description": "Add an icon to each post (next to the timestamp) that adds the story to the Social Fixer Watch utility, letting you track new Likes, Comments, and Shares.", "default": false});
	FX.on_content(function (o) {
		if (FX.option('sfx_watch')) {
			o.find('abbr.timestamp,abbr[data-utime]')
				.parent('a:not(.sfx_watched):not(.uiLinkSubtle)')
				.addClass('sfx_watched')
				.after(`
				<a class="sfx_watch" href="#" title="Add to Social Fixer Watch" onclick="window.open('http://socialfixer.com/watch/?'+encodeURIComponent(this.parentNode.querySelector('.sfx_watched').getAttribute('href')),'SFX_WATCH');return false;"></a>
			`);
		}
	});
});
