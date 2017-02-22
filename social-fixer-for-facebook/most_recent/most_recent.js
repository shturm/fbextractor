// =========================================================
// Force the News Feed to be the Most Recent view
// =========================================================
X.ready( 'most_recent', function() {
	FX.add_option('auto_switch_to_recent_stories', {"title": 'Automatically Switch to Most Recent view of the News Feed', "description": "Facebook defaults to Top Stories. This option detects this view and automatically switches you to the chronological Most Recent view.", "default": false});
	FX.add_option('redirect_home_links', {"section": "User Interface", "title": 'Home Links', "description": 'Force the F logo and Home link in the blue header bar to reload the page so Social Fixer features continue to work.', "default": true});
	FX.on_options_load(function () {
		// Redirect F logo home link
		var recent_href = function(old_href) {
			if (/[&?]sk=h_(no|ch)r/.test(old_href)) {
				return old_href.replace(/sk=h_nor/, 'sk=h_chr');
			}
			else {
				return old_href + (/\?/.test(old_href) ? '&' : '?') + 'sk=h_chr';
			}
		};
		if (FX.option('redirect_home_links')) {
			var capture = function ($a) {
				X.capture($a, 'click', function (e) {
					if (FX.option('auto_switch_to_recent_stories')) {
						$a.attr('href', recent_href($a.attr('href')));
					}
					e.stopPropagation();
				});
			};
			FX.on_page_load(function () {
				X.when('h1[data-click="bluebar_logo"] a', capture);
				X.when('div[data-click="home_icon"] a', capture)
			});
		}
		// Force Most Recent
		FX.on_content_loaded(function () {
			if (FX.option('auto_switch_to_recent_stories')) {
				var redirect = false;
				var href = window.location.href;
				var redirect_now = function () {
					X(document.body).css('opacity', '.2');
					setTimeout(function () {
						window.location.href = recent_href(href) + '&sfx_switch=true';
					}, 200);
				};
				if (/sfx_switch=true/.test(href)) {
					var note = sticky_note(X('#sfx_badge')[0], 'left', 'Auto-switched to Most Recent', {close: false});
					setTimeout(function () {
						note.remove();
					}, 3000);
				}
				else if (/sk=h_nor/.test(href)) {
					redirect_now();
				}
				else if (!/sk=h_chr/.test(href)) {
					X.poll(function (count) {
						if (!X.find('div[id^="topnews_main_stream"]')) {
							return false;
						}
						redirect_now();
					}, 200, 20);
				}
			}
		});
	});
});
