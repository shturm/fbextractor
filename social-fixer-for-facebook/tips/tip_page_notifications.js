X.ready('tip_page_notifications', function() {
    FX.add_option('tip_page_notifications',
        {
            "section": "Tips",
            "title": 'Get Notified When Pages Post',
            "description": 'Facebook has a built-in feature that sends you a Notification whenever a Page that you choose makes a post, so you never miss anything important. Click the button to be shown how to subscribe to Social Fixer Page notifications.',
            "type": "link",
            "url": "/socialfixer?sfx_notifications=true"
        }
    );
    FX.on_content_loaded(function () {
        if (/socialfixer\?sfx_notifications=true/.test(location.href)) {
            X.when(".likedButton", function () {
                var like = X(".likedButton").first();
                like.parent().css('outline', '3px solid yellow');
                setTimeout(function () {
                    X.ui.click(like);
                    setTimeout(function () {
                        var notif = X('a[ajaxify^="/pages/get_notification/?tab=notif"]').closest('li').next();
                        notif.css('outline', '3px solid yellow');
                    }, 500);
                }, 1000);
            });
        }
    });
});
