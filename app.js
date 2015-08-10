if(!LDR){
    LDR = {};
}

LDR.AppView = Backbone.View.extend({
    template: 'app',
    initialize: function(){
        this.store = new Firebase(LDR.AppView.STORE_URL);
        // debug
        LDR.store = this.store;
    },
    render: function(){
        var that = this;
        var user = this.store.getAuth();

        this.$el.html(render_template(this.template, {}));

        if(!user){
            // Step 1: Register for an account
            var initializationModal = new LDR.InitializationModalView();
            initializationModal.render();
            initializationModal.$('.modal').on('hidden.bs.modal', function(){
                // Step 2: Enter partner's email
                user = that.store.getAuth();
                var settingsModal = new LDR.SettingsModalView({uid: user.uid});
                settingsModal.$('.modal').on('hidden.bs.modal', function(){
                    // All done
                    that.renderDashboard();
                });
            });
        } else{
            that.renderDashboard();
        }

        return this;
    },
    renderDashboard: function(){
        var user = this.store.getAuth();
        this.store.child('users/'+user.uid+'/partner_email').once('value', function(partner_email){
            LDR.EmailUidMap.getUserIdByEmail(partner_email.val(), function(partner_uid){
                // get partner_email and partner_uid

                var relationship_store = LDR.Relationship.relationship_store(partner_uid);
                // this.renderPhotobooths(partner_uid);
                // this.settingsView = this.$('.settings').html(new LDR.SettingsView({uid: user.uid}).render().el);
                this.loveButton = this.$('.love-holder').html(new LDR.LoveButtonView({relationship: relationship_store}).el);
            });
        });
    },
    renderPhotobooths: function(partner_uid){
        var user = this.store.getAuth();
        this.photobooth1 = this.$('.photobooth1').html(new LDR.PhotoboothView({uid: user.uid}).el);
        this.photobooth2 = this.$('.photobooth2').html(new LDR.PhotoboothView({uid: partner_uid}).el);
    }
},
{
    STORE_URL: "https://sweltering-heat-1797.firebaseio.com/"
});

$(document).ready(function(){
    LDR.appView = $('.app').html(new LDR.AppView().render().el);
});