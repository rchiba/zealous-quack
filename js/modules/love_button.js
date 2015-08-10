/*
The love button.

The love button is sort of like a 2 player version of the cookie clicker concept where people build up points for clicking on a button. With 2 people, the button has more than a single state however. Here is the user flow:

1. User 1 clicks on the button and accumulates points. 
2. User 2 clicks on the button and collects the points that user 1 has accumulated (with a neat animation that makes it satisfying to collect.
3. User 2 clicks on the button again and accumulates points for user 1 to collect, repeat

Other ideas:
* As many points are accumulated, maybe the button grows / changes color so that the person on the other side sees that there is pending accumulation
* The points collected in the button could be persisted and used to collect "prizes"
* Maybe there would be a bonus/multiplier applied to going back and forth frequently

The love button will need to keep track of
* collected points
* uncollected points
* who pressed the button last

*/

LDR.LoveButtonView = Backbone.View.extend({
    template: 'love_button',
    initialize: function(options){
        var that = this;
        this.uid = new Firebase(LDR.AppView.STORE_URL).getAuth().uid;
        this.store = options.relationship.child("love");
        var default_model = {
            collected_points: 0,
            uncollected_points: 0,
            last_uid: 0
        };
        this.store.on("value", function(snapshot) {
            that.model = _.extend(default_model, snapshot.val());

            // check to make sure the save wasn't from the user collecting their points
            var still_showering = that.loveFountain && $.contains(document, that.loveFountain.el);
            if(!still_showering){
                that.render.call(that);
            }
        });
    },
    events:{
        'click .love-button': 'clicked'
    },
    serializeData: function(){
        return {
            collected_points: (this.model && this.model.collected_points)? this.model.collected_points : 0,
            uncollected_points: (this.model && this.model.uncollected_points)? this.model.uncollected_points : 0,
            last_uid: (this.model && this.model.last_uid)? this.model.last_uid : 0,
        };
    },
    render: function(){
        this.$el.html(render_template(this.template, this.serializeData()));
        return this;
    },
    clicked: function(){
        var current_uid = this.store.getAuth().uid;
        var i_pressed_last = LDR.i_pressed_last; // this.model && this.model.last_uid === current_uid;
        var first_time_pressing = this.model.last_uid === 0;
        if(i_pressed_last){
            // increment
            this.store.update({
                uncollected_points: this.model.uncollected_points + 1
            });
        } else if(first_time_pressing){
            // first time
            // show onboarding message
            // initialize beginning state
            alert('first time pressing!');
            this.store.update({
                collected_points: 0,
                uncollected_points: 0,
                last_uid: current_uid
            });
        } else{
            // partner_pressed last
            // collect uncollected points

            // shower in hearts
            this.loveFountain =  new LDR.LoveButtonFountainView({
                count: this.model.uncollected_points
            });
            this.listenTo(this.loveFountain, 'stop', this.render);
            this.$('.love-fountain').html( this.loveFountain.render().el );

            // update last pressed state
            this.store.update({
                collected_points: this.model.collected_points + this.model.uncollected_points,
                uncollected_points: 0,
                last_uid: current_uid
            });
        }
    }
});

