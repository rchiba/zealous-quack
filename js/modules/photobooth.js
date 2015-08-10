LDR.PhotoboothView = Backbone.View.extend({
    template: 'photobooth',
    className: 'photobooth',
    initialize: function(options){
        var that = this;
        this.uid = options.uid;
        this.localMediaStream = null;
        this.store = new Firebase(LDR.AppView.STORE_URL + 'photos/' + this.uid);
        this.store.limitToLast(1).on("value", function(snapshot) {
            that.photo = _.map(snapshot.val())[0];
            that.render.call(that);
        }, function(err){
            console.log(err);
        });
    },
    events:{
        'click .click_photobooth': 'click_photobooth'
    },
    serializeData: function(){
        var photo_url = 'http://lorempixel.com/300/300/cats/';
        var timeago = '';
        var clickable = true;
        if(this.photo){
            photo_url = this.photo.url;
            timeago = moment(this.photo.timestamp).fromNow();
        }

        if(this.store.getAuth().uid !== this.uid){
            clickable = false;
        }

        return {
            photo_url: photo_url,
            timeago: timeago,
            clickable: clickable
        };
    },
    render: function(){
        this.$el.html(render_template(this.template, this.serializeData()));
        return this;
    },
    startVideo: function(){
        var that = this;
        
        navigator.getUserMedia({video: true}, function(stream) {
            that.$('video')[0].src = window.URL.createObjectURL(stream);
            that.localMediaStream = stream;
        },  function(e) {
            console.log('Reeeejected!', e);
        });
    },
    capture: function(){
        var that = this;
        this.$('canvas').attr('width', this.$el.width());
        this.$('canvas').attr('height', this.$el.height());
        var canvas = this.$('canvas')[0];
        this.ctx = canvas.getContext('2d');
        this.ctx.drawImage(that.$('video')[0], 0, 0, that.$('video').width(), that.$('video').height());
        var captured_image = canvas.toDataURL('image/webp');
        this.$('img').attr('src', captured_image);

        this.localMediaStream.stop();
        this.localMediaStream = null;

        this.store.push({
            url: captured_image,
            timestamp: new Date().getTime()
        });
    },
    click_photobooth: function(){
        if (!this.localMediaStream) {
            this.$('video').css('display', 'block');
            this.$('img').css('display', 'none');
            this.startVideo();
        } else{
            this.$('video').css('display', 'none');
            this.$('img').css('display', 'block');
            this.capture();
        }
    }
});