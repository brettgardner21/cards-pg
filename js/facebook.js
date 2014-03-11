/*globals FB*/

// Wrap FB.api with a Deferred
fbWrapper = {

    api: function(url) {
        var deferred = $.Deferred();
        try {
            console.log('calling fb api');
            FB.api(url, function (response) {
                deferred.resolve(response);
            });
        } catch (e) {
            deferred.fail();
        }
        return deferred;
    },
    getAppFriends: function(){
        return this.api('/fql?q=SELECT uid, name, is_app_user, pic_square FROM user WHERE uid IN (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1');
    }

};

// Follow same pattern.  Wrap Parse Find with a Deferred
parseWrapper = {

    find: function(query) {

        var deferred = $.Deferred();
        query.find({
          success: function(results) {
            var jsonArray = [];
            for(var i = 0; i < results.length; i++) {
               jsonArray.push(results[i].toJSON());
            }
            deferred.resolve(jsonArray);
          },
          error: function(error) {
            deferred.fail();
          }
        });
        return deferred.promise();
    }

};