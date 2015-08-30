/* ClockView 

Displays your time / weather and your partner's time / weather
using their time zone and their geolocation

ClockView and the Weather subview both use cached references
to the relationship store, which will result in sync delays when
users refresh their timezone/coordinates. However, this should
happen relatively infrequently.

*/

LDR.ClockView = Backbone.View.extend({
    template: 'clock',
    className: 'clock clearfix',
    getStore: function(){
        var deferred = $.Deferred();
        this.store.once('value', function(snap){
            deferred.resolve(snap.val());
        });
        return deferred;
    },
    initialize: function(options){
        var that = this;
        this.store = options.relationship;
        this.partner_uid = options.partner_uid;
        this.uid = this.store.getAuth().uid;
        this.my_timezone_offset = new Date().getTimezoneOffset() / 60;

        var storePromise = LDR.Cache.get('clockRelationship', 30, this.getStore.bind(this));
        $.when(storePromise).done(function(model){
            that.model = model;
            if(typeof that.model.timezones === 'undefined' || that.model.timezones[that.uid] !== that.my_timezone_offset){
                // uninitialized or stale timezone
                that.updateTimezoneAndGeo();
            }
            that.render();
        });

    },
    events:{
        'click .clock-update-timezone-geo': 'updateTimezoneAndGeo'
    },
    calcTimeInDifferentTimezone: function(offset){
        var currentTimestamp = new Date().getTime();
        var nd = new Date(currentTimestamp + (3600000 * offset));
        return moment(nd).format(LDR.ClockView.TIME_FORMAT);
    },
    serializeData: function(){
        var serializedData = {
            my_time: moment().format(LDR.ClockView.TIME_FORMAT),
        };

        var partner_timezone_offset = this.model.timezones[this.partner_uid];
        if(partner_timezone_offset){
            serializedData.partner_time = this.calcTimeInDifferentTimezone(partner_timezone_offset);
        }
        return serializedData;
    },
    render: function(){
        var that = this;
        this.$el.html(render_template(this.template, this.serializeData()));
        this.renderWeather();
        $('[data-toggle="tooltip"]').tooltip();
        return this;
    },
    renderWeather: function(){
        if(typeof this.model.geo !== 'undefined'){
            var myPosition = this.model.geo[this.uid];
            var partnerPosition = this.model.geo[this.partner_uid];
            
            if(myPosition){
                this.$('.clock-my-weather').html( new LDR.WeatherView({uid: this.uid,position: myPosition}).el );
            }

            if(partnerPosition){
                this.$('.clock-partner-weather').html( new LDR.WeatherView({uid: this.partner_uid, position: partnerPosition}).el );
            }
        }
    },
    // updateTimezoneAndGeo: saves time zone / geo information to store if none exists or if different
    updateTimezoneAndGeo: function(){
        var that = this;
        navigator.geolocation.getCurrentPosition(function(position){
            var updateObj = {};
            updateObj[that.uid] = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            that.store.child('geo').update(updateObj);
            LDR.Cache.clear();
            alert('Timezone and geo updated. New data: '+JSON.stringify(updateObj));
        });
        var updateObj = {};
        updateObj[this.uid] = this.my_timezone_offset;
        this.store.child('timezones').update(updateObj);
    }
},{
    TIME_FORMAT: 'h:mm a'
});