// The cog that triggers the settings modal to open
LDR.SettingsView = Backbone.View.extend({
    template: 'settings',
    initialize: function(options){
        this.uid = options.uid;
    },
    events:{
        'click .fa-cog': 'openSettingsModal'
    },
    serializeData: function(){
    },
    render: function(){
        this.$el.html(render_template(this.template, {}));
        return this;
    },
    openSettingsModal: function(){
        this.settingsModal = new LDR.SettingsModalView({uid: this.uid});
    }
});

// a status indicator showing relationship status
LDR.SettingsModalRelationshipView = Backbone.View.extend({
    template: 'settings_modal_relationship',
    initialize: function(options){
        var that = this;
        this.onboarding = options.onboarding;
        LDR.Relationship.getRelationshipStatus(options.partner_email, function(status){
            that.status = status;
            that.render.call(that);
        });
    },
    render: function(){
        this.$el.html(render_template(this.template, {
            status: this.status,
            onboarding: this.onboarding
        }));
        return this;
    }
});

// A settings modal that is used both during the onboarding process
// and also to adjust settings later
LDR.SettingsModalView = Backbone.View.extend({
    template: 'settings_modal',
    initialize: function(options){
        var that = this;
        $('body').append(this.el);
        this.uid = options.uid;
        this.store = new Firebase(LDR.AppView.STORE_URL + 'users/' + this.uid);
        this.store.once("value", function(snapshot) {
            that.model = snapshot.val();
            that.render.call(that);
        });
    },
    events:{
        'click .settings-save': 'saveSettings'
    },
    serializeData: function(){
        var onboarding, partner_email, relationship_status;
        if(!this.model || !this.model.partner_email){
            // onboarding
            onboarding = true;
            partner_email = '';
        } else{
            onboarding = false;
            partner_email = this.model.partner_email;
        }

        return {
            partner_email: partner_email,
            onboarding: onboarding,
            current_email: this.model.email
        };
    },
    render: function(){
        this.$el.html(render_template(this.template, this.serializeData()));
        this.$('.settings-modal-relationship').html(new LDR.SettingsModalRelationshipView(this.serializeData()).el);
        this.$('.modal').modal('show');
        return this;
    },
    saveSettings: function(e){
        var that = this;
        e.preventDefault();
        $.when(this.saveUser(), this.saveRelationship()).done(function(){
            that.$('.modal').modal('hide');
        });
    },
    saveUser: function(){
        var deferred = $.Deferred();
        var settings = this.$('form').serializeObject();
        this.store.update(settings, function(){
            deferred.resolve();
        });
        return deferred.promise();
    },
    saveRelationship: function(){
        var deferred = $.Deferred();
        var settings = this.$('form').serializeObject();
        var partner_email = settings.partner_email;
        LDR.Relationship.getRelationshipStatus(partner_email, function(status){
            if(status === LDR.Relationship.PARTNER_READY){
                LDR.Relationship.createRelationship({
                    partner_email: partner_email
                }, function(){
                    deferred.resolve();
                });
            } else{
                deferred.resolve();
            }
        });
        return deferred.promise();
    }
});