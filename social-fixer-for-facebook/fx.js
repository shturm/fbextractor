/*
 * This is a small library specific to Facebook functionality / extensions
 */
var FX = (function() {
    var css_queue = [];
    var on_page_load_queue = [];
    var on_page_unload_queue = [];
    var on_content_loaded_queue = [];
    var on_options_load_queue = [];
    var html_class_names = [];

    var fire_queue = function (arr, reset, arg) {
        if (!arr || !arr.length) {
            return;
        }
        arr.forEach(function (func) {
            try {
                func(arg);
            } catch(e) {
                console.log(e.toString());
            }
        });
        if (reset) {
            arr.length = 0;
        }
    };

    // Monitor for hash change to detect when navigation has happened
    // TODO: Even for popups like photo viewer?!
    var page_transitioning = false;
    var page_transition = function() {
        if (page_transitioning) { return; } // Already initiated
        page_transitioning = true;
        // Fire the unload queue
        fire_queue(on_page_unload_queue);
        page_transitioning = false;
        fire_queue(on_page_load_queue);
    };
    // Monkey patch the pushState/replaceState calls in the main window to capture the event.
    // This will tell us if navigation happened that wasn't a full page reload
    // Detect changes through window.addEventListener(pushState|replaceState)
    var watch_history = function() {
        var _wr = function (type) {
            var orig = history[type];
            return function (state,title,url) {
                var url_change = (url && url!=location.href && !/theater/.test(url));
                var rv = orig.apply(this, arguments);
                if (url_change) {
                    var e = new Event(type);
                    e.arguments = arguments;
                    window.dispatchEvent(e);
                }
                return rv;
            };
        };
        window.history.pushState = _wr('pushState');
        window.history.replaceState = _wr('replaceState');
    };
    X.inject(watch_history);
    // Now listen for the state change events
    window.addEventListener("pushState",page_transition,false);
    window.addEventListener("replaceState",page_transition,false);

    // Facebook uses the HTML5 window.history.pushState() method to change url's in newer browsers.
    // Older browsers will use the hashchange approach
    window.addEventListener('hashchange',page_transition,false);
    window.addEventListener('DOMContentLoaded',function() {
    });

    // Public API
    var fx = {};
    fx.css = function(css_text) {
        css_queue.push(css_text);
    };
    fx.css_dump = function() {
        if (css_queue.length==0) { return; }
        var css = css_queue.join('');
        X.css(css,'sfx_css');
    };

    // OPTIONS
    // -------
    // options : A hash of ALL available options, as defined by modules, along with default values
    fx.options = {};
    // is_options_loaded : Once options is loaded, this flag flips
    fx.is_options_loaded = false;
    fx.add_option = function(key,o) {
        o = o || {};
        o.key = key;
        o.type = o.type || 'checkbox';
        if (typeof o['default']=="undefined" && o.type=="checkbox") {
            o['default'] = false;
        }
        this.options[key] = o;
    };
    fx.option =function(key,value,save,callback) {
        // The defined option
        var o = fx.options[key];
        if (typeof value!="undefined") {
            // SET the value
            X.storage.set('options',key,value,(callback || function(){}),save);
            return value;
        }
        // GET the value
        // If it's defined in the storage layer, get that
        if (typeof X.storage.data.options!="undefined" && typeof X.storage.data.options[key]!="undefined") {
            return X.storage.data.options[key];
        }
        // Else if it's defined as an option, return the default value
        if (typeof o!="undefined" && typeof o['default']!="undefined") {
            return o['default'];
        }
        // Default return null
        return null;
    };
    fx.save_options = function(callback) {
        X.storage.save('options',null,callback);
    };
    fx.options_loaded = function(options) {
        fire_queue(on_options_load_queue,false,options);
        FX.css_dump();
        FX.html_class_dump();
        fx.is_options_loaded=true;
    };
    fx.on_options_load = function(func) {
        // If options are already loaded, just fire the func
        if (fx.is_options_loaded) {
            func();
        }
        else {
            on_options_load_queue.push(func);
        }
    };
    fx.on_option = function(option_name, value, func) {
        if (typeof value=="function") {
            func = value;
            value = true;
        }
        fx.on_options_load(function() {
            if (fx.option(option_name)==value) {
                func(fx.option(option_name));
            }
        })
    };
    // Pass-through to non-option storage
    fx.storage = function(key) {
        return X.storage.data[key];
    };

    fx.add_html_class = function(name) {
        html_class_names.push(name);
        if (X.is_document_ready()) {
            FX.html_class_dump();
        }
    };
    fx.html_class_dump = function() {
        // Add HTML classes to the HTML tag
        if (html_class_names.length>0) {
            var h=document.getElementsByTagName('HTML')[0];
            h.className = (h.className?h.className:'') + ' ' + html_class_names.join(' ');
            html_class_names.length = 0;
        }
    };
    fx.on_page_load = function(func) {
        on_page_load_queue.push(func);
    };
    fx.on_page_unload = function(func) {
        on_page_unload_queue.push(func);
    };
    fx.on_content_loaded = function(func) {
        on_content_loaded_queue.push(func);
    };
	fx.dom_content_loaded = false;
    fx.fire_content_loaded = function() {
        // Queue or Fire the DOMContentLoaded functions
        var content_loaded = function() {
			FX.html_class_dump();
            fire_queue(on_content_loaded_queue,true);
            fire_queue(on_page_load_queue);
            FX.html_class_dump();
        };
        if (X.is_document_ready()) {
            content_loaded();
        }
        else {
            window.addEventListener('DOMContentLoaded',function() {
				content_loaded();
			},false);
        }
    };

    // Dynamic content insertion
    fx.domNodeInsertedHandlers = [];
    fx.on_content_inserted = function(func) {
        fx.domNodeInsertedHandlers.push(func);
    };
    fx.on_content = function(func) {
        // Inserted content
        fx.on_content_inserted(func);
        // Static content on page load
        fx.on_content_loaded(function() {
            func(X(document.body));
        });
    };
    fx.on_selector = function(selector,func) {
        var f = function($o) {
            var $items = $o.find(selector);
            if ($o.is(selector)) {
                $items = $items.add($o);
            }
            $items.forEach(function(item) {
                func(X(item));
            });
        };
        fx.on_content(f);
    };

    // Navigation Context
    fx.context = {"type":null, "id":null};
    fx.on_page_load(function() {
        var url = window.location.href;
        url = url.replace(/^.*?facebook.com/,"");
        url = url.replace(/\?.*$/,"");

        if (url=="/") {
            fx.context.type="newsfeed";
            fx.context.id=null;
        }
        else {
            fx.context.type=null;
            fx.context.id=null;
            var context = url.match(/\/([^\/]+)\/([^\/]+)/);
            if (context) {
                fx.context.type=context[1];
                fx.context.id=context[2];
            }
            else {
                fx.context.type="profile";
                fx.context.id = (url.match(/^\/([^\/]+)/))[1];
            }
        }
        fx.context.permalink = false;
        if (/permalink/.test(url) || /\/posts\/\d+/.test(url)) {
            fx.context.permalink = true;
        }
        var $html = X('html');
        $html.attr('sfx_url',url);
        $html.attr('sfx_context_type',fx.context.type);
        $html.attr('sfx_context_id',fx.context.id);
        $html.attr('sfx_context_permalink',fx.context.permalink);

        // DEBUG
        //bubble_note(url+"<br>"+fx.context.type+"<br>"+fx.context.id, {id:"sfxcontext",draggable:false});
    });

    // "Reflow" a news feed page when posts have been hidden/shown, so Facebook's code kicks in and resizes containers
    fx.reflow = function(scroll_to_top) {
        if (typeof scroll_to_top!="boolean") { scroll_to_top=false; }
        // Show all substreams by force
        try { X('div[id^="substream_"]').css('height', 'auto').find('.hidden_elem').removeClass('hidden_elem'); } catch(e) {}
        // Trigger Facebook's code to re-flow
        setTimeout(function() {
//        window.dispatchEvent(new Event('resize'));
            if (scroll_to_top) {
                window.scrollTo(0, 3);
            }
        },50);
    };

    fx.mutations_disabled = false;
	fx.disable_mutations = function() { fx.mutations_disabled=true; }
	fx.enable_mutations = function() { fx.mutations_disabled=false; }
    var ignoreDomInsertedRegex = /(sfx|DOMControl_shadow|highlighterContent|uiContextualLayerPositioner|uiContextualDialogPositioner|UFIList|timestampContent|tooltipText)/i;
    var ignoreDomInsertedParentRegex = /(highlighter|fbChatOrderedList)/;
    var ignoreTagNamesRegex = /^SCRIPT|LINK|INPUT|BR|STYLE|META|IFRAME|AUDIO|EMBED$/i;
    var ignoreMutation = function(o) {
        if (o.nodeType!=1) { return true; }
        if (ignoreTagNamesRegex.test(o.tagName)) { return true; }
        if (ignoreDomInsertedRegex.test(o.className) || /sfx/.test(o.id)) { return true; }
        if (o.parentNode && o.parentNode.className && ignoreDomInsertedParentRegex.test(o.parentNode.className)) {
            return true;
        }
		return fx.mutations_disabled;
    };
    var domnodeinserted = function (o) {
        if (ignoreMutation(o)) { return; }
        var $o = X(o);
        for (var i=0; i<fx.domNodeInsertedHandlers.length; i++) {
            // If a handler returns true, it has handled it, no need to continue to other handlers
            if (fx.domNodeInsertedHandlers[i]($o)) {
                return;
            }
        }
    };
    if (typeof MutationObserver!="undefined" || global_options.use_mutation_observers) {
        var _observer = function(records) {
            for (var i=0; i<records.length; i++) {
                var r = records[i];
                if (r.type!="childList" || !r.addedNodes || !r.addedNodes.length) { continue; }
                var added = r.addedNodes;
                for (var j=0; j<added.length; j++) {
                    domnodeinserted(added[j]);
                }
            }
        };
        X(function() {
            new MutationObserver(_observer).observe(document.body, { childList: true, subtree: true });
        });
    } else {
        X(document).on('DOMNodeInserted',function(e) {
            domnodeinserted(e.target);
        });
    }

    // Return the API
    // ==============
    return fx;
})();
