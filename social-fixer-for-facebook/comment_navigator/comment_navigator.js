// Insert a control to expand and highlight comments
X.ready( 'comment_navigator', function() {
    FX.add_option('navigator_always', {"title": 'Comment Navigator', "description": "Add the Comment Navigator to each post", "default": false});
    FX.add_option('navigator_watch', {"title": 'Comment Navigator', "description": "Watch Comment Navigator while expanding", "default": false});
    X.publish('post/action/add', {"section": "wrench", "label": "Add Comment Navigator", "message": "post/action/commentnavigator/add"});
    X.subscribe(['post/action/commentnavigator/add', 'post/action/commentnavigator/add/always'], function (msg, data) {
        var dom_id = data.id;
        var sfx_id = data.sfx_id;
        var $post = X(document.getElementById(dom_id));

        var expander_selector =
            ':not(.UFIAddCommentLink) > .UFICommentLink,' +     /* Xyz replied . N Replies */
            '.UFIPagerLink,' +                                     /* View N more comments */
            'a._ipm[href*="comment"]:not([sfx_clicked]),' +  /* N Comments: search results */
            'a._5v47.fss[role="button"],' +      /* "See More" on individual comment/reply */
            'a.see_more_link:not([sfx_clicked])';                  /* "See More" on a post */
        var post_time = ($post.find('abbr[data-utime]').first().attr('data-utime') || 0) * X.seconds;
        var now = X.now();
        // Operational parameters
        var expand_limit = 25;
        var link_highlight_ms = 1.0 * X.seconds;
        var click_interval_ms = 0.4 * X.seconds;
        var refractory_interval_ms = 1.3 * X.seconds;

        var data = {
            "post_time": post_time
            , "now": now
            , "max": (now - post_time)
            , "range": 0
            , "show_expand_all": true
            , "limit": expand_limit
            , "active": false
        };
        var scroll_to_expander = function () {
            var offs = $post.find('div.sfx_expander').offset();
            var top_tgt = offs.top - (window.innerHeight / 2);
            window.scrollTo(0, top_tgt < 0 ? 0 : top_tgt);
        }
        var expanders = function () {
            return $post.find(expander_selector).filter(function () {
                var $e = X(this);
                return (!$.find('*[aria-busy]').length && !$e.find('.UFICollapseIcon').length);
            });
        };
        var methods = {
            "expand": function () {
                var self = this;
                var limit = data.limit;
                var expand_all = function () {
                    var expand_progress_bar = function() {
                        var pct = 100 * limit / expand_limit;
                        $post.find('div.sfx_expander_bar')
                             .css("background", 'linear-gradient(to right, rgba(124,157,189,.3) ' + pct + '%, transparent ' + pct + '%)');
                    }
                    self.show_expand_all = expanders().length;
                    var clicked = false;
                    expanders().each(function (i, o) {
                        try {
                            data.active = true;
                            expand_progress_bar();
                            var $o = X(o);
                            var was_clicked_ms = $o.attr('sfx_clicked');
                            if (was_clicked_ms && X.now() - was_clicked_ms < refractory_interval_ms) {
                                console.log("skipped due to recent click time");
                            }
                            else {
                                $o.css('background-color', 'yellow');
                                setTimeout(function () {
                                    $o.css('background-color', '');
                                }, link_highlight_ms);
                                if (FX.option('navigator_watch')) {
                                    var offs = $o.offset();
                                    var top_tgt = offs.top - (window.innerHeight / 2);
                                    window.scrollTo(0, top_tgt < 0 ? 0 : top_tgt);
                                }
                                // Avoid following dangerous onclick or href
                                var curr_href = $o.attr('href');
                                var saved_onclick = undefined;
                                var saved_href = undefined;
                                if (curr_href) {
                                    if (curr_href == '#' && !/text_expose|reflow/.test(o.onclick)) {
                                        console.log("Defusing onclick '" + o.onclick + "' of: " + $o.html());
                                        saved_onclick = o.onclick;
                                        o.onclick = X.return_false;
                                    }
                                    if (/^https*:|^\//.test(curr_href)) {
                                        console.log("Defusing href '" + curr_href + "'of: " + $o.html());
                                        saved_href = curr_href;
                                        $o.removeAttr('href');
                                    }
                                }
                                $o.attr('sfx_clicked', X.now());
                                X.ui.click($o);
                                if (saved_onclick) {
                                    console.log("Repairing onclick");
                                    o.onclick = saved_onclick;
                                }
                                if (saved_href) {
                                    console.log("Repairing href");
                                    $o.attr('href', saved_href);
                                }
                                clicked = true;
                                limit--;
                                data.limit = limit;
                            }
                            if (limit > 0) {
                                console.log("calling again, " + limit + " / " + self.show_expand_all + " to go");
                                setTimeout(function () {
                                    expand_all();
                                }, click_interval_ms);
                            }
                            else {
                                expand_progress_bar();
                                limit = expand_limit;
                                data.limit = limit;
                                data.active = false;
                            }
                            return false; // Only click the first one
                        } catch (e) {
                            alert(e);
                        }
                    });
                    self.show_expand_all = expanders().length;
                    if (self.show_expand_all == 0) {
                        data.active = false;
                    }
                    expand_progress_bar();
                    if (FX.option('navigator_watch') && !data.active) {
                        setTimeout(function () {
                            self.show_expand_all = expanders().length;
                            scroll_to_expander();
                        }, 0.8 * X.seconds);
                    }
                };
                expand_all();
            }
            , "mouseover": function () {

            }
            , "change": function () {
                var now = this.now;
                var range = this.range;
                $post.find('form abbr[data-utime]').each(function (i, o) {
                    var $o = X(o);
                    var ut = (+$o.attr('data-utime') || 0) * 1000;
                    if (!ut) {
                        return;
                    }
                    if (ut > now - range) {
                        $o.css('background-color', 'yellow');
                    }
                    else {
                        $o.css('background-color', '');
                        //                    $o.closest('.UFIComment').css('outline','');
                    }
                })

            }
            , "ago": function () {
                return X.ago(now - this.range, now, true, true);
            }
        };
        var html = `<div class="sfx_expander" style="border:1px solid #E1E2E3;padding:10px;">
<div v-if="show_expand_all" class="sfx_link sfx_expander_bar" style="float:right;" @click="expand"><span v-if="(active)">Expanding</span><span v-else>Click to expand</span> <span v-if=(show_expand_all==1)>the</span><span v-else><span v-if="(show_expand_all>limit)">{{limit}} of </span><span v-else>all </span>{{show_expand_all}}</span> hidden item<span v-if="(show_expand_all>1)">s</span></div>
                <div>Highlight comments newer than: <b>{{ago()}}</b></div>
                <div><input v-model="range" type="range" min="0" max="{{max}}" style="width:95%;" @v-bind:mouseover="mouseover" @change="change"></div>
            </div>`;
        $post.find('div.sfx_expander').remove();
        data.show_expand_all = expanders().length;
        var $vue = template(null, html, data, methods);
        $post.find('form .UFIContainer').before($vue.fragment);
        if (! /always/.test(msg)) {
            scroll_to_expander();
        }
    });
    if (FX.option('navigator_always')) {
        X.subscribe(["post/add", "post/update"], function (msg, data) {
            if (data.sfx_id) {
                X.publish('post/action/commentnavigator/add/always', data);
            }
        }, false);
    }
});
