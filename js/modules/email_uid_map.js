LDR.EmailUidMap = {
    STORE_URL: function(){
        return LDR.AppView.STORE_URL + 'emails_to_ids/';
    },
    emailToKey: function(email){
        return btoa(email);
    },
    createUser: function(user){
        var store = new Firebase(this.STORE_URL() + this.emailToKey(user.email));
        store.set(user.uid);
    },
    getUserIdByEmail: function(email, callback){
        var store = new Firebase(this.STORE_URL() + this.emailToKey(email));
        store.once('value', function(snap){
            callback(snap.val());
        }, function(){
            callback();
        });
    }
};