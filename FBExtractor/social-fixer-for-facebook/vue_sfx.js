// Vue Customizations specific to Social Fixer
Vue.directive('tooltip', function (o) {
    this.el.setAttribute('data-hover','tooltip');
    if (o) {
        o.content && this.el.setAttribute('data-tooltip-content', o.content);
        o.uri && this.el.setAttribute('data-tooltip-uri',o.uri);
        this.el.setAttribute('data-tooltip-delay', (typeof o.delay!="undefined") ? o.delay : 1000);
        o.position && this.el.setAttribute('data-tooltip-position', o.position);
        o.align && this.el.setAttribute('data-tooltip-alignh', o.align);
        if (o.icon) {
            this.el.className="sfx-help-icon";
            this.el.setAttribute('data-tooltip-delay',1);
        }
    }
    else {
        this.el.setAttribute('data-tooltip-content', this.expression);
        if (this.el.getAttribute('data-tooltip-delay')==null) {
            this.el.setAttribute('data-tooltip-delay', "1000");
        }
    }
});
// For Vue Templates
// =============================
function template(appendTo,template,data,methods,computed,events) {
    var frag = document.createDocumentFragment();
    var ready = function(){};
    var v = new Vue(X.extend({
        "el":frag
        ,"template":template
        ,"data":data
        ,"methods":methods
        ,"computed":computed
        ,"replace":false
        ,"ready":function() { ready(); }
    },events));
    if (appendTo) {
        v.$appendTo(appendTo); // Content has already been sanitized
    }
    var o = {
        "$view":v,
        "fragment":frag,
        "ready": function(func) {
            if (v._isReady) { func(); }
            else { ready=func; }
            return o;
        }
    };
    return o;
}
