// =========================================================
// Popup Notifications in a new window
// =========================================================
X.ready( 'notification_popup', function() {
    FX.add_option('notification_popup', {"section": "Experiments", "title": 'Notification Popup', "description": "Add a link in the Notifications dropdown header to pop up Notifications in a new window.", "default": true});
    FX.add_option('notification_popup_auto_refresh', {"section": "Experiments", "title": 'Notification Popup', "description": "Automatically refresh the notification popup window when new notifications arrive.", "default": true});
    FX.add_option('notification_popup_new_tab', {"hidden": true, "title": 'Notification Popup', "description": "Open notifications in a new tab instead of the opener", "default": false});
    FX.add_option('notification_popup_group', {"hidden": true, "title": 'Notification Popup', "description": "Group Notifications on the same post together", "default": true});

    FX.on_options_load(function () {
        if (!FX.option('notification_popup')) {
            return;
        }

        var notif_window = null;
        X.when('#fbNotificationsFlyout .uiHeaderActions', function ($actions) {
            var $link = X(`<a style="margin-right:10px;" data-hover="tooltip" data-tooltip-content="Open a Notifications Dashboard in a new window. (Social Fixer)")>Open In Popup</a>`);
            $link.click(function (e) {
                try {
                    notif_window.focus();
                }
                catch (e) {
                    var h = 500;
                    try {
                        h = window.outerHeight;
                    } catch (e) {
                    }
                    notif_window = window.open('/notifications?sfx_notification_popup=true', 'SFX_NOTIFICATIONS', `width=480,height=${h},top=0,left=0`);
                }
                return false;
            });
            $actions.prepend($link);
        });

        // Capture clicks in the notification popup window
        if (/sfx_notification_popup=true/.test(location.href)) {
            FX.add_html_class('sfx_notification_popup');
            var notif_context = {};
            if (FX.option('notification_popup_group')) {
                FX.on_content(function ($c) {
                    var selector = 'li[data-gt]:not(.sfx_notification)';
                    var $li = ($c.is(selector)) ? $c : $c.find(selector);
                    $li.forEach(function (li) {
                        try {
                            var $li = X(li);
                            var id = JSON.parse($li.attr('data-gt')).content_id;
                            if (!id) {
                                return;
                            }
                            if (typeof notif_context[id] == "undefined") {
                                // This is the first notif for this context, leave it
                                notif_context[id] = $li;
                                $li.addClass("sfx_notification");
                            }
                            else {
                                // Move this li up to be under the first one
                                notif_context[id].after(li);
                                $li.addClass("sfx_sub_notification");
                                $li.addClass("sfx_notification");
                            }
                        } catch (e) {
                        }
                    })
                });
            }
            FX.on_content_loaded(function () {
                X.bind('#content', 'click', function (e) {
                    var $a = X.target(e, true).closest('a');
                    if ($a.attr('role') == "button") {
                        return;
                    }
                    var href = $a.attr('href');
                    var target = null;
                    if (href && href != "" && href != "#") {
                        e.stopPropagation();
                        e.preventDefault();
                        try {
                            if (!target) {
                                target = window.opener;
                            }
                            if (FX.option('notification_popup_new_tab')) {
                                target.open(href);
                            }
                            else {
                                target.location.href = href;
                            }
                            target.focus();
                        }
                        catch (e) {
                            target = window.open(href);
                        }
                        X('.sfx_notification_selected').removeClass('sfx_notification_selected');
                        $a.closest('li').addClass('sfx_notification_selected');
                    }
                    return true;
                }, true);
                // Add a place for SFX controls
                var data = {
                    "count": null,
                    "new_tab": FX.option('notification_popup_new_tab'),
                    "group": FX.option('notification_popup_group')
                };
                var actions = {
                    "refresh": function () {
                        window.location.reload();
                    }
                    , "mark_all_read": function () {
                        var $a = X('#fbNotificationsJewelHeader ~ * > a[role="button"]');
                        X.ui.click($a, false);
                    }
                    , "toggle_new_tab": function () {
                        FX.option('notification_popup_new_tab', !FX.option('notification_popup_new_tab'), true);
                    }
                    , "toggle_group": function () {
                        FX.option('notification_popup_group', !FX.option('notification_popup_group'), true, this.refresh);
                    }
                };

                var html = `
                    <div id="sfx_notification_popup_header">
                        <div id="sfx_notification_popup_header_actions">
                            <span class="sfx_link" @click.capture.prevent.stop="mark_all_read">Mark All Read</span>
                            <span>
                                <input type="checkbox" v-model="new_tab" @click="toggle_new_tab"> Open links in new tab/window
                            </span>
                            <span>
                                <input type="checkbox" v-model="group" @click="toggle_group"> Group Notifications
                            </span>
                        </div> 
                        <div v-if="count>0">{{count}} new notification{{count>1?"s":""}}. <a href="#" @click.prevent="refresh">Refresh</a>.</div>
                    </div>
                `;
                var $t = template(null, html, data, actions);
                X('#globalContainer').before($t.fragment);
                // Check for new notifications and alert
                setInterval(function () {
                    var count = X('#notificationsCountValue').text();
                    if (count && data.count == null) {
                        data.count = count;
                    }
                    else if (count && +count > 0 && +count > data.count) {
                        if (FX.option('notification_popup_auto_refresh')) {
                            window.location.reload();
                        }
                        data.count = +count;
                    }
                }, 2000);
            })
        }
    });
});
