X.ready('tip_hide_birthday', function() {
    FX.add_option('tip_hide_birthday',
        {
            "section": "Tips",
            "title": 'Hide Your Birthday',
            "description": 'If you aren\'t the kind of person who wants all your acquaintances writing on your wall on your birthday, you can hide your birthday so none of your friends get alerted that it\'s your birthday.',
            "type": "link",
            "url": "/me/about?section=contact-info&pnref=about&sfx_hide_birthday=true"
        }
    );
    FX.on_content_loaded(function () {
        if (/sfx_hide_birthday=true/.test(location.href)) {
            var selector = 'a[ajaxify^="/profile/edit/infotab/forms/?field_type=birthday"]';
            X.when(selector, function (item) {
                item = item.first();
                item.css('outline', '3px solid yellow');
                item[0].scrollIntoView();
                setTimeout(function () {
                    X.ui.click(item);
                    X.when('form[ajaxify="/profile/edit/infotab/save/birthday/"] a.uiSelectorButton', function (edit) {
                        edit = edit.first();
                        edit.css('outline', '3px solid yellow');
                        setTimeout(function () {
                            X.ui.click(edit);
                        }, 1000);
                    });
                }, 1000);
            });
        }
    });
});
