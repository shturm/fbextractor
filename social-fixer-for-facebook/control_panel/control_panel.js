// =====================================
// Post Filter: Move/Copy To Tab
// =====================================
X.ready( 'control_panel', function() {
    FX.add_option('control_panel_x', {"hidden": true, "default": 0});
    FX.add_option('control_panel_y', {"hidden": true, "default": 50});
    FX.add_option('control_panel_right', {"hidden": true, "default": false});
    FX.add_option('control_panel_bottom', {"hidden": true, "default": false});
    FX.add_option('reset_control_panel_position', {"title": 'Reset Control Panel Position', "section": "Advanced", "description": "Reset the position of the Control Panel to the upper left", "type": "action", "action_text": "Reset Position", "action_message": "cp/reset_position"});

    var $vm, data;
    var reset = function () {
        X('#sfx_control_panel').remove();
        data = {
            "sections": []
        };
        control_panel_created = false;
    };
    reset();

    // Reset the position
    X.subscribe("cp/reset_position", function () {
        FX.option('control_panel_x', null, false);
        FX.option('control_panel_y', null, false);
        FX.option('control_panel_right', null, false);
        FX.option('control_panel_bottom', null, false);
        X.storage.save("options");
        position_control_panel(null, null, false);
    });

    // Add a SECTION
    X.subscribe("cp/section/add", function (msg, section_data) {
        create_control_panel();
        section_data.order = section_data.order || 999;
        // {"name", "id", "help", "order"}
        data.sections.push(section_data);
    });

    var control_panel_created = false;
    var create_control_panel = function () {
        if (control_panel_created || X.find('#sfx_control_panel')) {
            return;
        }
        control_panel_created = true;

        var html = `<div id="sfx_control_panel">
                <div class="sfx_cp_header"><span style="float:right;" v-tooltip="{icon:true,content:'The Social Fixer Control Panel is where tabs appear from filters you have defined and other controls may appear, depending on options selected.\n\nTo hide it completely, disable the options that require it (tab filters, mark all read, etc)'}"></span>Social Fixer</div>
                <div class="sfx_cp_data">
                    <div class="sfx_cp_section" v-for="section in sections | orderBy 'order'">
                        <div class="sfx_cp_section_label" v-tooltip="{content:section.help,position:'right',delay:300}">{{{section.name}}}</div>
                        <div class="sfx_cp_section_content" id="{{section.id}}"></div>
                    </div>
                </div>
            </div>
            `;
        var v = template(document.body, html, data).ready(function () {
            // Position it
            position_control_panel(null, null, false);

            // Make it draggable
            X.draggable('#sfx_control_panel', function (el, x, y) {
                position_control_panel(x, y, true);
            });
        });
        $vm = v.$view; // The Vue instance, to access the $set method
    };
    var position_control_panel = function (x, y, save) {
        var $cp = X('#sfx_control_panel');
        if (!$cp.length) {
            return;
        }
        var right = FX.option('control_panel_right');
        var bottom = FX.option('control_panel_bottom');
        var snap_tolerance = 15;
        var reposition = false;
        if (typeof x == "undefined" || x == null || typeof y == "undefined" || y == null) {
            // Re-position it with saved options
            x = +FX.option('control_panel_x');
            y = +FX.option('control_panel_y');
            reposition = true;
        }
        var h = $cp[0].offsetHeight;
        var w = $cp[0].offsetWidth;

        // Constrain it to the screen
        if (x < 1) {
            x = 1;
        }
        if (!reposition) {
            right = (window.innerWidth && x + w > (window.innerWidth - snap_tolerance)); // Off the right side, snap it to the right
        }
        if (y < 40) {
            y = 40;
        }
        if (!reposition) {
            bottom = (window.innerHeight && y + h > (window.innerHeight - snap_tolerance)); // Off the bottom, snap to bottom
        }

        // Position it
        if (right) {
            $cp.css({'right': 0, 'left': ''});
        }
        else {
            $cp.css({'left': x, 'right': ''});
        }
        if (bottom) {
            $cp.css({'bottom': 0, 'top': ''});
        }
        else {
            $cp.css({'top': y, 'bottom': ''});
        }

        // Persist the control panel location
        if (false !== save) {
            FX.option('control_panel_x', x, false);
            FX.option('control_panel_y', y, false);
            FX.option('control_panel_right', right, false);
            FX.option('control_panel_bottom', bottom, false);
            X.storage.save("options");
        }
    };
    // On window resize, make sure control panel is on the screen
    X(window).resize(function () {
        position_control_panel();
    });
    FX.on_options_load(function () {
        if (FX.option('always_show_control_panel')) {
            FX.on_page_load(function () {
                create_control_panel();
            });
        }
    });

    // If options are updated from another tab, move the control panel
    X.subscribe("storage/refresh", function (msg, data) {
        if ("options" == data.key) {
            position_control_panel(null, null, false);
        }
    });

    // When the page unloads to navigate, remove the control panel
    FX.on_page_unload(reset);
});
