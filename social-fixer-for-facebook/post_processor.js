// News Feed: id = hyperfeed_story_id_5605f5aa3e0ae5300811688
// Timeline: id = tl_unit_-2124908222973793679
// Group: id = mall_post_764394977004741:6
// Page: data-ft*="top_level_post_id"
// Global vars to be used in other components
var selector_news_feed = '*[id^="hyperfeed_story_id_"]';
var selector_timeline = '*[id^="tl_unit_"]';
var selector_group = '*[id^="mall_post_"]';
var selector_page = 'div[data-ft*="top_level_post_id"]:not(.fbFeedTickerStory)';
var post_selector = [selector_news_feed, selector_timeline, selector_group, selector_page].join(',');

X.ready('post_processor', function() {
	var sfx_post_selector = '*[sfx_post]';
	var sfx_post_id = 1;
	var max_posts = 50;
	var post_count = 0;
	var pager_selector = '#pagelet_group_pager, #www_pages_reaction_see_more_unit, *[data-testid="fbfeed_placeholder_story"] ~ a';

// When options are loaded, update the max posts value
	FX.add_option('max_post_load_count', {"section": "Advanced", "title": 'Post Auto-Loading', "description": 'How many posts should be allowed to load before being paused.', "type": "text", "default": max_posts});
	FX.on_options_load(function () {
		max_posts = +FX.option('max_post_load_count') || max_posts;
	});

// When the page is first loaded, scan it for posts that exist as part of the static content
	FX.on_content_loaded(function () {
		setTimeout(function () {
			// Find and handle inserted posts
			FX.on_content_inserted(function (o) {
				// If the inserted node lives within a <form> then it's in the reaction part of the post, we don't need to re-process
				if (o.is('form') || o.closest('form').length) {
					return;
				}

				var posts = find_and_process_posts(o);
				// If no posts processed, just part of a post may have been inserted, we need to check
				if (!posts || !posts.length) {

					var post = o.closest(sfx_post_selector);
					if (post.length == 1) {
						var id = post.attr('id');

						// The inserted content was inside of a post container
						// Process the post. If it's already been done, it will just exit
						process_post(id,true);
						var sfx_id = post.attr('sfx_id');

						X.publish("log/postdata", {"id": id, "message": "Calling post/update"});
						X.publish("post/update", {"id": id, "sfx_id": sfx_id, "dom": post, "inserted_tag":o[0].tagName, "inserted_id":o.attr('id')}, false, true); // Do not persist update messages

					}
				}
			});

			find_and_process_posts(X(document.body));

		}, 200);
	});

	// Find and identify posts within any DOM element
// This can be fired at document load, or any time content is inserted.
	function find_and_process_posts(container) {
		var posts = container.find(post_selector);
		if (container.is(post_selector)) {
			posts = posts.add(container);
		}
		posts.each(function (i, post) {
			var $post = X(post);
			// Delay the processing of each post so it is async
			// The post may have internal DOM updates before it's processed, so we avoid processing the post multiple times
			setTimeout(function () {
				process_post($post.attr('id'));
			}, 50);
		});
		return posts;
	}

	// Do the initial process a post and mark it as being seen by SFX
	function process_post(id, is_update) {
		var $post = X(document.getElementById(id)); // Group posts have : in the id, which causes Zepto to crash

		// Sometimes an empty post container gets inserted, then removed and re-inserted with content
		// Before processing a container, make sure it's not just a shell
		X.publish("log/postdata", {"id": id, "message": "processing post id=" + id});

		// The initial processing recognizes a post and marks it as such
		var is_new = false;
		if (!$post.attr('sfx_post')) {
			$post.attr('sfx_post', sfx_post_id++); // Mark this post as processed
			X.publish("log/postdata", {"id": id, "message": "sfx_post=" + $post.attr('sfx_post')});
			is_new = true;
		}
		// Check for the sfx_id, which is a post's unique identifier to SFX
		var sfx_id = $post.attr('sfx_id');
		if (!sfx_id) {
			sfx_id = get_post_id($post);
			if (sfx_id) {
				X.publish("log/postdata", {"id": id, "message": "found sfx_id=" + sfx_id});
				$post.attr('sfx_id', sfx_id);
			}
		}

        var data = {
            "id": id
            , "dom": $post
            , "sfx_id": sfx_id
        };

        if (is_new) {
			X.publish("log/postdata", {"id": id, "message": "Calling post/add"});
			X.publish("post/add", data);

			// If we have processed too many posts, stop here
			if (post_count++ > max_posts) {
				var pager = X(pager_selector);
				if (pager.is('a')) {
					pager = pager.parent();
				}
				if (!pager.hasClass('sfx-pager-disabled')) {
					var newpager = X('<div class="sfx_info sfx-pager" style="cursor:pointer;">Social Fixer has paused automatic loading of more than ' + max_posts + ' posts to prevent Facebook from going into an infinite loop. <b>Click this message</b> to continue loading ' + max_posts + ' more posts.<br><i>(The number of posts to auto-load is configurable in the Advanced tab in Options)</i></div>');
					try {
							newpager.click(function () {
							newpager.remove();
							pager.removeClass('sfx-pager-disabled');
							post_count = 0;
							setTimeout(function () {
								FX.reflow(false);
								X.ui.scroll(3);
							}, 100);
						});
					} catch (e) {
						alert(e);
					}
					pager.first().before(newpager);
					pager.addClass('sfx-pager-disabled');
					setTimeout(function () {
						X.ui.scroll(3);
					}, 100);
				}
			}
		}
	}

// When navigating, reset post count
	FX.on_page_unload(function () {
		sfx_post_id = 1;
		post_count = 0;
	});

	var regex_fbid = /fbid=(\d+)/;
	var regex_post = /\/(?:posts|videos|permalink)\/(\d+)/;
	var regex_gallery = /\/photos\/\w\.[\d\.]+\/(\d+)/;

	function get_post_id($post) {
		var id = $post.attr('id');
		var href = $post.find('abbr.timestamp,abbr[data-utime][title]').parent().attr('href');
		if (href) {
			if (regex_fbid.test(href) || regex_post.test(href) || regex_gallery.test(href)) {
				X.publish("log/postdata", {"id": id, "message": "get_post_id=" + RegExp.$1});
				return RegExp.$1;
			}
			X.publish("log/postdata", {"id": id, "message": "get_post_id=" + href});
			return href;
		}
		var input = $post.find('input[name="ft_ent_identifier"][value]');
		if (input) {
			var value = input.attr('value');
			if (value) {
				X.publish("log/postdata",{"id":id,"message":"get_post_id="+value});
				return value;
			}       
		}
		X.publish("log/postdata", {"id": id, "message": "get_post_id=null"});
		return null;
	}
});
