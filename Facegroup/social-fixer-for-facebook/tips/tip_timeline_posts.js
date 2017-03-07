X.ready('tip_timeline_posts', function() {
    FX.add_option('tip_timeline_posts',
        {
            "section": "Tips",
            "title": 'Restrict Posts To Your Timeline',
            "description": `If you want to prevent friends and others from writing on your timeline (which may show up in other friends' news feed), you can restrict permissions to Only Me so no one can write on your wall.`,
            "type": "link",
            "url": "https://www.facebook.com/settings?tab=timeline&sfx_write_timeline=true"
        }
    );
    FX.on_content_loaded(function () {
        if (/sfx_write_timeline=true/.test(location.href)) {
            var selector = 'a[href="/settings?tab=timeline&section=posting"]';
            X.when(selector, function (item) {
                item = item.parent();
                item.css('outline', '3px solid yellow');
            });
        }
    });
});
