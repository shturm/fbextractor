// =========================================================
// Hide parts of the page
// =========================================================
X.ready( 'hide', function() {
// Add an Option to trigger the popup in case people don't find it in the wrench menu
	FX.add_option('hide_parts_of_page',
		{
			"section": "User Interface",
			"title": 'Hide Things',
			"description": 'Under the Wrench menu you will find an item to "Hide/Show Parts of the Page". Use this to hide or show different parts of the page that Social Fixer knows how to process. You can also access this functionality using the button to the right.',
			"type": "action",
			"action_message": "options/close,hide/on",
			"action_text": "Hide Things"
		}
	);
	FX.on_options_load(function () {
		var menu_item = {"html": 'Hide/Show Parts of the Page', "message": "hide/on", "tooltip": "Select which parts of the page you want to hide so they never show up."};
		X.publish("menu/add", {"section": "actions", "item": menu_item});

		var hiddens = FX.storage('hiddens') || {};
		if (typeof hiddens.length != "undefined") {
			hiddens = {};
		}

		var resolve = function (hideable) {
			var o = X(hideable.selector);
			if (hideable.parent) {
				o = o.closest(hideable.parent);
			}
			return o;
		};

		//  Two ways to hide things:
		// (1) Pure CSS if the hideable has no parent, or
		// (2) by watching for DOM insertions
		var id;
		var css = [], hiddens_with_parents = [];
		var set_css_rules = function () {
			css = [];
			hiddens_with_parents = [];
			for (id in hiddens) {
				var hidden = hiddens[id];
				var o = resolve(hidden);

				// (1)
				if (!hidden.parent) {
					css.push(`html:not(.sfx_hide_show_all) ${hidden.selector} { display:none !important; }`);
					o.addClass("sfx_hide_hidden");
				}
				// (2)
				else {
					hiddens_with_parents.push(hidden);
				}
			}
			if (css.length > 0) {
				var csstext = css.join(' ');
				X.css(csstext, 'sfx_hideables');
			}
		};
		set_css_rules();
		// Watch for DOM insertions and check for things to hide
		FX.on_content(function (o) {
			hiddens_with_parents.forEach(function (hidden) {
				X(hidden.selector, o).closest(hidden.parent).addClass("sfx_hide_hidden");
			});
		});

		X.subscribe("hide/on", function () {
			// Display the bubble popup
			var content = X(`
					<div class="sfx_hide_bubble">
						<div>Areas of the page that are available to be hidden are highlighted in green. Click a box to mark it as hidden, and it will turn red to mark your choice.</div>
						<div>Facebook's code changes frequently, and new panels or objects are also created. In these cases, Social Fixer will automatically update itself as code can be found to hide content areas. If you find an area you would like to hide that Social Fixer doesn't know about yet, suggest it in the Support Group and we'll see if we can add it. Unfortunately, not everything can be hidden with code.</div>
						<div>When finished, click the button below. Hidden areas will vanish and remain hidden each time you visit Facebook. To see them again, use the same menu item under the wrench.</div>
						<div><input type="button" class="sfx_button" value="Done Hiding"></div>
					</div>
				`);

			var popup = bubble_note(content, {"position": "top_right", "title": "Hide Parts of the Page"});
			popup.find('.sfx_button').click(function () {
				X.publish("hide/off");
				popup.remove();
			});

			X.ajax("https://matt-kruse.github.io/socialfixerdata/hideable.json", function (content) {
				if (content && content.hideables && content.hideables.length > 0) {
					X('html').addClass('sfx_hide_show_all');
					content.hideables.forEach(function (hideable) {
						var o = resolve(hideable);
						var hidden = false;
						if (o.length) {
							var el = o[0];
							var overflow = o.css('overflow');
							o.css('overflow', 'auto');
							var rect = el.getBoundingClientRect();
							var h = rect.height;
							var w = rect.width;
							o.css('overflow', overflow);
							hideable.name = X.sanitize(hideable.name);
							var wrapper = X(`<div title="${hideable.name}" class="sfx_hide_frame" style="width:${w}px;height:${h}px;font-size:${h / 1.5}px;line-height:${h}px;">X</div>`);
							if (hiddens[hideable.id]) {
								wrapper.addClass("sfx_hide_frame_hidden");
								hidden = true;
							}
							wrapper.click(function () {
								hidden = !hidden;
								wrapper.toggleClass("sfx_hide_frame_hidden", hidden);
								o.toggleClass("sfx_hide_hidden", hidden);
								if (hidden) {
									hiddens[hideable.id] = hideable;
								}
								else {
									delete hiddens[hideable.id];
								}
							});
							o.before(wrapper);
						}
					});
				}
			});
		});

		X.subscribe("hide/off", function () {
			X('html').removeClass('sfx_hide_show_all');
			X('.sfx_hide_frame').remove();
			// Persist hidden areas
			X.storage.save('hiddens', hiddens, function () {
				set_css_rules();
			});
		});
	});
});
