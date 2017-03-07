FX.add_option('disabled', {"hidden": true, "default":false});
X.beforeReady(function(options) {
	// Prevent modules from running until we decide if SFX is disabled, which we can't do until options are loaded
	if (!options) { return false; }
	// Check to see if SFX is disabled
	if (FX.option('disabled')) {
		// If we're disabled, we still need to add the wrench
		init_wrench(true);
		FX.fire_content_loaded();
		return false;
	}
});
X.ready( 'menu', function() {
	init_wrench(false);
});
var init_wrench = function(disabled) {
	FX.add_option('badge_x', {"hidden": true, "default": -64});
	FX.add_option('badge_y', {"hidden": true, "default": 5});
	FX.add_option('reset_wrench_position', {"title": 'Reset Menu Position', "section": "Advanced", "description": "If your wrench menu badge somehow gets positioned so you can't see it, click here to reset its position to the upper right corner.", "type": "action", "action_text": "Reset Position", "action_message": "menu/reset_position"});
	FX.add_option('news_alerts', {"title": 'Social Fixer News', "section": "Advanced", "description": "Check for official news or blog posts from the Social Fixer team so you don't miss out on updates, updated filters, important news, etc. (Estimated frequency is one post a week)", "default": true});
	var actions = {
		"add": function (section, menu_item) {
			data.sections[section].items.push(menu_item);
		}
		, "click": function (message) {
			if (message) {
				X.publish(message);
			}
		}
		, "toggle": function () {
			var $badge = X('#sfx_badge');
			var $menu = X('#sfx_badge_menu');
			if ($menu.css('display') == 'none') {
				$menu.css('visibility', 'hidden');
				$menu.show();
				// Figure out which direction to pop the menu
				var window_width = document.body.clientWidth || window.innerWidth;
				var window_height = window.innerHeight;
				var left = $badge[0].offsetLeft;
				var top = $badge[0].offsetTop;

				if (left <= window_width / 2) {
					$menu.addClass('right').removeClass('left');
				}
				else {
					$menu.addClass('left').removeClass('right');
				}

				if (top <= window_height / 2) {
					$menu.addClass('down').removeClass('up');
				}
				else {
					$menu.addClass('up').removeClass('down');
				}
				$menu.css('visibility', '');
			}
			else {
				X('#sfx_badge_menu').hide();
			}
		}
		, "hide": function () {
			X('#sfx_badge_menu').hide();
		}
		, "notify": function (id, count) {
			if (count > 0) {
				X.publish("notify/set", {"target": '#' + id, "count": count});
			}
			else {
				X.publish("notify/clear", {"target": '#' + id});
			}
			update_total_notify();
		}
	};
	var update_total_notify = function () {
		var count = 0;
		X('#sfx_badge_menu').find('.sfx_notification_count').forEach(function (c) {
			count += (+c.innerHTML || 0);
		});
		data.notify_count = count;
	};
	var data = {
		"notify_count": 0,
		"sections": {
			"options": {
				"title": "Options",
				"items": [],
				"order": 1
			},
			"actions": {
				"title": "Actions",
				"items": [],
				"order": 2
			},
			"links": {
				"title": "Links",
				"items": [],
				"order": 3
			},
			"debug": {
				"title": "Debug",
				"items": [],
				"order": 4
			},
			"other": {
				"title": "Other",
				"items": [],
				"order": 5
			}
		}
	};
	var html = `
		<div id="sfx_badge" @click.stop="toggle">
			<div class="sfx_notification_count" v-if="notify_count>0">{{notify_count}}</div>
			<div id="sfx_badge_menu">
				<div id="sfx_badge_menu_wrap">
					<div v-for="section in sections | orderBy 'order'" class="sfx_menu_section" id="sfx_menu_section_{{$key}}">
						<div v-if="section.items.length" class="sfx_menu_section_title">{{section.title}}</div>
						<div v-for="item in section.items" id="{{item.id}}" class="sfx_menu_item" @click="click(item.message);" data-hover="tooltip" data-tooltip-position="left" data-tooltip-delay="500" data-tooltip-content="{{item.tooltip}}">
							<a v-if="item.url" href="{{item.url}}" class="sfx_menu_item_content" style="display:block;">{{{item.html}}}</a>
							<div v-else class="sfx_menu_item_content">{{{item.html}}}</div>
						</div>
					</div>
				</div>
			</div>
			<div id="sfx_badge_logo"></div>
		</div>
	`;

	FX.on_content_loaded(function (doc) {
		if (X.find('#login_form')) {
			return;
		} // Don't show on login

		// If the badge already exists for some reason, remove it and re-add it
		// Only known reason is >1 SFX running at once.  Collect version of other
		// SFX, then save our version in the DOM to facilitate warning about it.
		var $old_badge = X('#sfx_badge');
		if ($old_badge.length) {
			var old_buildstr = $old_badge.attr('sfx_buildstr') ||  // other SFX's name
			                   "old";                              // or older nameless
			$old_badge.remove();
		}

		// Attach the menu template to the DOM
		template("body", html, data, actions).ready(function () {
			position_badge(null, null, false);
			X.draggable('#sfx_badge', function (el, x, y) {
				position_badge(x, y);
			});
		});
		var $new_badge = X('#sfx_badge');
		$new_badge.attr('sfx_buildstr', sfx_buildstr);
		if (old_buildstr) {
			$new_badge.attr('old_buildstr', old_buildstr);
		}

		// If this is the first install, show the user where the badge is
		FX.on_options_load(function () {
			var stats = FX.storage('stats');
			if (!stats.installed_on) {
				var note = sticky_note("#sfx_badge", "left", "Social Fixer is installed! Start here &rarr;", {"close": false});
				X('#sfx_badge').mouseover(function () {
					note.remove();
					stats.installed_on = X.now();
					X.storage.set('stats', "installed_on", X.now());
				});
			}
		});
	});

	var position_badge = function (x, y, save) {
		var $badge = X('#sfx_badge');
		var reposition = false;
		if (typeof x == "undefined" || x == null || typeof y == "undefined" || y == null) {
			// Re-position it with saved options
			x = +FX.option('badge_x');
			y = +FX.option('badge_y');
			reposition = true;
		}
		var h = $badge[0].offsetHeight, w = $badge[0].offsetWidth;
		var window_width = document.body.clientWidth || window.innerWidth;
		var window_height = window.innerHeight;
		// If dragged, adjust
		if (!reposition) {
			if (x < 1) {
				x = 1;
			}
			else if (x > (window_width - w)) {
				x = window_width - w;
			}
			if (y < 1) {
				y = 1;
			}
			else if (y > (window_height - h)) {
				y = window_height - h;
			}

			// If the position is on the right half or bottom half of the screen, store it as negative so it's relative to the opposite edge
			if (x > window_width / 2) {
				x = x - window_width;
			}
			if (y > window_height / 2) {
				y = y - window_height;
			}
		}
		else {
			// Make sure it's on the screen
			if (x > (window_width - w)) {
				x = window_width - w;
			}
			else if (x < -window_width) {
				x = 0;
			}
			if (y > (window_height - h)) {
				h = window_height - h;
			}
			else if (y < -window_height) {
				y = 0;
			}
		}

		// Position it
		$badge.css({'left': (x > 0 ? x : (window_width + x)), 'top': (y > 0 ? y : (window_height + y))});

		// Persist the control panel location
		if (false !== save) {
			FX.option('badge_x', x, false);
			FX.option('badge_y', y, false);
			X.storage.save("options");
		}
	};

	actions.add('links', {'id': 'sfx_badge_menu_item_page', 'html': 'Social Fixer News/Blog', url: '/socialfixer', 'message': 'menu/news_clicked'});
	actions.add('links', {'html': 'Support Group', 'url': 'https://www.facebook.com/groups/412712822130938/'});
	if (disabled) {
		actions.add('options', {'html': 'Social Fixer is <span style="color:red;font-weight:bold;">Disabled</span>.<br>Click here to Enable.</span>', 'message': 'menu/enable'});

		// Create a keyboard shortcut to restore the wrench menu in case it gets lost
		X(window).on('keypress', function (e) {
			if ((e.keyCode == 24 || e.key == "X") && e.ctrlKey && e.shiftKey) {
				X.publish("menu/reset_position");
			}
		});
	}
	else {
		actions.add('options', {'html': 'Social Fixer Options <span style="font-size:10px;color:#aaa;">(Ctrl+Shift+X)</span>', 'message': 'menu/options'});
		actions.add('links', {'html': 'Donate To Support Development', 'url': 'http://socialfixer.com/donate.html'});
		actions.add('other', {'html': 'Version ' + version, 'message': 'menu/about_clicked'});
		actions.add('other', {'html': 'Disable Social Fixer', 'message': 'menu/disable'});
	}

	// Listen for enable/disable
	X.subscribe('menu/disable', function() {
		if (confirm("This will disable all Social Fixer functionality, but the wrench will still appear so you can re-enable.\n\nThe page will be automatically refreshed after disabling.\n\nAre you sure you want to disable?")) {
			X.storage.set('options','disabled',true,function() {
				window.location.reload();
			})
		}
	});
	X.subscribe('menu/enable', function() {
		X.storage.set('options','disabled',false,function() {
			window.location.reload();
		})
	});

	// Listen for messages to add items to the menu
	X.subscribe('menu/add', function (msg, data) {
		actions.add(data.section, data.item);
	}, true);

	X(window).click(actions.hide);
	window.addEventListener('resize', function () {
		position_badge();
	});
	// If options are updated from another tab, move the control panel
	X.subscribe("storage/refresh", function (msg, data) {
		if ("options" == data.key) {
			position_badge(null, null, false);
		}
	});

	X.subscribe("menu/reset_position", function (msg, data) {
		var undef;
		X.storage.set('options', {'badge_x': undef, 'badge_y': undef}, function () {
			position_badge();
		});
	});

	// About
	X.subscribe('menu/about_clicked', function () {
		X.publish("menu/options", {"section": "About"});
	});

	// If disabled, stop now!
	if (disabled) { return; }

	// NEWS CHECK
	// Check for Posts to the Social Fixer Page and alert if there are new ones
	FX.on_options_load(function () {
		X.task('news_alerts', 1 * X.seconds, function () {
			if (FX.option('news_alerts')) {
				X.when('#sfx_badge_menu_item_page', function ($item) {
					var now = X.now();
					X.storage.get('stats', {}, function (stats) {
						if (!stats || !stats.sfx_news_checked_on) {
							X.storage.set("stats", "sfx_news_checked_on", now, function () {
							});
						}
						else {
							X.ajax("https://matt-kruse.github.io/socialfixerdata/news.json", function (json) {
								if (!json || !json.news) {
									return;
								}
								var count = 0, title = null;
								json.news.reverse().forEach(function (news) {
									if (news.time > stats.sfx_news_checked_on) {
										$item.find('a').attr('href', news.href);
										title = X.sanitize(news.title);
										count++;
									}
								});
								actions.notify('sfx_badge_menu_item_page', count);
								if (count == 1) {
									if (title) {
										$item.find('.sfx_menu_item_content').append('<div class="sfx_news_title">' + title + '</div>'); // sanitized
									}
								}
							});
						}
					});
				});
			}
		});
	});
	X.subscribe('menu/news_clicked', function (msg, data) {
		// Clear when clicked
		X.storage.set("stats", "sfx_news_checked_on", X.now(), function () {
			actions.notify('sfx_badge_menu_item_page', 0);
		});
		//window.open(news_clicked_url);
	});

	// Create a keyboard shortcut to open Options
	X(window).on('keypress', function (e) {
		if ((e.keyCode == 24 || e.key == "X") && e.ctrlKey && e.shiftKey) {
			X.publish("menu/options");
		}
	});
};
