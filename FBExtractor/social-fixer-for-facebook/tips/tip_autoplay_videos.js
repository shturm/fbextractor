X.ready('tip_autoplay_videos', function() {
    FX.add_option('tip_autoplay_videos',
        {
            "section": "Tips",
            "title": 'Disable Auto-Play Videos',
            "description": 'You can prevent videos from automatically playing in your news feed as you scroll past them by disabling the auto-play option in your settings.',
            "type": "link",
            "url": "/settings?tab=videos&sfx_highlight_autoplay=true"
        }
    );
    FX.on_content_loaded(function () {
        if (/tab=videos\&sfx_highlight_autoplay=true/.test(location.href)) {
            X('form[action*="autoplay"]').closest('li').css('outline', '4px solid yellow');
        }
    });
});
