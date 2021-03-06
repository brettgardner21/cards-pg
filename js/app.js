window.addEventListener('load', function () {
    new FastClick(document.body);
}, false);

var fb = new MobileApp();

/*Parse stuff for now */
//Parse.initialize("h4t4vpIJakzrHVXwSvvfBwwTJL5ZCbGD6cTzWhKo", "jQRZxUSfeC0W5wflwFDjhEaoVfHS1600k3Y0KT5K");

fb.spinner = $("#spinner");
fb.spinner.hide();

fb.slider = new PageSlider($('#container'));

fb.MobileRouter = Backbone.Router.extend({

    routes: {
        "":                         "welcome",
        "me":                       "me",
        "menu":                     "menu",
        "me/friends":               "myfriends",
        "person/:id":               "person",
        "person/:id/friends":       "friends",
        "person/:id/mutualfriends": "mutualfriends",
        "me/feed":                  "myfeed",
        "person/:id/feed":          "feed",
        "revoke":                   "revoke",
        "post":                     "post",
        "postui":                   "postui",
        "decks":                    "decks",
        "deck/:id":                 "deck",
        "workout":                  "workout",
        "workout/:id" :             "workout",
        "stream":                   "stream"
    },

    welcome: function () {
        // Reset cached views
        fb.myView = null;
        fb.myFriendsView = null;
        var view = new fb.views.Welcome();
        fb.slider.slidePageFrom(view.$el, "left");
    },

    menu: function () {
        fb.slider.slidePageFrom(new fb.views.Menu().$el, "left");
        fb.slider.resetHistory();
    },

    me: function () {
        var self = this;
        if (fb.myView) {
            fb.slider.slidePage(fb.myView.$el);
            return;
        }
        fb.myView = new fb.views.Person({template: fb.templateLoader.get('person')});
        var slide = fb.slider.slidePage(fb.myView.$el).done(function(){
            fb.spinner.show();
        });
        var call = fbWrapper.api("/me");
        $.when(slide, call)
            .done(function(slideResp, callResp) {
                fb.myView.model = callResp;
                fb.myView.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    person: function (id) {
        var self = this;
        var view = new fb.views.Person({template: fb.templateLoader.get('person')});
        var slide = fb.slider.slidePage(view.$el).done(function(){
            fb.spinner.show();
        });
        var call = fbWrapper.api("/" + id);
        $.when(slide, call)
            .done(function(slideResp, callResp) {
                view.model = callResp;
                view.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    myfriends: function () {
        var self = this;
        if (fb.myFriendsView) {
            fb.slider.slidePage(fb.myFriendsView.$el);
            return;
        }
        fb.myFriendsView = new fb.views.Friends({template: fb.templateLoader.get('friends')});
        var slide = fb.slider.slidePage(fb.myFriendsView.$el).done(function() {
            fb.spinner.show();
        });
        var call = fbWrapper.api("/me/friends?limit=100");
        $.when(slide, call)
            .done(function(slideResp, callResp) {
                fb.myFriendsView.model = callResp.data;
                fb.myFriendsView.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    friends: function (id) {
        var self = this;
        var view = new fb.views.Friends({template: fb.templateLoader.get('friends')});
        var slide = fb.slider.slidePage(view.$el).done(function() {
            fb.spinner.show();
        });
        var call = fbWrapper.api("/" + id + "/friends?limit=100");
        $.when(slide, call)
            .done(function(slideResp, callResp) {
                view.model = callResp.data;
                view.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    mutualfriends: function (id) {
        var self = this;
        var view = new fb.views.Friends({template: fb.templateLoader.get('friends')});
        var slide = fb.slider.slidePage(view.$el).done(function() {
            fb.spinner.show();
        });
        var call = fbWrapper.api("/" + id + "/mutualfriends?limit=100");
        $.when(slide, call)
            .done(function(slideResp, callResp) {
                view.model = callResp.data;
                view.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    myfeed: function (id) {
        var self = this;
        var view = new fb.views.Feed({template: fb.templateLoader.get('feed')});
        var slide = fb.slider.slidePage(view.$el).done(function() {
            fb.spinner.show();
        });
        var call = fbWrapper.api("/me/feed?limit=20");
        $.when(slide, call)
            .done(function(slideResp, callResp) {
                view.model = callResp.data;
                view.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    decks: function(){
        var self = this;
        var view = new fb.views.Decks({template: fb.templateLoader.get('decks')});
        var slide = fb.slider.slidePage(view.$el).done(function() {
            fb.spinner.show();
        });
        
        //var query = new Parse.Query(fb.models.Deck);
        //var call = parseWrapper.find(query);
        var call = fb.DeckController.getDecks();
        $.when(slide, call)
            .done(function(slideResp,callResp) {
                view.model = callResp;
                view.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    deck: function (id) {
        var self = this;
        var view = new fb.views.Deck({template: fb.templateLoader.get('deck')});
        var slide = fb.slider.slidePage(view.$el).done(function(){
            fb.spinner.show();
        });

        //var query = new Parse.Query(fb.models.Deck);
        //query.equalTo("objectId", id);
        //var call = parseWrapper.find(query);
        var call = fb.DeckController.getDeck(id);

        $.when(slide, call)
            .done(function(slideResp,callResp) {
                view.model = callResp;
                view.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    workout: function (id) {
        var self = this;
        //need to make this deferred later
        var workout = fb.WorkoutController.getWorkout(id);

        var view = new fb.views.Workout({template: fb.templateLoader.get('workout'), model: workout});

        var slide = fb.slider.slidePage(view.$el).done(function(){
            fb.spinner.show();
        });

        $.when(slide)
            .done(function(slideResp) {
                var ws = new WorkoutSession(null, workout);
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },    

    feed: function (id) {
        var self = this;
        var view = new fb.views.Feed({template: fb.templateLoader.get('feed')});
        var slide = fb.slider.slidePage(view.$el).done(function() {
            fb.spinner.show();
        });
        var call = fbWrapper.api("/" + id + "/feed?limit=20");
        $.when(slide, call)
            .done(function(slideResp, callResp) {
                view.model = callResp.data;
                view.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },
    stream: function () {
        var self = this;
        var view = new fb.views.Feed({template: fb.templateLoader.get('stream')});
        var slide = fb.slider.slidePage(view.$el).done(function() {
            fb.spinner.show();
        });
        var call = fb.WorkoutDao.getWorkoutStream();
        $.when(slide, call)
            .done(function(slideResp, callResp) {
                view.model = callResp;
                view.render();
            })
            .fail(function() {
                self.showErrorPage();
            })
            .always(function() {
                fb.spinner.hide();
            });
    },

    post: function () {
        fb.slider.slidePage(new fb.views.Post({template: fb.templateLoader.get("post")}).$el);
    },

    postui: function () {
        fb.slider.slidePage(new fb.views.PostUI({template: fb.templateLoader.get("postui")}).$el);
    },

    revoke: function () {
        fb.slider.slidePage(new fb.views.Revoke({template: fb.templateLoader.get("revoke")}).$el);
    },

    showErrorPage: function () {
        fb.slider.slidePage(new fb.views.Error().$el);
    }

});

$(document).on('ready', function () {

    fb.templateLoader.load(['menu', 'welcome', 'login', 'person', 'friends', 'feed', 'post', 'postui', 'error', 'revoke', 'decks', 'deck', 'workout','card','card2','stream'], function () {
        fb.router = new fb.MobileRouter();
        Backbone.history.start();

        /*enable for native testing*/
        //FB.init({ appId: "306588442718313", nativeInterface: CDV.FB, useCachedDialogs: false, status: true });
        
        /*enable below for local testing*/
        FB.init({
            appId      : '306588442718313',
            status     : true, // check login status
            cookie     : true, // enable cookies to allow the server to access the session
            xfbml      : false  // parse XFBML
        });
        // fb.slider.removeCurrentPage();
        // fb.router.navigate("menu", {trigger: true});
    });

    FB.Event.subscribe('auth.statusChange', function(event) {
        if (event.status === 'connected') {

            //Experiment:  Let the mobile client know
            // $.post("https://cardsworkout.azure-mobile.net/login/facebook",
            //     {
            //         "access_token" : FB.getAccessToken()
            //     }).done(function( data ) {
            //         console.log("Successfully logged in to mobile client");
            //   });
            var token = FB.getAccessToken();
            fb.client.login(
                 "facebook", 
                 {"access_token": token})
            .done(function (results) {
                 alert("You are now logged in as: " + results.userId);
            }, function (err) {
                 alert("Error: " + err);
            });

            FB.api('/me', function (response) {
                fb.user = response; // Store the newly authenticated FB user
            });
            fb.slider.removeCurrentPage();
            fb.router.navigate("menu", {trigger: true});
        } else {
            fb.user = null; // Reset current FB user
            fb.router.navigate("", {trigger: true});
        }
    });
 
});

$(document).on('click', '.button.back', function() {
    window.history.back();
    return false;
});

$(document).on('click', '.logout', function () {
    FB.logout();
    return false;
});

$(document).on('login', function () {
    FB.login(function(response) {
        console.log("Logged In");
    }, {scope: 'publish_actions,user_status,friends_status,read_stream'});
    return false;
});

$(document).on('permissions_revoked', function () {
    // Reset cached views
    fb.myView = null;
    fb.myFriendsView = null;
    return false;
});