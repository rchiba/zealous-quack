function render_template(tmpl_name, tmpl_data) {
    if ( !render_template.tmpl_cache ) {
        render_template.tmpl_cache = {};
    }

    if ( ! render_template.tmpl_cache[tmpl_name] ) {
        var tmpl_dir = '/templates';
        var tmpl_url = tmpl_dir + '/' + tmpl_name + '.html';

        var tmpl_string;
        $.ajax({
            url: tmpl_url,
            method: 'GET',
            async: false,
            success: function(data) {
                tmpl_string = data;
            }
        });

        render_template.tmpl_cache[tmpl_name] = _.template(tmpl_string);
    }

    return render_template.tmpl_cache[tmpl_name](tmpl_data);
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.requestAnimFrame=function(){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){window.setTimeout(a,1E3/60)}}();
