// =============================================
// "Bubble" Notes are panels to display... notes
// =============================================
function bubble_note(content,options) {
    options = options || {};
    options.position = options.position || "top_right";
    if (typeof options.close!="boolean") { options.close=false; }
    options.id = options.id||"";
    if (typeof options.draggable!="boolean") { options.draggable=true; }
    // If ID is passed, remove old one if it exists
    if (options.id) {
        X('#'+options.id).remove();
    }

    // Bubble note content is generated entirely from within code and is untainted - safe
    var c = X(`<div id="${options.id}" style="${options.style}" class="sfx_bubble_note sfx_bubble_note_${options.position} ${options.className}"></div>`);
    if (options.close) {
        c.append(`<div class="sfx_sticky_note_close"></div>`);
    }
    if (options.title) {
        c.append(`<div class="sfx_bubble_note_title">${options.title}</div>`);
    }
    if (typeof content=="string") {
        c.append(`<div class="sfx_bubble_note_content">${content}</div>`);
    }
    else {
        c.append(content);
    }
    // Close functionality
    c.find('.sfx_sticky_note_close, .sfx_button_close').click(function() {
        if (typeof options.callback=="function") {
            options.callback(c);
        }
        c.remove();
    });

    X(document.body).append(c);
    if (options.draggable) {
        X.draggable(c[0]);
    }
    return c;
}
// Hide all bubble notes when ESC is pressed
X(window).on('keyup',function(event) {
    if (event.keyCode==27) {
        X('.sfx_bubble_note').remove();
    }
});

// A popup that remembers not to show itself next time
function context_message(key,content,options) {
    options = options || {};
    X.storage.get('messages',{},function(messages) {
        if (typeof messages[key]=="undefined") {
            // Show the message
            // Add an option to now show the message in the future
            content += `
                <div style="margin:15px 0 15px 0;"><input type="checkbox" class="sfx_dont_show" checked> Don't show this message again</div>
                <div><input type="button" class="sfx_button sfx_button_close" value="OK, Got It"></div>
            `;
            options.close = true;
            options.id = "sfx_content_message_"+key;
            options.title = `<div class="sfx_info_icon">i</div>${options.title}`;
            options.style="padding-left:35px;";
            options.callback = function($popup) {
                if ($popup.find('.sfx_dont_show').prop('checked')) {
                    X.storage.set('messages',key,X.now(),function() {});
                }
            };
            return bubble_note(content,options);
        }
    },true);
}