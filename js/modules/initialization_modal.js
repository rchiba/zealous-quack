if(typeof LDR === 'undefined'){
    LDR = {};
}

LDR.InitializationModalView = Backbone.View.extend({
    template: 'initialization_modal',
    initialize: function() {
        $('body').append(this.el);
        this.store = new Firebase(LDR.AppView.STORE_URL);
    },
    events: {
        'submit #login': 'login',
        'submit #register': 'register'
    },
    render: function(){
        this.$el.html(render_template(this.template, {}));
        this.$('.modal').modal('show');
        return this;
    },
    authWithPassword: function(userObj, firstTime) {
        var that = this;
        var deferred = $.Deferred();
        console.log(userObj);
        this.store.authWithPassword(userObj, function onAuth(err, user) {
            if (err) {
                deferred.reject(err);
            }

            if (user) {
                if(firstTime){
                    that.store.child('users/' + user.uid).set({email: userObj.email}, function(){
                        deferred.resolve(user);
                    });
                } else{
                    deferred.resolve();
                }
            }

        });

        return deferred.promise();
    },
    createUser: function(userObj) {
        var that = this;
        var deferred = $.Deferred();
        this.store.createUser(userObj, function (err, user) {

            if (!err) {
                LDR.EmailUidMap.createUser({
                    email: userObj.email,
                    uid: user.uid
                });
                deferred.resolve();
            } else {
                deferred.reject(err);
            }

        });

        return deferred.promise();
    },
    createUserAndLogin: function(userObj) {
        var that = this;
        return this.createUser(userObj)
            .then(function () {
            return that.authWithPassword(userObj, true);
        });
    },
    handleAuthResponse: function(promise) {
        var that = this;
        $.when(promise)
            .then(function (authData) {

            that.$('.modal').modal('hide');

        }, function (err) {
            console.log(err);
            // pop up error
            alert(err.message);
        });
    },
    login: function(e){
        e.preventDefault();
        var that = this;
        var userAndPass = this.$('#login form').serializeObject();
        var loginPromise = this.authWithPassword(userAndPass);
        this.handleAuthResponse(loginPromise);
    },
    register: function(e){
        e.preventDefault();
        var that = this;
        var userAndPass = this.$('#register form').serializeObject();
        var loginPromise = this.createUserAndLogin(userAndPass);
        this.handleAuthResponse(loginPromise);
    }
});