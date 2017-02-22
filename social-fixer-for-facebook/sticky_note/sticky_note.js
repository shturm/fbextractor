// ===================================================
// STICKY NOTES
// ===================================================
// o = Object to point to
// position = left | right
// content = stuff in the note
// pref = ?
// closefunc = ?
// opts = ?
function sticky_note(o,position,content,data) {
	data = data || {};
	var c = X(`
		<div class="sfx_sticky_note sfx_sticky_note_${position}">
			<div class="sfx_sticky_note_close"></div>
			<div>${content}</div>
			<div class="sfx_sticky_note_arrow_border"></div>
			<div class="sfx_sticky_note_arrow"></div>
		</div>
	`);
	var $o = X(o);
	o = $o[0];
	var ps = $o.css('position');
	if (ps!="relative" && ps!="absolute" && ps!="fixed") {
		o.style.position="relative";
	}
	try {
		c.css('visibility', 'hidden').appendTo(o);
	} catch(e) { alert(e); }
	var height = c[0].offsetHeight;
	c[0].style.marginTop = -(height/2) + "px";
	c[0].style.visibility="visible";
	// Close functionality
	var close = c.find('.sfx_sticky_note_close');
	if (false!==data.close) {
		close.click(function() {
			c.remove();
		})
		if (typeof data.closefunc=="function") {
			data.closefunc();
		}
	}
	else {
		close.remove();
	}
	return c;
}
