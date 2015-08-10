LDR.Relationship = {
    PARTNER_DNE: 1,
    PARTNER_EMAIL_MISMATCH: 2,
    PARTNER_READY: 3,
    PARTNER_CONNECTED: 4,
    store: function(){
        return new Firebase(LDR.AppView.STORE_URL);
    },
    // given 2 users uids, create a unique key
    uidsToKey: function(uid1, uid2){
        return [uid1, uid2].sort().join('-');
    },
    relationship_store: function(partner_uid){
        return this.store().child('parnerships/' + this.uidsToKey(this.store().getAuth().uid, partner_uid));
    },
    getRelationshipStatus: function(partner_email, callback){
        var that = this;

        // get partner's uid from email
        LDR.EmailUidMap.getUserIdByEmail(partner_email, function(partner_uid){
            if(!partner_uid){
                // if cannot get uid, PARTNER_DNE
                callback(that.PARTNER_DNE);
                return;
            }

            // try to get partner info
            var partner_store = that.store().child('users/' + partner_uid);
            partner_store.once('value', function(snap){

                // get relationship
                that.relationship_store(partner_uid).once('value', function(snap){
                    if(snap.val()){
                        callback(that.PARTNER_CONNECTED);
                        return;
                    } else{
                        callback(that.PARTNER_READY);
                        return;
                    }
                }, function(err){
                    // if not able to get relationship, PARTNER_READY
                    callback(that.PARTNER_READY);
                    return;
                });


            }, function(err){
                // if not able to get partner info, PARTNER_EMAIL_MISMATCH
                callback(that.PARTNER_EMAIL_MISMATCH);
                return;
            });

        });

    },
    // params.partner_email (required)
    // params.countdowns (optional) = [{'name': 'monica moves back', timestamp: 123}]
    createRelationship: function(params, callback){
        var that = this;
        LDR.EmailUidMap.getUserIdByEmail(params.partner_email, function(partner_uid){
            if(!partner_uid){
                alert('there was an issue creating the relationship!');
            } else{
                that.relationship_store(partner_uid).set({
                    'countdowns': params.countdowns || [],
                    'valid': true
                }, function(e){
                    callback();
                });
            }
        });
    }
};