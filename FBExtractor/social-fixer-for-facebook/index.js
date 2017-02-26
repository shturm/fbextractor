/*
 Social Fixer
 (c) 2009-2016 Matt Kruse
 http://SocialFixer.com/
 */
// Extension API
var Extension = (function () {
    return {
        "storage": {
            "get": function (keys, def, callback) {
                var defaults = {};
                var single = true;
                if (typeof keys == "string") {
                    defaults[keys] = def;
                }
                else {
                    single = false;
                    for (var i = 0; i < keys.length; i++) {
                        defaults[keys[i]] = def[i];
                    }
                }
                chrome.storage.local.get(defaults, function (ret) {
                    if (chrome && chrome.extension && chrome.extension.lastError) {
                        console.log("Chrome error: " + chrome.extension.lastError.message);
                        callback(null, chrome.extension.lastError.message);
                    }
                    else {
                        if (single) {
                            callback(ret[keys]);
                        } else {
                            callback(ret);
                        }
                    }
                });
            }
            ,
            "set": function (key, val, callback) {
                var values = {};
                values[key] = val;
                chrome.storage.local.set(values, function () {
                    if (chrome && chrome.extension && chrome.extension.lastError) {
                        console.log("Chrome error: " + chrome.extension.lastError.message)
                    } else if (typeof callback == "function") {
                        callback(key, val);
                    }
                });
            }
        }
        ,
        "ajax":function(urlOrObject,callback) {
            var details;
            var internalCallback = function (response) {
                var headers = {};
                response.responseHeaders.split(/\r?\n/).forEach(function (header) {
                    var val = header.split(/\s*:\s*/, 2);
                    headers[val[0].toLowerCase()] = val[1];
                });
                callback(response.responseText, response.status, headers);
            };

            if (typeof urlOrObject == "string") {
                details = {"method": "GET", "url": urlOrObject, "onload": internalCallback};
            }
            else if (urlOrObject.url) {
                details = urlOrObject;
                details.onload = internalCallback;
            }
            else {
                alert("Invalid parameter passed to Extension.ajax");
                callback(null);
            }
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    var response = {
                        "responseText":xhr.responseText,
                        "responseHeaders":xhr.getAllResponseHeaders(),
                        "status":xhr.status
                    };
                    internalCallback(response);
                }
            };
            xhr.open(details.method, details.url, true);
            xhr.send();
        }
    };
})();
try {
var version = "17.1.0";
var sfx_buildtype = "web_extension";
var sfx_buildstr = version + "-" + sfx_buildtype;
var global_options = {
	"use_mutation_observers":true
};
var global = {};

// Stop running under certain conditions
// =====================================
var prevent_running = false;
if (window.top != window.self) { prevent_running=true; } // no frames
else if (/\/l.php\?u|\/ai.php|\/plugins\/|morestories\.php/.test(location.href)) { prevent_running=true; }
var runat = X.is_document_ready()?"document-end":"document-start";

// Find out who we are
// ===================
userid = X.cookie.get('c_user') || "anonymous";
// Prefix stored pref keys with userid so multiple FB users in the same browser can have separate prefs
X.storage.prefix = userid;

// This actually executes module code by firing X.ready()
var run_modules = function() {
	// This tells each module to run itself
	X.ready();
	// First add any CSS that has been built up
	FX.css_dump();
	// Queue or Fire the DOMContentLoaded functions
	FX.fire_content_loaded();
};

// Should we even run at all?
if (!prevent_running) {
	// Allow modules to delay early execution of modules (until prefs are loaded) by returning false from beforeReady()
	if (X.beforeReady()!==false) {
		run_modules();
	}
	// Load Options (async)
	X.storage.get(['options', 'filters', 'tweaks', 'hiddens', 'postdata', 'friends', 'stats', 'tasks', 'messages'], [{}, [], [], {}, {}, {}, {}, {}, {}], function (options) {
		if (X.beforeReady(options)!==false) {
			run_modules();
			FX.options_loaded(options);
		}
	});
}

} catch(e) {
    console.log(e);
}
