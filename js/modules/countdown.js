// from: http://codepen.io/simurai/pen/eqhEF

LDR.CountdownsView = Backbone.View.extend({
    template: 'countdowns',
    initialize: function(options){
        var that = this;
        this.store = options.relationship.child("countdowns");
        this.store.on('value', function(snap){
            that.model = snap.val();
            that.render();
        });
        this.render();
    },
    events:{
        'click .countdown-add': 'addCountdown'
    },
    render: function(){
        var that = this;
        this.$el.html(render_template(this.template));
        _.each(this.model, function(countdown, id){
            countdown.id = id;
            that.$('.countdowns').append(new LDR.CountdownView({model: countdown, store: that.store}).render().el);
        });
        this.$('[data-toggle="popover"]').popover({html: true});
        return this;
    },
    addCountdown: function(){
        var name = this.$('.countdown-add-name').val();
        var endTimestamp = new Date(this.$('.countdown-add-date').val()).getTime();
        var startTimestamp = new Date().getTime();
        this.store.push({
            'startTimestamp': startTimestamp,
            'endTimestamp': endTimestamp,
            'name': name
        });
        this.$('[data-toggle="popover"]').popover('hide');
    }
});

LDR.CountdownView = Backbone.View.extend({
    template: 'countdown',
    className: 'countdown',
    initialize: function(options){
        this.counter = 0;
        this.pos = 0;
        this.endTimestamp = this.model.endTimestamp;
        this.startTimestamp = this.model.startTimestamp;
        this.totalDays = Math.floor((this.endTimestamp - this.startTimestamp)/1000/60/60/24);
        this.daysUntilEnd = Math.floor((this.endTimestamp - new Date().getTime())/1000/60/60/24);
        this.store = options.store;
    },
    events:{
        'click .countdown-delete': 'deleteCountdown'
    },
    serializeData: function(){
        return {
            name: this.model.name
        };
    },
    update: function(){

        if(this.counter > this.daysUntilEnd){
            this.counter = 0;
            window.clearInterval(this.interval);
            return;
        }

        // pos starts at 0, goes to 1 as counter goes down

        if(this.daysUntilEnd - this.counter > 20){
            this.counter += 10;
        } else{
            this.counter++;
        }

        pos = 1 - this.counter/this.totalDays;

        // update background
        this.$('progress').val(this.counter);
        this.$('progress').css('background-position', '0 '+ pos +'em');
    },
    render: function(){
        this.$el.html(render_template(this.template, this.serializeData()));
        this.interval = window.setInterval(this.update.bind(this), 20);
        return this;
    },
    deleteCountdown: function(){
        if(confirm('Are you sure you want to delete the countdown?')){
            this.store.child(this.model.id).remove(function(error){
                if(error) {
                    alert('Something went wrong deleting the countdown');
                }
            });
        }
    }
});