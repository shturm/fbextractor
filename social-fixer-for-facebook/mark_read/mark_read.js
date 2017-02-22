// =========================================================
// Add Post Action Icons, including Mark Read
// =========================================================
X.ready( 'mark_read', function() {
	FX.add_option('post_actions', {"title": 'Post Actions', "description": "Add actions to individual posts to mark them as read, etc.", "default": true});
	FX.add_option('show_mark_all_read', {"title": 'Mark All Read/Undo', "description": "Add a Mark All Read button and Undo button to the control panel to mark all visible posts as read or undo marking posts as read.", "default": false});
	FX.add_option('mark_all_read_next', {"section": "Advanced", "title": 'Mark All Read - Next', "description": "When Mark All Read is clicked and filter tabs are visible, automatically jump to the next tab with unread stories.", "default": true});
	FX.add_option('clear_cache', {"title": 'Clear "Mark Read" Story Data', "section": "Advanced", "description": "Clear all cached data about posts 'read' status. This will unmark all 'read' posts!", "type": "action", "action_text": "Clear Data Now", "action_message": "cache/clear"});
	FX.add_option('clean_cache_frequency', {"title": '"Mark Read" Cache Cleaning Frequency', "section": "Advanced", "description": "Clean the cache of old story data every how many hours?", "type": "number", "default": 24});
	FX.add_option('clean_cache_age', {"title": '"Mark Read" Cache Cleaning Age', "section": "Advanced", "description": "When cleaning cached story data, clean post data it is this many days old.", "type": "number", "default": 4});
	FX.add_option('hide_mark_read_groups', {"title": 'Mark Read', "description": "Hide posts marked as Read when viewing a Group.", "default": true});
	FX.add_option('hide_mark_read_pages', {"title": 'Mark Read', "description": "Hide posts marked as Read when viewing a Page or Timeline.", "default": true});
	FX.add_option('mark_read_display_message', {"title": 'Mark Read', "description": "Display a small post timestamp where posts marked as 'read' and hidden would have been.", "default": true});
	FX.add_option('mark_read_style', {"section": "Advanced", "title": 'Mark Read Style', "description": "CSS style to be applied to posts that are marked Read.", "type": "text", "default": "outline:1px dashed red;"});

	(function () {
		var postdata = {}; // Keyed by DOM id!
		X.subscribe("log/postdata", function (msg, data) {
			if (!data.id) {
				return;
			}
			postdata[data.id] = postdata[data.id] || [];
			postdata[data.id].push(data.message);
		});
		X.subscribe("log/postdata/get", function (msg, data) {
			if (typeof data.callback != "function") {
				return;
			}
			data.callback(postdata[data.id]);
		})
	})();
// Clear Cache
	X.subscribe("cache/clear", function (msg, data) {
		X.storage.save("postdata", {}, function () {
			alert("Social Fixer cache has been cleared");
		});
	});
	FX.on_options_load(function () {
		if (!FX.option('post_actions')) {
			return;
		}

		// Write out CSS based on "mark read" style
		var mark_read_style = FX.option('mark_read_style');
		FX.css(`
		.sfx_post_read > *:not(.sfx_post_marked_read_note), 
		#facebook #pagelet_soft_permalink_posts .sfx_post_read > *,
		#facebook[sfx_context_permalink="true"] .sfx_post_read > * {
			${mark_read_style};
		}
	`);

		// Add an option to the wrench menu to toggle stories marked as read
		var menu_item = {"html": 'Show posts marked "read"', "message": "post/toggle_read_posts", "tooltip": "If posts are marked as read and hidden, toggle their visibility."};
		X.publish("menu/add", {"section": "actions", "item": menu_item});

		var show_read = false;
		X.subscribe("post/toggle_read_posts", function () {
			show_read = !show_read;
			menu_item.html = show_read ? 'Hide posts marked "read"' : 'Show posts marked "read"';
			X('html').toggleClass("sfx_show_read_posts", show_read);
			FX.reflow();
		});

		// Logic to handle post actions
		var postdata = FX.storage('postdata') || {};

		// On a regular interval, clean out the postdata cache of old post data
		var clean_cache_frequency = FX.option('clean_cache_frequency') || +FX.options['clean_cache_frequency']['default'] || 24;
		var clean_cache_age = FX.option('clean_cache_age') || +FX.options['clean_cache_age']['default'] || 7;
		X.task('clean_postdata_cache', clean_cache_frequency * X.hours, function () {
			var post_id, cleaned_count = 0;
			if (!postdata) {
				return;
			}
			for (post_id in postdata) {
				var data = postdata[post_id];
				var read_on = data.read_on;
				var age = X.now() - read_on;
				if (age > clean_cache_age * X.days) {
					delete postdata[post_id];
					cleaned_count++;
				}
			}
			// Save the postdata back to storage
			X.storage.save("postdata", postdata, function () {
				console.log("Social Fixer cache cleaned. " + cleaned_count + " posts removed from cache.");
			});
		});

		var init = function (id) {
			if (typeof postdata[id] == "undefined") {
				postdata[id] = {};
			}
			return postdata[id];
		};

		var mark_all_added = false;
		FX.on_page_unload(function () {
			mark_all_added = false;
		});

		FX.on_content_loaded(function () {
			var action_data = {
				id: null,
				sfx_id: null,
				$post: null,
				read: false,
				show_mark_read: true,
				filters_enabled: FX.option('filters_enabled'),
				wrench_items: [],
				filter_items: []
			};
			var actions = {
				mark_read: function () {
					X.publish("post/mark_read", {"sfx_id": action_data.sfx_id});
				}
				, unmark_read: function () {
					X.publish("post/mark_unread", {"sfx_id": action_data.sfx_id});
				}
				, "action_menu_click": function (item) {
					var key, data = {"id": action_data.id, "sfx_id": action_data.sfx_id};
					if (item.data) {
						for (key in item.data) {
							data[key] = item.data[key];
						}
					}
					X.publish(item.message, data);
				}
			};
			var html = `<div id="sfx_post_action_tray">
			<div class="mark-read-tick" v-if="show_mark_read && !read" @click="mark_read" v-tooltip="Mark this post as Read, so it doesn't appear in your news feed anymore. Use the option under the Wrench icon to show Read posts.">&#10004;</div>
			<div v-if="show_mark_read && read" @click="unmark_read" v-tooltip="Un-Mark this post as Read so it shows up in your news feed again.">X</div>
			<div v-if="!show_mark_read" v-tooltip="{content:'This post cannot be marked as read because it lacks a unique facebook identifier which is used to remember that this post was read. Posts like these may be markable in the future.',delay:50}">X</div>
			<div v-if="wrench_items.length>0" @click="wrench_menu()" id="sfx_mark_read_wrench" class="mark_read_wrench"></div>
			<div v-if="filters_enabled && filter_items.length>0" @click="filter_menu()" id="sfx_mark_read_filter" class="mark_read_filter"></div>
		</div>
		<div v-if="wrench_items.length>0" id="sfx_post_wrench_menu" class="sfx_post_action_menu">
			<div v-for="item in wrench_items" @click="action_menu_click(item)">{{item.label}}</div>
		</div>
		<div v-if="filter_items.length>0" id="sfx_post_filter_menu" class="sfx_post_action_menu">
			<div v-for="item in filter_items" @click="action_menu_click(item)">{{item.label}}</div>
		</div>
		`;

			var undo = {
				posts_marked_read: []
				, undo_disabled: true
			};
			var hide_read = function ($post) {
				if (!$post.hasClass('sfx_post_read')) {
					if (FX.context.type == "groups" && !FX.option('hide_mark_read_groups')) {
						return;
					}
					if (FX.context.type == "profile" && !FX.option('hide_mark_read_pages')) {
						return;
					}
					if (FX.option('mark_read_display_message')) {
						var ts = $post.find('abbr.timestamp,abbr.sfx_no_fix_timestamp').attr('title');
						ts = ts ? 'Read: [ ' + ts + ' ]' : 'Hidden Post';
						var note = X(`<div class="sfx_post_marked_read_note" title="This post was hidden because it was previously marked as Read. Click to view.">${ts}</div>`);
						note.on('click', function () {
							note.parent().toggleClass('sfx_post_read_show');
						});
						$post.prepend(note);
					}
					$post.addClass('sfx_post_read');
					X.publish("post/hide_read", {"id": $post.attr('id')});
				}
			};
			var unhide_read = function ($post) {
				if ($post.hasClass('sfx_post_read')) {
					$post.removeClass('sfx_post_read');
					X.publish("post/unhide_read", {"id": $post.attr('id')});
				}
			};
			// Mark Read/Unread controllers
			X.subscribe("post/mark_unread", function (msg, data) {
				var sfx_id = data.sfx_id;
				var $post = data.post || action_data.$post;

				var pdata = postdata[sfx_id];
				//pdata.last_updated = X.now();
				delete pdata.read_on;

				X.storage.set("postdata", sfx_id, pdata, function () {
					unhide_read($post);
				}, false !== data.save);
			});
			X.subscribe("post/mark_read", function (msg, data) {
				var sfx_id = data.sfx_id;
				var $post = data.post || action_data.$post;
				// for undo
				undo.posts_marked_read = [$post];
				undo.undo_disabled = false;

				var pdata = init(sfx_id);
				var t = X.now();
				//pdata.last_updated = t;
				pdata.read_on = t;

				postdata[sfx_id] = pdata;
				X.storage.set("postdata", sfx_id, pdata, function () {
					hide_read($post);
					FX.reflow();
				}, false !== data.save);
			});
			X.subscribe("post/mark_all_read", function (msg, data) {
				var marked = 0;
				var posts = [];
				X(`*[sfx_post]`).each(function () {
					var $post = X(this);
					if ("none" != $post.css('display') && !$post.hasClass('sfx_post_read')) {
						var sfx_id = $post.attr('sfx_id');
						posts.push($post);
						X.publish("post/mark_read", {"sfx_id": sfx_id, "save": false, "post": $post}); // Don't persist until the end
						marked++;
					}
				});
				if (marked > 0) {
					X.storage.save("postdata");
					undo.posts_marked_read = posts;
					undo.undo_disabled = false;
				}
				if (FX.option('mark_all_read_next')) {
					X.publish("filter/tab/next");
				}
				FX.reflow();
			});
			X.subscribe("post/undo_mark_read", function (msg, data) {
				if (undo.posts_marked_read.length > 0) {
					undo.posts_marked_read.forEach(function ($post) {
						var sfx_id = $post.attr('sfx_id');
						X.publish("post/mark_unread", {"sfx_id": sfx_id, "save": false, "post": $post});
					});
					X.storage.save("postdata");
					undo.posts_marked_read = [];
					undo.undo_disabled = true;
					FX.reflow();
				}
				else {
					alert("Nothing to Undo!");
				}
			});

			var add_post_action_tray = function () {
				if (document.getElementById('sfx_post_action_tray') == null) {
					template(document.body, html, action_data, actions);
					X('#sfx_mark_read_wrench').click(function (ev) {
						var menu = X('#sfx_post_wrench_menu');
						menu.css('left', ev.pageX + 'px');
						menu.css('top', ev.pageY + 'px');
						menu.show();
						ev.stopPropagation();
					});
					X('#sfx_mark_read_filter').click(function (ev) {
						var menu = X('#sfx_post_filter_menu');
						menu.css('left', ev.pageX + 'px');
						menu.css('top', ev.pageY + 'px');
						menu.show();
						ev.stopPropagation();
					});
				}
			};
			X(window).click(function () {
				X('#sfx_post_filter_menu, #sfx_post_wrench_menu').hide();
			});

			X.subscribe(["post/add", "post/update"], function (msg, data) {
				// If it's already read, hide it
				var sfx_id = data.sfx_id;
				if (sfx_id) {
					if (typeof postdata[sfx_id] != "undefined") {
						if (postdata[sfx_id].read_on) {
							hide_read(data.dom);
						}
					}
				}

				if (msg == "post/add") {
					// Add the "Mark All Read" button to the control panel if necessary
					if (!mark_all_added && FX.option('show_mark_all_read')) {
						mark_all_added = true;
						X.publish("cp/section/add", {
							"name": "Post Controller"
							, "order": 10
							, "id": "sfx_cp_post_controller"
							, "help": "Act on all visible posts at once"
						});
						// Wait until that has been rendered before attaching to it
						Vue.nextTick(function () {
							// The content container will have been created by now
							var html = `<div class="sfx_cp_mark_all_read" style="text-align:center;">
                    		<input type="button" class="sfx_button" value="Mark All Read" @click="mark_all_read">
                    		<input type="button" class="sfx_button" v-bind:disabled="undo_disabled" value="Undo ({{posts_marked_read.length}})" @click="undo_mark_read">
                		</div>`;
							var methods = {
								"mark_all_read": function () {
									X.publish("post/mark_all_read");
								},
								"undo_mark_read": function () {
									X.publish("post/undo_mark_read");
								}
							};
							template('#sfx_cp_post_controller', html, undo, methods);
						});
					}

					function setUpAndAddActionTray() {
						action_data.$post = data.dom;
						action_data.id = action_data.$post.attr('id');
						action_data.sfx_id = action_data.$post.attr('sfx_id');
						if (!action_data.sfx_id) {
							action_data.show_mark_read = false;
						}
						else {
							action_data.show_mark_read = true;
							action_data.read = (postdata[action_data.sfx_id] && postdata[action_data.sfx_id].read_on);
						}
						add_post_action_tray();

						var anchor = action_data.$post;
						var position = action_data.$post.find('.userContentWrapper').first();
						if (position) {
							anchor = X(position);
						}
						anchor.append(document.getElementById('sfx_post_action_tray'));
					}

					setUpAndAddActionTray()
					// When the mouse moves over the post, add the post action tray
					data.dom.on('mouseenter', function () {
						setUpAndAddActionTray();
					});
				}
			});

			X.subscribe("post/action/add", function (msg, data) {
				if (data.section == "wrench") {
					action_data.wrench_items.push(data);
				}
				else if (data.section == "filter") {
					action_data.filter_items.push(data);
				}
			}, true);

			X.publish('post/action/add', {"section": "wrench", "label": "Post Data", "message": "post/action/postdata"});
			X.subscribe('post/action/postdata', function (msg, data) {
				var log = [];
				X.publish("log/postdata/get", {
					"id": data.id, "callback": function (pdata) {
						log = pdata;
					}
				});
				log = log.join("<br>");
				var data_content = JSON.stringify(postdata[action_data.id] || {}, null, 3);
				var content = `
				<div draggable="false">This popup shows what Social Fixer remembers about this post.</div>
				<div draggable="false" class="sfx_bubble_note_data">Post ID: ${action_data.sfx_id}<br>DOM ID: ${action_data.id}</div>
				<div draggable="false">Data stored for this post:</div>
				<div draggable="false" class="sfx_bubble_note_data">${data_content}</div>
				<div draggable="false">Processing Log:</div>
				<div draggable="false" class="sfx_bubble_note_data">${log}</div>
			`;
				// Remove the previous one, if it exists
				X('#sfx_post_data_bubble').remove();
				var note = bubble_note(content, {"position": "top_right", "title": "Post Data", "id": "sfx_post_data_bubble", "close": true});
			});
		});
	});
});
