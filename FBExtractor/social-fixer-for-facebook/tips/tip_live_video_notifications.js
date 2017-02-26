X.ready('tip_live_video_notifications', function() {
    FX.add_option('tip_live_video_notifications',
        {
            "section": "Tips",
            "title": 'Disable Live Video Notifications',
            "description": 'Disable the notifications that Facebook sends when friends or pages "go live" with video.',
            "type": "link",
            "url": "/settings?tab=notifications&section=on_facebook&view&highlight_live_video=true"
        }
    );
    FX.on_content_loaded(function () {
        if (/highlight_live_video=true/.test(location.href)) {
            X('form[ajaxify*="live_video"]').closest('li').css('outline', '4px solid yellow');
        }
    });
});
