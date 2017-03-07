X.ready('options', function() {
    FX.add_option('show_filtering_tooltips', {"hidden":true, "default": true});
	FX.on_options_load(function () {
		// Update Tweaks and Filtes in the background every so often
		X.task('update_filter_subscriptions', 4 * X.hours, function () {
			update_subscribed_filters(FX.storage('filters'));
		});
		X.task('update_tweak_subscriptions', 4 * X.hours, function () {
			update_subscribed_tweaks(FX.storage('tweaks'));
		});

		// Update user subscriptions with data from the server
		var retrieve_filter_subscriptions = function (user_filters, callback) {
			X.ajax("https://matt-kruse.github.io/socialfixerdata/filters.json", function (content) {
				if (content && content.filters && content.filters.length > 0) {
					// Mark the subscribed ones
					mark_subscribed_filters(content.filters, user_filters);
					if (callback) {
						callback(content.filters);
					}
				}
			});
		};
		// Mark filter subscriptions as subscribed if the user has added them
		var mark_subscribed_filters = function (subscriptions, user_filters) {
			// Build up a list of user filter id's
			var subscription_ids = {};
			if (user_filters && user_filters.length) {
				user_filters.forEach(function (f) {
					if (f.id) {
						subscription_ids[f.id] = true;
					}
				});
			}
			subscriptions = subscriptions || [];
			if (subscriptions && subscriptions.length) {
				subscriptions.forEach(function (filter) {
					filter.subscribed = (!!subscription_ids[filter.id]);
				});
			}
		};
		var update_subscribed_filters = function (user_filters, callback) {
			retrieve_filter_subscriptions(user_filters, function (subscriptions) {
				if (!subscriptions || subscriptions.length < 1) {
					return;
				}
				var any_dirty = false;
				// Loop through the subscriptions to see if user filters need to be updated
				var subscribed = {};
				if (user_filters && user_filters.length) {
					user_filters.forEach(function (f) {
						if (f.id) {
							subscribed[f.id] = f;
						}
					});
				}
				subscriptions = subscriptions || [];
				if (subscriptions && subscriptions.length) {
					subscriptions.forEach(function (filter) {
						var user_filter = subscribed[filter.id];
						if (!user_filter) {
							return;
						}
						var key, dirty = false;
						// Map the properties of the subscription to the user filter
						// Don't overwrite the entire object because things like 'enabled' are stored locally
						for (key in filter) {
							if (key == "subscribed" || key == "enabled") {
								continue;
							}
							// Check to see if the user filter data needs updated
							// If user has customized actions, don't over-write, otherwise update
							if (key == 'actions' && filter.configurable_actions && user_filter.custom_actions) {
								continue;
							}
							if (JSON.stringify(user_filter[key]) != JSON.stringify(filter[key])) {
								user_filter[key] = filter[key];
								dirty = true;
							}
						}
						if (dirty) {
							user_filter.subscription_last_updated_on = X.now();
							any_dirty = true
						}
					});
				}
				// if any of the subscriptions were dirty, save the filters
				if (any_dirty) {
					X.storage.save('filters', X.clone(user_filters), function () {
					});
				}
				if (callback) {
					callback(subscriptions);
				}
			});
		};

		// Update user subscriptions with data from the server
		var retrieve_tweak_subscriptions = function (user_tweaks, callback) {
			X.ajax("https://matt-kruse.github.io/socialfixerdata/tweaks.json", function (content) {
				if (content && content.tweaks && content.tweaks.length > 0) {
					// Mark the subscribed ones
					mark_subscribed_tweaks(content.tweaks, user_tweaks);
					if (callback) {
						callback(content.tweaks);
					}
				}
			});
		};
		// Mark tweak subscriptions as subscribed if the user has added them
		var mark_subscribed_tweaks = function (subscriptions, user_tweaks) {
			// Build up a list of user tweak id's
			var subscription_ids = {};
			if (user_tweaks && user_tweaks.length) {
				user_tweaks.forEach(function (f) {
					if (f.id) {
						subscription_ids[f.id] = true;
					}
				});
			}
			subscriptions = subscriptions || [];
			if (subscriptions && subscriptions.length) {
				subscriptions.forEach(function (tweak) {
					tweak.subscribed = (!!subscription_ids[tweak.id]);
				});
			}
		};
		var update_subscribed_tweaks = function (user_tweaks, callback) {
			retrieve_tweak_subscriptions(user_tweaks, function (subscriptions) {
				if (!subscriptions || subscriptions.length < 1) {
					return;
				}
				var any_dirty = false;
				// Loop through the subscriptions to see if user tweaks need to be updated
				var subscribed = {};
				if (user_tweaks && user_tweaks.length) {
					user_tweaks.forEach(function (f) {
						if (f.id) {
							subscribed[f.id] = f;
						}
					});
				}
				subscriptions = subscriptions || [];
				if (subscriptions && subscriptions.length) {
					subscriptions.forEach(function (tweak) {
						var user_tweak = subscribed[tweak.id];
						if (!user_tweak) {
							return;
						}
						var key, dirty = false;
						// Map the properties of the subscription to the user tweak
						// Don't overwrite the entire object because things like 'enabled' are stored locally
						for (key in tweak) {
							if (key == "subscribed") {
								continue;
							}
							// Check to see if the user tweak data needs updated
							if (JSON.stringify(user_tweak[key]) != JSON.stringify(tweak[key])) {
								user_tweak[key] = tweak[key];
								dirty = true;
							}
						}
						if (dirty) {
							user_tweak.subscription_last_updated_on = X.now();
							any_dirty = true
						}
					});
				}
				// if any of the subscriptions were dirty, save the tweaks
				if (any_dirty) {
					X.storage.save('tweaks', X.clone(user_tweaks), function () {

					});
				}
				if (callback) {
					callback(subscriptions);
				}
			});
		};

		// Options Dialog
		var sections = [
			{'name': 'General', 'description': ''}
            , {'name': 'Hide Posts', 'description': ''}
			, {'name': 'Filters', 'description': ''}
			, {'name': 'User Interface', 'description': ''}
			, {'name': 'Display Tweaks', 'description': ''}
			, {'name': 'Tips', 'description': 'These are not features of Social Fixer - they are useful Facebook tips that users may not know about, or that I think are especially useful.'}
			, {'name': 'Advanced', 'description': ''}
			, {'name': 'Experiments', 'description': 'These features are a work in progress, not fully functional, or possibly confusing to users.'}
			, {'name': 'Data Import/Export', 'description': ''}
			, {'name': 'Support', 'url': 'https://matt-kruse.github.io/socialfixerdata/support.html', 'property': 'content_support'}
			, {'name': 'Donate', 'url': 'https://matt-kruse.github.io/socialfixerdata/donate.html', 'property': 'content_donate'}
			, {'name': 'About', 'url': 'https://matt-kruse.github.io/socialfixerdata/about.html', 'property': 'content_about'}
            , {'name': 'Debug', 'className':'sfx_debug_tab', 'description':`These are debugging tools to help developers and those needing support. These are not normal features. Play with them if you wish, or visit them if asked to by the Support Team.`}
		];
		var data = {
			"action_button": null
			, "show_action_buttons": true
			, "sections": sections
			, "filters": null
			, "show_filtering_tooltips": FX.option('show_filtering_tooltips')
			, "editing_filter": null
			, "editing_filter_index": -1
			, "filter_subscriptions": null
			, "tweak_subscriptions": null
			, "tweaks": null
			, "editing_tweak": null
			, "editing_tweak_index": -1
			, "show_advanced": false
			, "options": FX.options
			, "user_options": ""
			, "user_options_message": null
			, "storage_size": JSON.stringify(X.storage.data).length
			, "sfx_version": version
			, "content_about": "Loading..."
			, "content_donate": "Loading..."
			, "sfx_option_show_donate": false
			, "content_support": "Loading..."
			, "user_agent": navigator.userAgent
			, "userscript_agent": (typeof GM_info === "undefined") ? "unknown v:unknown" : (GM_info.scriptHandler || "Greasemonkey") + " v:" + (GM_info.version || "unknown")
		};
		X.subscribe('menu/options', function (event, event_data) {
			if (!event_data) { event_data={}; }
			try {
				if (X('#sfx_options_dialog').length) {
					return;
				}

				// Prepare data for options dialog display.
				// We can't work on the real options object, in case the user cancels.
				// So we need to work on a copy, then overlay it when they save.

				// Convert the options into section-based options
				sections.forEach(function (section_object) {
					var sectionName = section_object.name;
					section_object.options = [];
					if (event_data.section) {
						section_object.selected = (event_data.section == sectionName);
					}
					else {
						section_object.selected = (sectionName == 'General');
					}
					for (k in FX.options) {
						var opt = FX.options[k];
						if ((sectionName == 'General' && !opt.section) || (sectionName == opt.section)) {
							opt.newValue = opt.value = FX.option(opt.key);
							section_object.options.push(opt);
						}
						if (opt.title && opt.title==event_data.highlight_title) {
							opt.highlighted=true;
						}
					}

					section_object.options = section_object.options.sort(function (a, b) {
						var x = (a.title || "") + " " + (a.description || "");
						var y = (b.title || "") + " " + (b.description || "");
						if (x < y)
							return -1;
						if (x > y)
							return 1;
						return 0;
					});
				});

				var filters = X.clone(X.storage.data['filters']);
				filters.forEach(function (o) {
					// Make sure every filter has rules and actions
					if (!X.def(o.rules)) {
						o.rules = [];
					}
					if (!X.def(o.actions)) {
						o.actions = [];
					}
				});
				data.filters = filters;

				var tweaks = X.clone(X.storage.data['tweaks']);
				data.tweaks = tweaks;

				// Render the options dialog content
				var dialog = `<div id="sfx_options_dialog" class="sfx_dialog flex-column" style="transition: height .01s;">
	<div id="sfx_options_dialog_header" class="sfx_dialog_title_bar" style="cursor:move;" @click="collapse">
		Social Fixer
		<div id="sfx_options_dialog_actions" v-if="show_action_buttons" draggable="false" >
			<input draggable="false" v-if="action_button=='done_editing_filter'" class="sfx_options_dialog_panel_button sfx_button" type="button" value="Done Editing Filter" @click.stop="close_filter">
			<input draggable="false" v-if="action_button=='done_editing_tweak'" class="sfx_options_dialog_panel_button sfx_button" type="button" value="Done Editing Tweak" @click.stop="close_tweak">
			<input draggable="false" v-if="!action_button" class="sfx_button" type="button" @click.stop="save" value="Save Changes">
			<input draggable="false" type="button" class="sfx_button secondary" @click.stop="cancel" value="Cancel">
		</div>
	</div>
	<div id="sfx_options_dialog_body" class="flex-row" draggable="false">
		<div id="sfx_options_dialog_sections">
			<div v-for="section in sections" @click="select_section(section)" class="sfx_options_dialog_section {{section.selected?'selected':''}} {{section.className}}">{{section.name}}</div>
		</div>
		<div id="sfx_options_dialog_content">
			<div v-if="section.selected" v-for="section in sections" class="sfx_options_dialog_content_section">
				<template v-if="section.name=='Filters'">
					<div id="sfx_options_dialog_filters" class="sfx_options_dialog_filters">

					    <div v-if="!editing_filter" class="sfx_options_dialog_filter_list">
					        <div class="">
					            <span class="sfx_button" style="float:right;background-color:green;" onclick="window.open('https://github.com/matt-kruse/SocialFixer/wiki/Post-Filtering#filter-list','SFX_FILTER_HELP','width=1024,height=600');"><b>[?]</b> Open Filter Help</span>
					            Post Filters let you hide posts, put them in tabs, or change their appearance based on their content. They execute in the order below for each post.
					            <br style="clear:both;">
					        </div>
					        <div class="sfx_option" style="margin:10px 10px;font-size:14px;float:left;">
					            <input id="filters_enabled" type="checkbox" v-model="options.filters_enabled.newValue"/><label for="filters_enabled"></label> Post Filtering enabled
					        </div>
					        <div class="sfx_option" style="margin:10px 10px;font-size:14px;float:left;">
					            <input id="filters_enabled_pages" type="checkbox" v-model="options.filters_enabled_pages.newValue"/><label for="filters_enabled_pages"></label> Filter on Pages/Timelines
					        </div>
					        <div class="sfx_option" style="margin:10px 10px;font-size:14px;float:left;">
					            <input id="filters_enabled_groups" type="checkbox" v-model="options.filters_enabled_groups.newValue"/><label for="filters_enabled_groups"></label> Filter in Groups
					        </div>
					        <div class="sfx_options_dialog_panel_header" style="clear:both;">Active Filters</div>
					        <div>
					            <input type="button" class="sfx_button" value="Create A New Filter" @click="add_filter">
					        </div>
					        <table class="sfx_options_dialog_table">
					            <thead>
					            <tr>
					                <th>Title</th>
					                <th>Description</th>
					                <th style="text-align:center;">Actions</th>
					                <th style="text-align:center;">Stop On<br>Match</th>
					                <th style="text-align:center;">Enabled</th>
					            </tr>
					            </thead>
					            <tbody>
					            <tr v-for="filter in filters" v-bind:class="{'!sfx_options_dialog_option_enabled':filter.disabled}">
					                <td class="sfx_options_dialog_option_title">{{filter.title}}<div v-if="filter.id" style="font-weight:normal;font-style:italic;color:#999;margin-top:5px;">(Subscription)</div></td>
					                <td class="sfx_options_dialog_option_description">
					                    {{filter.description}}
					                    <div v-if="filter.id && filter.subscription_last_updated_on" style="font-style:italic;color:#999;margin-top:5px;">Subscription last updated: {{ago(filter.subscription_last_updated_on)}}</div>
					                </td>
					                <td class="sfx_options_dialog_option_action" style="white-space:nowrap;">
					                    <span class="sfx_square_control" v-tooltip="Edit" @click="edit_filter(filter,$index)">&#9998;</span>
					                    <span class="sfx_square_control sfx_square_delete"  v-tooltip="Delete" @click="delete_filter(filter)">&times;</span>
					                    <span class="sfx_square_control" v-tooltip="Move Up" @click="up(filter)">&#9650;</span>
					                    <span v-if="$index<filters.length-1" class="sfx_square_control" v-tooltip="Move Down" @click="down(filter)">&#9660;</span>
					                </td>
					                <td style="text-align:center;">
					                    <input id="sfx_stop_{{$index}}" type="checkbox" v-model="filter.stop_on_match"/><label for="sfx_stop_{{$index}}" data-tooltip-delay="100" v-tooltip="If a post matches this filter, don't process the filters that follow, to prevent it from being double-processed. For most situations, this should remain checked."></label>
					                </td>
					                <td style="text-align:center;">
					                    <input id="sfx_filter_{{$index}}" type="checkbox" v-model="filter.enabled"/><label for="sfx_filter_{{$index}}"></label>
					                </td>
					            </tr>
					            </tbody>
					        </table>

					        <div v-if="filter_subscriptions">
					            <div class="sfx_options_dialog_panel_header">Filter Subscriptions</div>
					            <div>The pre-defined filters below are available for you to use. These "Filter Subscriptions" will be automatically maintained for you, so as Facebook changes or more keywords are needed to match a specific topic, your filters will be updated without you needing to do anything!</div>
					            <table class="sfx_options_dialog_table">
					                <thead>
					                <tr>
					                    <th>Title</th>
					                    <th>Description</th>
					                    <th>Actions</th>
					                </tr>
					                </thead>
					                <tbody>
					                <tr v-for="filter in filter_subscriptions" v-bind:class="{'sfx_filter_subscribed':filter.subscribed}">
					                    <template v-if="version_check(filter)">
					                    <td class="sfx_options_dialog_option_title">{{filter.title}}</td>
					                    <td class="sfx_options_dialog_option_description">{{filter.description}}</td>
					                    <td class="sfx_options_dialog_option_action">
					                        <span class="sfx_square_add" v-tooltip="Add To My Filters" @click="add_subscription(filter)">+</span>
					                    </td>
					                    </template>
					                </tr>
					                </tbody>
					            </table>
					        </div>
					    </div>

					    <div v-if="editing_filter" class="sfx_options_dialog_panel">
					        <div style="float:right;">
					            <!--<input type="checkbox" class="normal" v-model="show_filtering_tooltips" @click="toggle_tooltips"> Show Tooltips-->
					            <span class="sfx_button" style="background-color:green;" onclick="window.open('https://github.com/matt-kruse/SocialFixer/wiki/Post-Filtering#edit-filter','SFX_FILTER_HELP','width=1024,height=600');"><b>[?]</b> Open Filter Help</span>
					        </div>
					        <div class="sfx_panel_title_bar">
					            Edit Filter
					            <br style="clear:both;">
					        </div>
					        <div class="sfx_info" v-if="editing_filter.id">
					            This filter is a subscription, so its definition is stored on the SocialFixer.com server and updated automatically for you. If you wish to edit this filter, you can do so but it will "break" the subscription and your copy will be local and no longer updated automatically as Facebook changes.
					            <br><input type="button" class="sfx_button" value="Convert to local filter" @click="editing_filter.id=null"/>
					        </div>
					        <div class="sfx_label_value">
					            <div>Title:</div>
					            <div><input class="sfx_wide" v-model="editing_filter.title" v-bind:disabled="editing_filter.id"/></div>
					        </div>
					        <div class="sfx_label_value">
					            <div>Description:</div>
					            <div><input class="sfx_wide" v-model="editing_filter.description" v-bind:disabled="editing_filter.id"></div>
					        </div>
					        <div class="sfx_options_dialog_filter_conditions sfx_options_dialog_panel">
					            <div class="sfx_panel_title_bar">
					                IF ...
					                <br style="clear:both;">
					            </div>
					            <div v-for="rule in editing_filter.rules">
					                <div style="display:table-row;" class="sfx_label_value">
					                    <div><select v-if="$index>0" v-model="editing_filter.match" v-bind:disabled="editing_filter.id"><option value="ALL" data-tooltip-delay="100" v-tooltip="Choose whether all conditions must be met (AND) or if any of the conditions must be met (OR)">AND<option value="ANY">OR</select></div>
					                    <div><select v-model="rule.target" v-bind:disabled="editing_filter.id" data-tooltip-delay="100" v-tooltip="Which attribute of the post do you want to match on?\nSee the Filter Help for a full explanation of each type">
					                        <option value="any">Any Post Content</option>
					                        <option value="content">Post Text Content</option>
					                        <option value="action">Post Action</option>
					                        <option value="author">Author</option>
					                        <option value="app">App/Game Name</option>
					                        <option value="link_url">Link URL</option>
					                        <option value="link_text">Link Text</option>
					                        <option value="day">Day of the Week</option>
					                        <option value="age">Post Age</option>
					                        <option value="image">Picture of </option>
					                    </select></div>
					                    <template v-if="rule.target=='day'">
					                        <div style="padding-left:10px;" data-tooltip-delay="100" v-tooltip="Choose which days of the week this filter should be active">
					                            is
					                            <input type="checkbox" class="normal" v-model="rule.condition.day_0" v-bind:disabled="editing_filter.id"> Sun
					                            <input type="checkbox" class="normal" v-model="rule.condition.day_1" v-bind:disabled="editing_filter.id"> Mon
					                            <input type="checkbox" class="normal" v-model="rule.condition.day_2" v-bind:disabled="editing_filter.id"> Tue
					                            <input type="checkbox" class="normal" v-model="rule.condition.day_3" v-bind:disabled="editing_filter.id"> Wed
					                            <input type="checkbox" class="normal" v-model="rule.condition.day_4" v-bind:disabled="editing_filter.id"> Thu
					                            <input type="checkbox" class="normal" v-model="rule.condition.day_5" v-bind:disabled="editing_filter.id"> Fri
					                            <input type="checkbox" class="normal" v-model="rule.condition.day_6" v-bind:disabled="editing_filter.id"> Sat
					                        </div>
					                    </template>
					                    <template v-if="rule.target=='age'">
					                        <div style="padding-left:10px;">
					                            is
					                            <select v-model="rule.operator" v-bind:disabled="editing_filter.id">
					                                <option value="gt">Greater Than</option>
					                                <option value="lt">Less Than</option>
					                            </select>
					                            <input type="number" min="1" style="width:40px;" v-model="rule.condition.value" size="3" v-bind:disabled="editing_filter.id">
					                            <select v-model="rule.condition.units" v-bind:disabled="editing_filter.id">
					                                <option value="h">Hours</option>
					                                <option value="d">Days</option>
					                            </select>
					                        </div>
					                    </template>
					                    <template v-if="rule.target=='image'">
					                        <div data-tooltip-delay="100" v-tooltip="Match keywords in Facebook's auto-generated description, if they exist. This is not always reliable (yet) due to Facebook's inconsistent labeling.">
					                            <input class="sfx_wide" v-model="rule.condition.text" v-bind:disabled="editing_filter.id">
					                        </div>
					                    </template>
					                    <template v-if="rule.target!='day' && rule.target!='age' && rule.target!='image'">
					                        <div>
					                            <select v-model="rule.operator" v-bind:disabled="editing_filter.id">
					                                <option value="contains">Contains</option>
					                                <option value="equals">Equals Exactly</option>
					                                <option value="startswith">Starts With</option>
					                                <option value="endswith">Ends With</option>
					                                <option value="matches">Matches Regex</option>
					                                <option value="contains_selector">Matches CSS Selector</option>
					                            </select>
					                        </div>
					                        <div class="stretch" style="white-space:nowrap;">
					                            <span v-if="rule.operator=='matches'" style="margin-left:10px;font-weight:bold;">/</span>
					                            <input v-if="rule.operator=='contains' || rule.operator=='equals' || rule.operator=='startswith' || rule.operator=='endswith' || rule.operator=='contains_selector'" class="sfx_wide" v-on:focus="clear_test_regex" v-on:blur="test_regex" v-model="rule.condition.text" v-bind:disabled="editing_filter.id">
					                            <input v-if="rule.operator=='matches'" class="sfx_wide" v-model="rule.condition.text" style="max-width:70%;" v-bind:disabled="editing_filter.id">
					                            <div style="white-space:normal;" v-if="rule.operator=='equals' || rule.operator=='contains'">(Separate words by pipe | to match multiple)</div>
					                            <span v-if="rule.operator=='matches'" style="font-weight:bold;">/</span>
					                            <input v-if="rule.operator=='matches'" v-model="rule.condition.modifier" size="2" v-bind:disabled="editing_filter.id" data-tooltip-delay="100" v-tooltip="Regular Expression modifier, such as 'i' for case-insensitive">
					                            <span v-if="rule.operator=='matches'" class="sfx_link" @click="regex_test(rule.condition)" data-tooltip-delay="100" v-tooltip="Test your regular expression against text to make sure it matches as you expect."> [test]</span>
					                        </div>
					                        <div v-if="rule.operator=='contains'" style="white-space:nowrap;padding-left:5px;">
					                            <input type="checkbox" class="normal" v-model="rule.match_partial_words" v-bind:disabled="editing_filter.id" data-tooltip-delay="100" v-tooltip="Check this if you want the text to be a partial match. For example, if 'book' should also match 'Facebook'. If unchecked, only whole words will be matched.">
					                            <span v-if="(!editing_filter.id || rule.match_partial_words)"> Match partial words</span>
					                        </div>
					                    </template>
					                    <span v-if="editing_filter.rules.length>1" class="sfx_square_control sfx_square_delete" style="margin:0 10px;" v-tooltip="Delete" @click="delete_rule(rule)">&times;</span>
					                </div>
					            </div>
					            <div v-if="!editing_filter.id">
					                <input type="button" class="sfx_button" value="Add A Condition" @click="add_condition">
					            </div>
					        </div>
					        <div class="sfx_options_dialog_filter_actions sfx_options_dialog_panel">
					            <div class="sfx_panel_title_bar">... THEN</div>
					            <div class="sfx_info" v-if="editing_filter.id && editing_filter.configurable_actions && editing_filter.actions[0].action==''">
					                This Filter Subscription defines the rules above, but the action to take is up to you to define. When updated automatically, the rules above will be updated but your selected actions are personal to you.
					            </div>
					            <div class="sfx_info" v-if="editing_filter.id && editing_filter.configurable_actions && editing_filter.actions[0].action!=''">
					                The Actions to take when this filter subscription matches may be changed. If you change the actions, the criteria above will continue to be updated but your customized actions will not be over-written when the filter updates itself.
					            </div>
					            <div v-for="action in editing_filter.actions">
					                <select v-model="action.action" v-bind:disabled="editing_filter.id && !editing_filter.configurable_actions" data-tooltip-delay="100" v-tooltip="If the conditions match, what action should be taken on the post?">
					                    <option value=""></option>
					                    <option value="hide">Hide post</option>
					                    <option value="css">Add CSS</option>
					                    <option value="class">Add CSS Class</option>
					                    <option value="replace">Replace text</option>
					                    <option value="move-to-tab">Move post to tab</option>
					                    <option value="copy-to-tab">Copy post to tab</option>
					                </select>
					                <span v-if="action.action=='hide'">
					                    <input type="checkbox" class="normal" v-model="action.show_note"  data-tooltip-delay="100" v-tooltip="This will leave a small message in your feed to let you know that a post was hidden." v-bind:disabled="editing_filter.id && !editing_filter.configurable_actions"> Show a note where the post would have been.
					                    <span v-if="action.show_note">Optional Custom Message: <input v-model="action.custom_note" size="20" data-tooltip-delay="100" v-tooltip="Customize the message displayed to be anything you wish."></span>
					                </span>
					                <span v-if="action.action=='css'">
					                    CSS: <input v-model="action.content" size="45" v-bind:disabled="editing_filter.id && !editing_filter.configurable_actions">
					                    To Selector: <input v-model="action.selector" size="25" data-tooltip-delay="100" v-tooltip="Apply the CSS to the element(s) specified by the selector. To target the whole post container, leave blank." v-bind:disabled="editing_filter.id && !editing_filter.configurable_actions">
					                </span>
					                <span v-if="action.action=='class'">
					                    <input v-model="action.content" size="45" v-bind:disabled="editing_filter.id && !editing_filter.configurable_actions" data-tooltip-delay="100" v-tooltip="Add a class name to the post container. This is useful in conunction with a Display Tweak to customize CSS">
					                </span>
					                <span v-if="action.action=='replace'">
					                    Find: <input v-model="action.find" size="25" v-bind:disabled="editing_filter.id && !editing_filter.configurable_actions">
					                    Replace With: <input v-model="action.replace" size="25" v-bind:disabled="editing_filter.id && !editing_filter.configurable_actions">
					                </span>
					                <span v-if="action.action=='move-to-tab' || action.action=='copy-to-tab'">
					                    Tab Name: <input v-model="action.tab" size="45" v-bind:disabled="editing_filter.id && !editing_filter.configurable_actions">
					                </span>
					                <span v-if="editing_filter.actions.length>1" class="sfx_square_control sfx_square_delete" style="margin:0 10px;" v-tooltip="Delete" @click="delete_action(action)">&times;</span>
					            </div>
					            <div v-if="!editing_filter.id || editing_filter.configurable_actions">
					                <input type="button" class="sfx_button" value="Add An Action" @click="add_action">
					            </div>
					        </div>
					        <div class="sfx_link" @click="show_advanced=!show_advanced" v-tooltip="{position:'above',content:'View the underlying JSON data structure for this filter. The filter can be edited manually here, or you can paste in filter code from someone else to copy their filter exactly.',delay:500}">{{show_advanced?"Hide Advanced Code &#9650;":"Show Advanced Code &#9660;"}}</div>
					        <textarea v-if="show_advanced" style="width:90%;height:150px;font-size:11px;font-family:monospace;" v-model="editing_filter|json" v-bind:disabled="editing_filter.id"></textarea>
					    </div>
					</div>
				</template>
				<template v-if="section.name=='Data Import/Export'">
					<div class="sfx_info">Here you can export all of Social Fixer's stored data, including options, filters, and which stories have been read. When you export, your data will appear in the window, which you can copy and paste somewhere else if you wish. You can also import settings that are pasted into the window. WARNING: This will overwrite your existing settings!</div>
					Total storage space used: {{storage_size | currency '' 0}} bytes<br>
					<input type="button" class="sfx_button" value="Export User Data" @click="populate_user_options()"> <input type="button" class="sfx_button" value="Import Data" @click="import_data()"> <input type="button" class="sfx_button" value="Reset All Data" @click="reset_data()">
					<br>
					<div v-if="user_options_message" class="sfx_info">{{user_options_message}}</div>
					<textarea id="sfx_user_data" v-model="user_options|json" style="width:95%;height:50vh;font-family:courier new,monospace;font-size:11px;"></textarea>
				</template>
				<template v-if="section.name!='Filters'">
					<div v-if="section.description" style="margin-bottom:15px;">{{section.description}}</div>
					<table class="sfx_options_dialog_table">
						<tr v-for="opt in section.options | orderBy title" v-if="!opt.hidden" class="{{opt.highlighted?'sfx_options_dialog_option_highlighted':''}}">
							<td class="sfx_options_dialog_option_title {{($index==0 || section.options[$index-1].title!=opt.title)?'':'repeat'}}">{{opt.title}}</td>
							<td class="sfx_options_dialog_option_description">{{opt.description}}
								<input v-if="opt.type=='text'" v-model="opt.newValue" style="display:block;width:{{opt.width || '50%'}};"/>
								<input v-if="opt.type=='number'" type="number" min="{{opt.min||1}}" max="{{opt.max||999}}" v-model="opt.newValue"/>
								<textarea v-if="opt.type=='textarea'" v-model="opt.newValue" style="display:block;width:95%;height:100px;"></textarea>
							</td>
							<td class="sfx_options_dialog_option_action">
								<template v-if="opt.type=='checkbox'">
									<input id="sfx_option_{{opt.key}}" type="checkbox" v-model="opt.newValue"/><label for="sfx_option_{{opt.key}}"></label>
								</template>
								<template v-if="opt.type=='link'">
									<input type="button" data-href="{{opt.url}}" onclick="window.open(this.getAttribute('data-href'));" class="sfx_button" value="GO!">
								</template>
								<template v-if="opt.type=='action'">
									<input type="button" @click="message(opt.action_message)" class="sfx_button" value="{{opt.action_text}}">
								</template>
							</td>
						</tr>
					</table>

					<!-- Custom Section Displays -->
					<template v-if="section.name=='Hide Posts'">
						<b>Easily hide posts from your News Feed by keyword or phrase.</b>
						<br><br>
						Just enter each keyword or phrase you want to hide on a separate line in the text box. Any post containing one of those words will be hidden, and a small message will be shown in its place. To have more control over filtering, advanced post filtering can be setup in the "Filters" tab.
						<br><br>
						<input type="checkbox" class="normal" v-model="options.hide_posts_show_match.newValue"> Show the word or phrase that matched in the hidden post message
						<br>
						<input type="checkbox" class="normal" v-model="options.hide_posts_partial.newValue"> Match partial words (example: "the" will also match "them")
						<br>
						<input type="checkbox" class="normal" v-model="options.hide_posts_case_sensitive.newValue"> Match Case
						<br>
						Hide posts with these keywords or phrases (each on its own line):<br>
						<textarea v-model="options.hide_posts_text.newValue" style="width:80%;height:150px;"></textarea>

					</template>
					<template v-if="section.name=='Display Tweaks'">
						<div v-if="!editing_tweak">
						    <div class="">
						        Display Tweaks are small snippets of CSS which change the appearance of the page. They can do anything from changing colors and fonts to hiding parts of the page or completely changing the layout. Advanced users can add their own tweaks, but most users will want to select some from the list of available Tweaks.
						    </div>
						    <div class="sfx_option" style="margin:10px 0;font-size:14px;"><input id="tweaks_enabled" type="checkbox" v-model="options.tweaks_enabled.newValue"/><label for="tweaks_enabled"></label> Tweaks enabled</div>
						    <div>
						        <input type="button" class="sfx_button" value="Create A New Tweak" @click="add_tweak">
						    </div>
						    <div v-if="tweaks.length" class="sfx_options_dialog_panel_header">Active Tweaks</div>
						    <table v-if="tweaks.length" class="sfx_options_dialog_table">
						        <thead>
						        <tr>
						            <th>Title</th>
						            <th>Description</th>
						            <th style="text-align:center;">Actions</th>
						            <th style="text-align:center;">Enabled</th>
						        </tr>
						        </thead>
						        <tbody>
						        <tr v-for="tweak in tweaks" v-bind:class="{'sfx_options_dialog_option_disabled':tweak.disabled}">
						            <td class="sfx_options_dialog_option_title">{{tweak.title}}<div v-if="tweak.id" style="font-weight:normal;font-style:italic;color:#999;margin-top:5px;">(Subscription)</div></td>
						            <td class="sfx_options_dialog_option_description">
						                {{tweak.description}}
						                <div v-if="tweak.id && tweak.subscription_last_updated_on" style="font-style:italic;color:#999;margin-top:5px;">Subscription last updated: {{ago(tweak.subscription_last_updated_on)}}</div>
						            </td>
						            <td class="sfx_options_dialog_option_action" style="white-space:nowrap;">
						                <span class="sfx_square_control" title="Edit" @click="edit_tweak(tweak,$index)">&#9998;</span>
						                <span class="sfx_square_control sfx_square_delete"  title="Delete" @click="delete_tweak(tweak)">&times;</span>
						            </td>
						            <td>
						                <input id="sfx_tweak_{{$index}}" type="checkbox" @change="toggle_tweak(tweak,$index)" v-model="tweak.enabled"/><label for="sfx_tweak_{{$index}}"></label>
						            </td>
						        </tr>
						        </tbody>
						    </table>

						    <div v-if="tweak_subscriptions">
						        <div class="sfx_options_dialog_panel_header">Available Display Tweaks (Snippets)</div>
						        <div>
						            Below is a list of display tweaks maintained by the Social Fixer team which you may find useful. When you add them to your list, they will be automatically updated to continue functioning if Facebook changes its layout or code.
						        </div>
						        <table class="sfx_options_dialog_table">
						            <thead>
						            <tr>
						                <th>Title</th>
						                <th>Description</th>
						                <th>Add</th>
						            </tr>
						            </thead>
						            <tbody>
						            <tr v-for="tweak in tweak_subscriptions" v-bind:class="{'sfx_tweak_subscribed':tweak.subscribed}">
						                <td class="sfx_options_dialog_option_title">{{tweak.title}}</td>
						                <td class="sfx_options_dialog_option_description">{{tweak.description}}</td>
						                <td class="sfx_options_dialog_option_action">
						                    <span class="sfx_square_add" title="Add To My Tweaks" @click="add_tweak_subscription(tweak)">+</span>
						                </td>
						            </tr>
						            </tbody>
						        </table>
						    </div>
						    <div v-else>
						        Loading Available Tweaks...
						    </div>
						</div>

						<div v-if="editing_tweak" class="sfx_options_dialog_panel">
						    <div class="sfx_panel_title_bar">Edit Tweak</div>
						    <div class="sfx_label_value">
						        <div>Title:</div>
						        <div><input class="sfx_wide" v-model="editing_tweak.title"></div>
						    </div>
						    <div class="sfx_label_value">
						        <div>Description: </div>
						        <div><input class="sfx_wide" v-model="editing_tweak.description"></div>
						    </div>
						    <div>CSS:<br/>
						        <textarea style="width:90%;height:250px;font-size:11px;font-family:monospace;" v-model="editing_tweak.css"></textarea>
						    </div>
						</div>
					</template>
					<template v-if="section.name=='About'"><div id="sfx_options_content_about">{{{content_about}}}</div></template>
					<template v-if="section.name=='Donate'">
						<div v-if="sfx_option_show_donate" style="margin-bottom:10px;">
							<input id="sfx_option_show_donate" type="checkbox" v-model="options.sfx_option_show_donate.newValue"/><label for="sfx_option_show_donate"></label> Remind me every so often to help support Social Fixer through donations.
						</div>
						<div id="sfx_options_content_donate">{{{content_donate}}}</div>
					</template>
					<template v-if="section.name=='Support'">
						<div style="font-family:monospace;font-size:11px;border:1px solid #ccc;margin-bottom:5px;padding:7px;">Browser: {{user_agent}}<br>Social Fixer {{sfx_version}} (web_extension)
							<br><span v-if="'web_extension'=='greasemonkey'">Script running under {{userscript_agent}}</span>
						</div>
						<div id="sfx_options_content_support">{{{content_support}}}</div>
					</template>
				</template>
			</div>
		</div>
	</div>
</div>
`;
				var close_options = function () {
					X('#sfx_options_dialog').remove();
				};
				X.subscribe('options/close', function () {
					close_options();
				});

				var save_options = function () {
					var undef, opt, sectionName, key, options_to_save = {};
					// Iterate each option
					for (key in FX.options) {
						opt = FX.options[key];
						// Only save non-default settings that have changed
						if (opt.newValue != opt.value) {
							// If it's the default, erase it from options so it will be overriden by the default
							if (opt.newValue == opt['default']) {
								options_to_save[key] = undef;
							}
							else {
								options_to_save[key] = opt.newValue;
							}
						}
						// Empty out the newValue
						opt.newValue = null;
					}
					// Store the data in memory
					X.storage.data.filters = X.clone(filters);
					X.storage.data.tweaks = X.clone(tweaks);

					// persist
					X.storage.set('options', options_to_save, function () {
						X.storage.save('filters', null, function () {
							X.storage.save('tweaks', null, function () {
								close_options();
								var position = X('#sfx_badge_menu').hasClass('right') ? 'right' : 'left';
								var note = sticky_note(X('#sfx_badge')[0], position, 'Saved!', {close: false});
								setTimeout(function () {
									note.remove();
								}, 2000);
							});
						});
					});
				};

				var key;
				if (event_data && event_data.data) {
					for (key in event_data.data) {
						data[key] = event_data.data[key];
					}
				}
				var methods = {
					"save": save_options
					, "cancel": function () {
						if (this.editing_filter) {
							this.action_button = null;
							this.editing_filter = null;
						}
						else if (this.editing_tweak) {
							this.action_button = null;
							this.editing_tweak = null;
						}
						else {
							close_options();
						}
					}
					, "collapse": function () {
						X('#sfx_options_dialog_body').toggle();
					}
					, "message": function (msg) {
						if (msg) {
							var messages = msg.split(/\s*,\s*/);
							if (messages && messages.length > 0) {
								messages.forEach(function (m) {
									X.publish(m, {});
								});
							}
						}
					}
					, "select_section": function (section) {
						this.editing_filter = null;
						this.action_button = null;
						sections.forEach(function (s) {
							s.selected = false;
						});
						section.selected = true;
						X.publish("menu/options/section", section.name);
					}
					, "ago": function (when) {
						return X.ago(when);
					}
					, "version_check": function (filter) {
						return (!filter.min_version || X.semver_compare(version, filter.min_version) >= 0);
					}
					, "clear_test_regex": function (ev) {
						var input = X(ev.target);
						input.attr('data-hover', null).css('background-color', '');
					}
					, "test_regex": function (ev) {
						var input = X(ev.target);
						try {
							var r = new RegExp(input.val());
							input.css('background-color', '');
						}
						catch (e) {
							input.css('background-color', '#e00');
							input.attr('data-hover', 'tooltip');
							input.attr('data-tooltip-content', "Invalid Regular Expression syntax: " + e.message);
							input.attr('data-tooltip-delay', '1');
						}
					}
					, "populate_user_options": function () {
						this.user_options = X.clone(X.storage.data);
						this.user_options_message = null;
					}
					, "import_data": function () {
						var key, user_data, json = X('#sfx_user_data').val();
						var keys = [];
						this.user_options_message = null;
						try {
							user_data = JSON.parse(json);
							for (key in user_data) {
								var d = X.clone(user_data[key]);
								X.storage.data[key] = d;
								X.storage.save(key, null, function () {
								});
								keys.push(key);
							}
							var $note = X(`<div>Successfully imported keys: ${keys.join(", ")}.<br><br><span class="sfx_button">REFRESH THE PAGE</span> immediately to activate the changes!`);
							$note.find('.sfx_button').click(function() {
								window.location.reload();
							});
							data.show_action_buttons = false;
							X('#sfx_options_dialog_body').css("padding","50px").html('').append($note);
						} catch (e) {
							this.user_options_message = "Error importing data: " + e.toString();
						}
					}
					, "reset_data": function () {
						if (confirm('Are you sure?\n\nResetting your data will ERASE all user preferences, "read" story data, installed filters, etc.')) {
							X.storage.save('options', {});
							X.storage.save('filters', []);
							X.storage.save('tweaks', []);
							X.storage.save('hiddens', {});
							X.storage.save('postdata', {});
							X.storage.save('friends', {});
							X.storage.save('stats', {});
							alert("All data has been reset. Please refresh the page.");
						}
					}
					// FILTERS
					/*
					, "toggle_tooltips": function() {
						data.show_filtering_tooltips = !data.show_filtering_tooltips;
						X.storage.set('options','show_filtering_tooltips',data.show_filtering_tooltips);
					}
					*/
					, "edit_filter": function (filter, index) {
						this.editing_filter = X.clone(filter);
						this.editing_filter_index = index;
						this.action_button = 'done_editing_filter';
					}
					, "delete_filter": function (filter) {
						if (confirm('Are you sure you want to remove this filter?')) {
							this.filters.$remove(filter);
							mark_subscribed_filters(data.filter_subscriptions, filters);
						}
					}
					, "up": function (filter) {
						for (var i = 0; i < this.filters.length; i++) {
							if (this.filters[i] == filter && i > 0) {
								this.filters.$set(i, this.filters[i - 1]);
								this.filters.$set(i - 1, filter);
								return;
							}
						}
					}
					, "down": function (filter) {
						for (var i = 0; i < this.filters.length; i++) {
							if (this.filters[i] == filter && i < this.filters.length - 1) {
								this.filters.$set(i, this.filters[i + 1]);
								this.filters.$set(i + 1, filter);
								return;
							}
						}
					}
					, "close_filter": function () {
						this.editing_filter.updated_on = X.time();
						// If it's a subscription and actions are configurable and they have changed, flag as such
						var orig = this.filters[this.editing_filter_index];
						if (orig.id && orig.configurable_actions) {
							var original_actions = JSON.stringify(orig.actions);
							var new_actions = JSON.stringify(this.editing_filter.actions);
							if (original_actions != new_actions) {
								// Updated actions!
								this.editing_filter.custom_actions = true;
							}
						}
						this.filters[this.editing_filter_index] = X.clone(this.editing_filter);
						this.editing_filter = null;
						this.action_button = null;
						mark_subscribed_filters(data.filter_subscriptions, filters);
					}
					, "add_filter": function () {
						var new_filter = {"match": "ALL", "enabled": true, "stop_on_match": true, "rules": [{"target": "any", "operator": "contains"}], "actions": [{"action": "hide"}]};
						new_filter.added_on = X.time();
						this.filters.push(new_filter);
						this.edit_filter(this.filters[this.filters.length - 1], this.filters.length - 1);
						this.action_button = 'done_editing_filter';
					}
					, "add_subscription": function (filter) {
						var f = X.clone(filter);
						f.enabled = true;
						if (!f.actions || !f.actions.length) {
							f.actions = [{"action": ""}];
							f.configurable_actions = true;
						}
						this.filters.push(f);
						mark_subscribed_filters(data.filter_subscriptions, filters);
						//if (f.configurable_actions) {
						//	this.editing_filter = f;
						//	this.action_button = 'done_editing_filter';
						//}
					}
					, "add_condition": function () {
						this.editing_filter.rules.push({"target": "any", "operator": "contains"});
					}
					, "delete_rule": function (rule) {
						this.editing_filter.rules.$remove(rule);
					}
					, "add_action": function () {
						this.editing_filter.actions.push({});
					}
					, "delete_action": function (action) {
						this.editing_filter.actions.$remove(action);
					}
					, "regex_test": function (condition) {
						var text = condition.text;
						var modifier = condition.modifier;
						X.publish("test/regex", {"text": text, "modifier": modifier});
					}
					// TWEAKS
					, "edit_tweak": function (tweak, index) {
						this.editing_tweak = X.clone(tweak);
						this.editing_tweak_index = index;
						this.action_button = 'done_editing_tweak';
					}
					, "delete_tweak": function (tweak) {
						if (confirm('Are you sure you want to remove this tweak?')) {
							this.tweaks.$remove(tweak);
							mark_subscribed_tweaks(data.tweak_subscriptions, tweaks);
						}
					}
					, "close_tweak": function () {
						this.editing_tweak.updated_on = X.time();
						if (this.editing_tweak.enabled) {
							X.css(this.editing_tweak.css, 'sfx_tweak_style_' + this.editing_tweak_index);
						}
						this.tweaks[this.editing_tweak_index] = X.clone(this.editing_tweak);
						this.editing_tweak = null;
						this.action_button = null;
					}
					, "add_tweak": function () {
						var new_tweak = {"title": "", "description": "", "enabled": true};
						new_tweak.added_on = X.time();
						this.tweaks.push(new_tweak);
						this.edit_tweak(this.tweaks[this.tweaks.length - 1], this.tweaks.length - 1);
						this.action_button = 'done_editing_tweak';
					}
					, "add_tweak_subscription": function (tweak) {
						var o = X.clone(tweak);
						o.enabled = true;
						this.tweaks.push(o);
						mark_subscribed_tweaks(data.tweak_subscriptions, tweaks);
						X.css(o.css, 'sfx_tweak_style_' + this.tweaks.length - 1);
					}
					, "toggle_tweak": function (tweak, index) {
						var css = tweak.enabled ? tweak.css : null;
						X.css(css, 'sfx_tweak_style_' + index);
					}
				};
				template(document.body, dialog, data, methods).ready(function () {
					X.draggable('#sfx_options_dialog');

					// If a default section was passed in, publish that event
					if (event_data.section) {
						X.publish("menu/options/section", event_data.section);
					}
				});
			} catch (e) {
				alert(e);
			}
		}, true);

		X.subscribe("menu/options/section", function (msg, msgdata) {
			// If the section has dynamic data, load it
			sections.forEach(function (s) {
				if (s.name == msgdata && s.property && s.url) {
					X.ajax(s.url, function (content) {
						data[s.property] = X.sanitize(content);
					});
				}
			});
			if (msgdata == "Filters") {
				// Retrieve filters
				retrieve_filter_subscriptions(data.filters, function (subscriptions) {
					data.filter_subscriptions = subscriptions;
				});
			}
			if (msgdata == "Display Tweaks") {
				// Retrieve tweaks
				retrieve_tweak_subscriptions(data.tweaks, function (subscriptions) {
					data.tweak_subscriptions = subscriptions;
				});
			}
		});

		// If opening from an "options" url, open options immediately
		FX.on_content_loaded(function () {
			if (/sfx_options=true/.test(location.href)) {
				X.publish("menu/options");
			}
		});
	});
});
