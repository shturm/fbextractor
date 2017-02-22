// =====================================================
// Apply Filters to posts when they are added or updated
// =====================================================
// Filters depend on options, so wait until they load
X.ready('post_filters', function() {
    FX.add_option('filters_enabled', {"section": "Filters", "hidden": true, "default": true});
    FX.add_option('filters_enabled_pages', {"section": "Filters", "hidden": true, "default": false});
    FX.add_option('filters_enabled_groups', {"section": "Filters", "hidden": true, "default": false});
    FX.add_option('filters_forced_processing_delay', {"type":"number", "section":"Advanced", "title":"Post Filter Force Delay", "description":"The time in ms after which post filtering will be forced even if all the content is not yet available", "default":1000});

    FX.add_option('hide_posts_text', {"hidden":true, "type":"textarea", "section":"Hide Posts", "title":"Hide Posts Keywords", "default":""});
    FX.add_option('hide_posts_show_match', {"hidden":true, "section":"Hide Posts", "title":"Show Matching Text", "default":true});
    FX.add_option('hide_posts_partial', {"hidden":true, "section":"Hide Posts", "title":"Match Partial Words", "default":true});
    FX.add_option('hide_posts_case_sensitive', {"hidden":true, "section":"Hide Posts", "title":"Case Sensitive", "default":false});

    var sfx_post_data = {};
    var sfx_filter_trace = {};
    var filter_trace = function (id, msg) {
        sfx_filter_trace[id] = sfx_filter_trace[id] || [];
        sfx_filter_trace[id].push(msg);
    };
    X.subscribe("log/filter", function (msg, data) {
        filter_trace(data.id, data.message);
    });

    FX.on_options_load(function () {
        var FORCED_PROCESSING_DELAY = +FX.option('filters_forced_processing_delay');

        var show_filtering_disabled_message_displayed = false;
        var show_filtering_disabled_message = function () {
            if (show_filtering_disabled_message_displayed) {
                return;
            }
            show_filtering_disabled_message_displayed = true;
            var msg = "By default, post filtering only affects the News Feed.<br>You can change this in Options if you wish.";
            context_message("filter_disabled_message", msg, {"title": "Post Filtering Disabled"});
        };
        FX.on_page_unload(function () {
            show_filtering_disabled_message_displayed = false;
        });

        var filters = X.clone(FX.storage('filters'));

        // If there are any "Hide Posts" keywords defined, create a filter to hide them
        var hide_posts_text = FX.option('hide_posts_text');
        if (hide_posts_text) {

            var keywords = hide_posts_text.trim().replace(/([^\w\s\n])/g,"\\$1").split(/\s*\n\s*/);
            var keywords_regex = "(" + keywords.join('|') + ")";
            if (!FX.option('hide_posts_partial')) {
                keywords_regex = "(?:^|\\b)" + keywords_regex + "(?:\\b|$)";
            }
            var modifier = FX.option('hide_posts_case_sensitive') ? null : "i";
            var filter = {
                "match": "ALL",
                "enabled": true,
                "stop_on_match": true,
                "rules": [
                    {
                        "target": "any",
                        "operator": "matches",
                        "condition": {
                            "text": keywords_regex,
                            "modifier": modifier
                        }
                    }
                ],
                "actions": [
                    {
                        "action": "hide",
                        "show_note": true,
                        "custom_note": "Post Hidden by keyword" + (FX.option('hide_posts_show_match')?": $1":"")
                    }
                ],
                "title": "Hide Posts"
            };
            filters.unshift(filter);
        }

        var filter_post = function (msg, data, is_add) {
            // If this is a permalink (single story) page, don't run any filters
            if (X('html').attr('sfx_context_permalink') == "true") {
                return false;
            }

            var post = data.dom;
            var dom_id = data.id;
            var sfx_id = data.sfx_id;
            var post_data;

            post_data = sfx_post_data[dom_id];
            if (msg == "post/add") {
                sfx_post_data[dom_id] = {"sfx_id": sfx_id, "dom_id": dom_id, "id": dom_id};
                post_data = sfx_post_data[dom_id];
                sfx_filter_trace[dom_id] = [];
            }
            else {
                // In case of update, sfx_id might have been set
                if (sfx_id && !post_data.sfx_id) {
                    post_data.sfx_id = sfx_id;
                }
            }

            // If the post has already been properly filtered, don't do anything
            if (post.attr('sfx_filtered')) {
                return false;
            }
            // If there are no child nodes or content, then this is a shell - don't do anything yet
            if (!post[0].childNodes || post[0].childNodes.length==0 || !post.innerText()) {
                return false;
            }

            // Before filtering this post, check to see where it lives and if we should filter it
            if (FX.context.type == "profile" && !FX.option('filters_enabled_pages')) {
                filter_trace(dom_id, "Not filtering post because filtering is disabled on Pages/Timelines");
                show_filtering_disabled_message();
                return false;
            }
            if (FX.context.type == "groups" && !FX.option('filters_enabled_groups')) {
                filter_trace(dom_id, "Not filtering post because filtering is disabled in Groups");
                show_filtering_disabled_message();
                return false;
            }
            // Disable all filtering in some groups (support, etc)
            if (FX.context.type == "groups" && FX.option('filters_enabled_groups')) {
                if (/^(412712822130938|164440957000149|551488248212943|SFxSnipDev|SocialFixerSupportTeam|SocialFixerUserSupport)$/.test(FX.context.id)) {
                    var msg = "Social Fixer automatically disables filtering in support groups,<br>to avoid confusion from posts not showing.<br>Your filters will not be applied here.";
                    context_message("filter_disabled_in_support_message", msg, {"title": "Post Filtering Disabled"});
                    return false;
                }
            }

            // FILTER THE POST!
            // ================
            var result = apply_filters(post, post_data, filters, false);
            if (typeof result=="undefined") {
                // Couldn't apply filters, try again on post/update, since the attr will not have been set
                // Force it after a certain amount of time, if it's already been filtered the attr will have been set, so no worries
                setTimeout(function() {
                    if (post.attr('sfx_filtered')) { return; }
                    post.attr('sfx_filtered','true');
                    post.attr('sfx_filtered_forced','true');
                    apply_filters(post, post_data, filters, true);
                },FORCED_PROCESSING_DELAY);
            }
            else {
                // Filters were successfully applied, even if they didn't filter anything
                post.attr('sfx_filtered','true');
            }
        };

        // Only filter posts if filtering is enabled
        if (FX.option('filters_enabled') && filters && filters.length > 0) {
            X.subscribe("post/add", filter_post, true);
            X.subscribe("post/update", filter_post, false);
        }

    });

    // Extract parts of the post that can be filtered on
    // NOTE: If a part can't be found (so its match is undefined), set the value as null.
    // If it is found but has no value, then set the value as empty string
    var extract = {
        "author": function (o, data) {
            //data.author = null;
            //data.authorContent = [];
            var a = o.find('a[data-hovercard*="id="]').filter(function () {
                return (X(this).find('img').length == 0);
            }).first();
            if (a.length) {
                data.author = a[0].innerHTML;
                // Store a reference to the author link itself
                data.authorContent = [a];
            }
            return data.author;
        },
        "link_url": function (o, data) {
            //data.link_url = null;
            var a = o.find('a[onmouseover^="LinkshimAsyncLink.swap"]');
            if (a.length) {
                data.link_url = "";
            }
            a.forEach(function (a) {
                a = X(a);
                var url = a.attr('onmouseover');
                if (!url) {
                    return;
                }
                if (url) {
                    url = url.replace(/^.*?"(.*?)".*/, "$1").replace(/\\\//g, "/");
                }
                data.link_url += " " + url;
            });
            return data.link_url;
        },
        "link_text": function (o, data) {
            //data.link_text = null;
            // Look for an attachment image
            var $el = o.find('.fbStoryAttachmentImage').closest('a').parent().next();
            if ($el.length) {
                data.link_text = $el.text();
            }
            return data.link_text;
        },
        "type": function (o, data) {
            // todo?
        },
        "all_content": function (o, data) {
            data.all_content = o.innerText() || '';
            var form_content = o.find('form').innerText();
            // The form contains comments, likes, etc. Remove it from post content
            data.all_content = data.all_content.replace(form_content,'');
            return data.all_content;
        },
        "content": function (o, data) {
            //data.content = null;
            data.userContent = [];
            var str = "";
            // Store a reference to all userContent areas, in case we need to manipulate them (replace text, etc)
            o.find('.userContent').forEach(function (el) {
                el = X(el);
                str += el.innerText() + ' ';
                data.userContent.push(el);
            });
            if (str) {
                data.content = str;
            }
            return data.content;
        },
        "action": function (o, data) {
            //data.action = null;
            // Store a reference to all actionContent areas, in case we need to manipulate them (replace text, etc)
            data.actionContent = [];
            var str = "";
            o.find('.userContentWrapper h5').forEach(function (el) {
                el = X(el);
                str += el.text() + ' ';
                data.actionContent.push(el);
            });
            if (str) {
                data.action = str;
            }
            return data.action;
        },
        "app": function (o, data) {
            //data.app = null;
            var app = o.find('a[data-appname]').attr('data-appname');
            if (app) {
                data.app = app;
            }
            return data.app;
        }
    };

    // Util method to replace text content in text nodes
    function replaceText(rootNode, find, replace) {
        var children = rootNode.childNodes;
        for (var i = 0; i < children.length; i++) {
            var aChild = children[i];
            if (aChild.nodeType == 3) {
                var storedText = '';
                // If the parent node has an attribute storing the text value, check it to see if it's changed.
                // This is a method to prevent text replace actions from triggering another mutation event and repeatedly changing the same text.
                // This really only happens if the replace text is a superset of the find text.
                if (aChild.parentNode) {
                    storedText = aChild.parentNode.getAttribute('sfx_node_text') || '';
                }
                var nodeValue = aChild.nodeValue;
                if (nodeValue != storedText) {
                    var newVal = nodeValue.replace(find, replace);
                    if (newVal != nodeValue) {
                        aChild.nodeValue = newVal;
                        aChild.parentNode.setAttribute('sfx_node_text', newVal);
                    }
                }
            }
            else {
                replaceText(aChild, find, replace);
            }
        }
    }

    // Run filters to take actions on a post
    function apply_filters(post, data, filters, force_processing) {
        if (!filters || filters.length == 0) {
            return false;
        }
        var k;
        var updated_post_data = {}; // With each filtering run, re-extract pieces and update the record
        var match = false;
        filter_trace(data.id, `BEGIN Filtering`);
        if (force_processing) {
            filter_trace(data.id, `Force filtering enabled`);
        }
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            if (filter.enabled === false) {
                filter_trace(data.id, `Filter #${i + 1} (${filter.title}) Disabled`);
                continue;
            }
            filter_trace(data.id, `Filter #${i + 1} (${filter.title})`);
            var result = apply_filter(post, data, updated_post_data, filter, force_processing);
            if (typeof result=="undefined") { // Some rules could not be executed
                filter_trace(data.id, `END Filtering because a condition could not be tested yet.`);
                return; // undefined
            }
            if (result) {
                match = true;
                if (filter.stop_on_match) {
                    filter_trace(data.id, `Filter processing stopped because "Stop on Match" is active`);
                    break;
                }
            }
        }
        filter_trace(data.id, `END Filtering. Filtered=${match}`);
        // Update the post's data with the new rxtracted data
        for (k in updated_post_data) {
            data[k] = updated_post_data[k];
        }
        return match;
    }

    // Extract one type of data from a post, to filter against
    function extract_post_data(post,extracted_data,type) {
        // If it's already been extracted in this run of filtering, return it
        if (typeof extracted_data[type]!="undefined") {
            return extracted_data[type]
        }
        return extract[type](post, extracted_data);
    }

    // Execute a single filter on a post
    function apply_filter(post, data, updated_data, filter, force_processing) {
        if (!filter || !filter.rules || !filter.rules.length > 0 || !filter.actions || !filter.actions.length > 0) {
            return false;
        }
        var all_match = true;
        var any_match = false;
        var abort = false;
        filter.rules.forEach(function (rule) {
            if (abort) { return; }
            try {
                if (any_match && "ANY" === filter.match) {
                    return; // Already matched a condition
                }
                if (!all_match && "ALL" === filter.match) {
                    return; // Already failed on one rule, don't continue
                }
                var match = false;
                var operator = rule.operator;
                // The "selector" rule isn't text-based, special case to handle first
                if ("contains_selector" == operator) {
                    filter_trace(data.id, " -> Looking for selector: " + rule.condition.text);
                    if (post.find(rule.condition.text).length > 0) {
                        match = true;
                        filter_trace(data.id, " -> Found!");
                    }
                }
                else if ("day"==rule.target) {
                    var dow = (new Date()).getDay();
                    if (rule.condition["day_"+dow]) {
                        match = true;
                        filter_trace(data.id, `Day of week is ${dow} - match!`);
                    }
                }
                else if ("age"==rule.target) {
                    //var utime = extract_post_data(post, updated_data, 'age');
                    var utime = post.find('abbr.timestamp[data-utime]').attr('data-utime');
                    if (utime) {
                        var check = rule.condition.value;
                        if (rule.condition.units=='h') { check *= X.hours; }
                        if (rule.condition.units=='d') { check *= X.days; }
                        var age = (X.now() - (utime*1000));
                        filter_trace(data.id, `Post age is ${age}ms and must be ${rule.operator} ${check}ms`);
                        if (rule.operator=="gt" && (age>check)) {
                            match = true;
                        }
                        else if (rule.operator=="lt" && (age<check)) {
                            match = true;
                        }
                    }
                }
                else if ("image"==rule.target) {
                    var caption = post.find('img[alt*=":"]').attr('alt');
                    if (caption) {
                        var condition_text = rule.condition.text.replace(/\|\s*$/,'').replace(/$\s*\|/,'');
                        match = new RegExp(condition_text,'i').test(caption);
                    }
                }
                // The rest are content selector rules
                else {
                    // If the regex has a leading or trailing | it will match everything - prevent that
                    var condition_text = rule.condition.text.replace(/\|\s*$/,'').replace(/$\s*\|/,'');
                    var target = "";
                    if (rule.target == "any") {
                        target = extract_post_data(post, updated_data, 'all_content');
                    }
                    else {
                        target = extract_post_data(post, updated_data, rule.target);
                    }
                    if (typeof target=="undefined" || target==null) {
                        if (force_processing) {
                            // Act like target's empty so /^$/ matches successfully
                            filter_trace(data.id, ` -> Rule target doesn't exist (yet): ${rule.target}; acting as if it were empty`);
                            target = "";
                        }
                        else {
                            filter_trace(data.id, ` -> Rule target doesn't exist (yet): ${rule.target}; defer filtering until later`);
                            abort = true;
                            return;
                        }
                    }
                    if ("equals" == operator) {
                        match = new RegExp("^" + condition_text + "$").test(target);
                    }
                    else if ("contains" == operator) {
                        if (rule.match_partial_words) {
                            var regex = new RegExp(condition_text, "i");
                        }
                        else {
                            var regex = new RegExp("(?:^|\\b)" + condition_text + "(?:\\b|$)", "i");
                        }
                        filter_trace(data.id, " -> Testing RegExp: " + regex.toString());
                        var results = regex.exec(target);
                        if (results != null) {
                            match = true;
                            data.regex_match = results;
                        }
                        filter_trace(data.id, match ? " -> Matched Text: '" + RegExp.lastMatch + "'" : "No match");
                    }
                    else if ("startswith" == operator) {
                        var regex = RegExp("^" + condition_text, "i");
                        filter_trace(data.id, " -> Testing RegExp: " + regex.toString());
                        match = regex.test(target);
                        filter_trace(data.id, match ? " -> Matched Text: '" + RegExp.lastMatch + "'" : "No match");
                    }
                    else if ("endswith" == operator) {
                        var regex = new RegExp(condition_text + "$", "i");
                        filter_trace(data.id, " -> Testing RegExp: " + regex.toString());
                        match = regex.test(target);
                        filter_trace(data.id, match ? " -> Matched Text: '" + RegExp.lastMatch + "'" : "No match");
                    }
                    else if ("contains_in" == operator) {
                        var conditions = condition_text.split(/\s*,\s*/);
                        conditions.forEach(function (condition) {
                            if (!match && new RegExp(condition, "i").test(target)) {
                                match = true;
                            }
                        });
                    }
                    else if ("in" == operator) {
                        var conditions = condition_text.split(/,/);
                        conditions.forEach(function (condition) {
                            if (!match && new RegExp("^" + condition + "$", "i").test(target)) {
                                match = true;
                            }
                        });
                    }
                    else if ("matches" == operator) {
                        var regex = new RegExp(condition_text, (rule.condition.modifier || ''));
                        filter_trace(data.id, "Testing RegExp: " + regex.toString());
                        var results = regex.exec(target);
                        if (results != null) {
                            match = true;
                            data.regex_match = results;
                        }
                        filter_trace(data.id, match ? " -> Matched Text: '" + RegExp.lastMatch + "'" : "No match");

                    }
                }
                if (match) {
                    any_match = true;
                }
                else if (all_match) {
                    all_match = false;
                }
            } catch (e) {
                filter_trace(data.id, "ERROR: " + e.message);
            }
        });

        if (abort) {
            return; // undefined
        }

        // Were enough rules satisfied to execute the actions?
        if (!any_match || (filter.match == "ALL" && !all_match)) {
            return false;
        }

        // Filter matched! Execute the actions
        filter.actions.forEach(function (action) {
            apply_action(post, data, action, filter);
        });

        // Filter matched
        return true;
    }

// Apply a single filter action to a post
    function apply_action(post, data, action, filter) {
        if ("class" == action.action) {
            filter_trace(data.id, `Applying CSS class '${action.content}'`);
            post.addClass(action.content);
        }
        else if ("css" == action.action) {
            var css_target = action.selector ? post.find(action.selector) : post;
            var rules = action.content.split(/\s*;\s*/);
            filter_trace(data.id, `Applying CSS '${action.content}'`);
            rules.forEach(function (rule) {
                var parts = rule.split(/\s*:\s*/);
                if (parts && parts.length > 1) {
                    css_target.css(parts[0], parts[1]);
                }
            })
        }
        else if ("replace" == action.action) {
            filter_trace(data.id, `Replacing '${action.find}' with '${action.replace}'`);
            if (data.userContent) {
                data.userContent.forEach(function (usercontent) {
                    replaceText(usercontent[0], new RegExp(action.find, "gi"), action.replace);
                });
            }
            if (data.authorContent) {
                data.authorContent.forEach(function (authorcontent) {
                    replaceText(authorcontent[0], new RegExp(action.find, "gi"), action.replace);
                });
            }
        }
        else if ("hide" == action.action) {
            if (!post.hasClass('sfx_filter_hidden')) {
                post.addClass("sfx_filter_hidden");
                filter_trace(data.id, `Hiding Post`);
                if (action.show_note) {
                    post.prepend(filter_hidden_note(filter, action, data));
                }
            }
        }
        else if ("move-to-tab" == action.action) {
            var tab_name = regex_replace_vars(action.tab, data.regex_match);
            filter_trace(data.id, `Moving to tab '${tab_name}'`);
            X.publish("filter/tab/move", {"tab": tab_name, "post": post, "data": data});
        }
        else if ("copy-to-tab" == action.action) {
            var tab_name = regex_replace_vars(action.tab, data.regex_match);
            filter_trace(data.id, `Copying to tab '${tab_name}'`);
            X.publish("filter/tab/copy", {"tab": tab_name, "post": post, "data": data});
        }
    }

    function regex_replace_vars(str, matches) {
        if (!str || !matches || !matches.length) {
            return str;
        }
        return str.replace(/\$(\d+)/g, function (m) {
            var i = m[1];
            if (i < matches.length) {
                return matches[i];
            }
            return "";
        });
    }

    function filter_hidden_note(filter, action, data) {
        var css = action.css || '';
        if (action.custom_note) {
            var note_text = regex_replace_vars(action.custom_note, data.regex_match);
            var note = X(`<div class="sfx_filter_hidden_note" style="${css}">${note_text}</div>`);
        }
        else {
            var note = X(`<div class="sfx_filter_hidden_note" style="${css}">Post hidden by filter "${filter.title}". Click to toggle post.</div>`);
        }
        note.on('click', function () {
            note.closest('*[sfx_post]').toggleClass('sfx_filter_hidden_show');
        });
        return note;
    }

    // Add actions to the post action tray
    X.publish('post/action/add', {"section": "filter", "label": "Edit Filters", "message": "menu/options", "data": {"section": "Filters"}});
    X.publish('post/action/add', {"section": "filter", "label": "Filter Debugger", "message": "post/action/filter/debug"});
    X.subscribe('post/action/filter/debug', function (msg, data) {
        var data_content = JSON.stringify(sfx_post_data[data.id], null, 3);
        var trace = sfx_filter_trace[data.id];
        var trace_content = trace ? trace.join('<br>') : 'No Trace';
        var content = `
        <div>This popup gives details about how this post was processed for filtering.</div>
        <div draggable="false" class="sfx_bubble_note_subtitle">Filtering Trace</div>
        <div draggable="false" class="sfx_bubble_note_data">${trace_content}</div>
        <div draggable="false" class="sfx_bubble_note_subtitle">Raw Extracted Post Data</div>
        <div draggable="false" class="sfx_bubble_note_data">${data_content}</div>
    `;
        var note = bubble_note(content, {"position": "top_right", "title": "Post Filtering Debug", "close": true});
    });
});
