X.ready('trending_bars', function() {
    FX.add_option('trending_bars', {
        "section": "User Interface"
        , "title": "Trending Bars"
        , "description": "In the Trending Stories box, add bars to show the relative popularity of each story"
        , "default": true
    });
    FX.on_option('trending_bars', function() {
        FX.on_selector("li[data-topicid]", function ($item) {
            if ($item.closest('#pagelet_trending_tags_and_topics').length > 0) {
                $item.find('a div div').each(function() {
                    var $d = X(this);
                    var html = $d.html();
                    X.match(html, /([\d\.]+[MK])/i, function (n) {
                        var num = parseFloat(n, 10);
                        if (typeof num == "number") {
                            if (/K$/i.test(n)) {
                                num *= 1000;
                            }
                            else if (/M$/i.test(n)) {
                                num *= 1000000;
                            }
                        }
                        var pct = num / 10000;
                        $d.css("background", `linear-gradient(to right, rgba(124,157,189,.3) ${pct}%, transparent ${pct}%)`);
                    });
                });
            }
        });
    });
});
