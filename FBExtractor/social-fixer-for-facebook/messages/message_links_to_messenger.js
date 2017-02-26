// =========================================================
// For Message links to open Messenger instead of a chat box
// =========================================================
X.ready( 'message_links_to_messenger', function() {
	FX.add_option('messages_open_in_full_window', {"title": 'Open Messages In full Window', "description": "When clicking a chat message in the blue bar dropdown, open the message in a full window instead of a chat box.", "default": false});
	FX.on_options_load(function () {
		if (FX.option('messages_open_in_full_window')) {
			X.bind(document.documentElement, 'click', function (e) {
				var $t = X.target(e, true);
				var href = $t.closest('a.messagesContent[href*="facebook.com/messages"]').attr('href');
				if (href) {
					window.open(href);
					e.stopPropagation();
					e.preventDefault();
				}
			}, true);
		}
	});
});
