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
    },
    events:{
        'click .open-countdown-add': 'initializeCountdownPopover'
    },
    render: function(){
        var that = this;
        this.$el.html(render_template(this.template));
        _.each(this.model, function(countdown){
            that.$('.countdowns').append(new LDR.CountdownView({model: countdown}).render().el);
        });
        this.$('[data-toggle="popover"]').popover({html: true});
        return this;
    },
    initializeCountdownPopover: function(){
        
    },
    addCountdown: function(){
        alert('addCountdown');
    }
});

LDR.CountdownView = Backbone.View.extend({
    template: 'countdown',
    initialize: function(options){
        this.counter = 0;
        this.pos = 0;
        this.endTimestamp = options.endTimestamp;
        this.startTimestamp = options.startTimestamp;
        this.totalDays = Math.floor((endTimestamp - startTimestamp)/1000/60/60/24);
        this.daysUntilEnd = Math.floor((endTimestamp - new Date().getTime())/1000/60/60/24);
    },
    serializeData: function(){
        return {

        };
    },
    update: function(){

        if(counter > this.daysUntilEnd){
            counter = 0;
            window.clearInterval(this.interval);
            return;
        }

        // pos starts at 0, goes to 1 as counter goes down
        counter++;
        pos = 1 - counter/this.totalDays;

        // update background
        this.$('progress').val(counter);
        this.$('progress').css('background-position', '0 '+ pos +'em');
    },
    render: function(){
        this.$el.html(render_template(this.template, this.serializeData()));
        this.interval = window.setInterval(this.update, 100);
        return this;
    }
});




// // set interval
// var timer = setInterval(progress, 100);

// function progress() {
  
//   // run counter

  
//   // show/hide progress
//   if(!progressHidden && value >= 100) {
//     progressEl.addClass("hidden");
//     progressHidden = true;
    
//   } else if(progressHidden && value < 100) {
//     progressEl.val(0);
//     progressEl.removeClass("hidden");
//     progressHidden = false;
//   }
  
// }