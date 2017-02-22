// ========================================================
// Fix Comments
// ========================================================
X.ready( 'comment_button', function() {
    var title = "Fix Enter In Comments & Replies";
    FX.add_option('comment_button', {"title": title, "description": "Use Enter to add a new line instead of submitting comments & replies.", "default": false});
    FX.add_option('comment_button_ctrl', {"title": title, "description": "Use Ctrl+Enter to submit comments & replies.", "default": false});
    FX.add_option('comment_button_hint', {"hidden":true, "default": true});

    FX.on_options_load(function() {
        var fix_comments_on = FX.option('comment_button');
        var comment_button_ctrl = FX.option('comment_button_ctrl');
        var show_hint = FX.option('comment_button_hint');

        // Provide the ability to dispatch React events
        X.inject(function () {
            return function (target_selector, type, data) {
                window.requireLazy(['ReactEventListener'], function (ReactEventListener) {
                    var target = document.querySelector(target_selector);
                    if (target) {
                        data.srcElement = target;
                        data.target = target;
                    }
                    data.currentTarget = document;
                    data.view = window;
                    ReactEventListener.dispatchEvent(type, data);
                });
            };
        }, {}, "sfx_dispatch_react_event");

        var dispatch_enter_event = function (target_selector, shiftKey) {
            X.inject(function (data) {
                sfx_dispatch_react_event(data.target_selector, data.type, data.event);
            }, {
                "target_selector": target_selector
                , "type": "topKeyDown"
                , "event": {
                    altKey: false
                    , bubbles: true
                    , cancelBubble: false
                    , cancelable: true
                    , charCode: 0
                    , clipboardData: undefined
                    , ctrlKey: false
                    , defaultPrevented: false
                    , detail: 0
                    , eventPhase: 3
                    , keyCode: 13
                    , keyIdentifier: "Enter"
                    , keyLocation: 0
                    , layerX: 0
                    , layerY: 0
                    , metaKey: false
                    , pageX: 0
                    , pageY: 0
                    , path: []
                    , repeat: false
                    , returnValue: true
                    , shiftKey: shiftKey
                    , srcElement: null
                    , target: null
                    , timeStamp: +(new Date())
                    , type: "keydown"
                    , which: 13
                }
            })
        };

        (function () {
            var dispatch_react_event = false;
            var react_target_selector = null;
            var comment_id = 0;
            var submit = function () {
                if (dispatch_react_event) {
                    dispatch_enter_event(react_target_selector, false);
                }
            };
            X.capture(window, 'keydown', function (e) {
                var $t = X.target(e, true);
                var t = $t[0];
                if (($t.closest(".UFIAddCommentInput").length > 0 && $t.closest('#birthday_reminders_dialog').length == 0)) {
                    var editable = ("true" == t.getAttribute('contenteditable') || t.getAttribute('data-reactid'));
                    if (editable) {
                        dispatch_react_event = true;
                        if (!t.getAttribute("sfx_comment_id")) {
                            t.setAttribute("sfx_comment_id", comment_id++);
                        }
                        react_target_selector = t.tagName + '[sfx_comment_id="' + t.getAttribute('sfx_comment_id') + '"]';
                        t.tabIndex = 9998;
                    }
                    var $button = null;
                    var $container = $t.closest('.textBoxContainer,.UFICommentContainer');
                    if ($container.length) {
                        var $note_container = $container.parent();
                        $button = $note_container.find('.sfx_comment_button');
                        if (fix_comments_on && !$button.length) {
                            $button = $('<input class="sfx_comment_button" type="button" value="Submit Comment" style="cursor:pointer;" tabIndex="9999">');
                            $button.click(function () {
                                submit();
                                if (t.focus) {
                                    t.focus();
                                }
                            });
                            $note_container.append($button);
                            if (comment_button_ctrl) {
                                $button.after('<span class="sfx_comment_button_msg">(Ctrl+Enter also submits)</span>');
                            }
                        }
                        else if (!fix_comments_on && show_hint && $note_container.find('.sfx_comment_button_msg').length==0) {
                            var $note = X('<span class="sfx_comment_button_msg">Social Fixer can prevent Enter from submitting comments & replies! <a class="sfx_link sfx_link_options" style="color:inherit;">Options</a> <a class="sfx_link sfx_link_hide" style="color:inherit;">Hide</a></a></span>');
                            $note.find('.sfx_link_options').click(function() {
                                X.publish("menu/options",{"highlight_title":title});
                            });
                            $note.find('.sfx_link_hide').click(function() {
                                X.storage.set('options','comment_button_hint',false,function() {
                                    show_hint = false;
                                    $note.remove();
                                });
                            });
                            $note_container.append($note);
                        }
                    }
                    if ($button && editable && fix_comments_on) {
                        if (e.keyCode == 13) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (comment_button_ctrl && e.ctrlKey) {
                                submit();
                                if (t.focus) {
                                    t.focus();
                                }
                            }
                            else if (dispatch_react_event) {
                                dispatch_enter_event(react_target_selector, true);
                            }
                        }
                    }
                }
            });
        })();

    });

});
