/*globals fb, Backbone*/
fb.views.Menu = Backbone.View.extend({

  initialize: function() {
    this.template = fb.templateLoader.get('menu');
    this.render();
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  }

});

fb.views.Welcome = Backbone.View.extend({

  initialize: function() {
    var self = this;
    this.template = fb.templateLoader.get('welcome');
    this.render();
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  },

  events: {
    'click .login': 'login'
  },

  login: function() {
    $(document).trigger('login');
    return false;
  }

});

fb.views.Person = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template(this.model));
    return this;
  }

});

fb.views.Decks = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template(this.model));
    return this;
  }

});

fb.views.Deck = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template(this.model));
    this.$resume = this.$el.find("#resume");

    if(fb.WorkoutController.currentWorkout){
      this.$resume.attr("href","#workout/"+fb.WorkoutController.currentWorkout.id);
      this.$resume.show();
    }
    return this;
  },

  events: {
    'click #new': 'createWorkout'
  },

  createWorkout: function() {
    $.when(fb.WorkoutController.createWorkout(1)).done(function(workout) {
      workout.save(null, {
        success: function(model, response) {
          Backbone.history.navigate("#workout/" + model.id, {
            trigger: true
          });
        },
        error: function(model, response) {
          console.log("Error saving new workout.");
        }
      });

    })
  },
  resumeWorkout: function() {
    Backbone.history.navigate("#workout/" + model.id, {
      trigger: true
    });
  }

});

fb.views.Workout = Backbone.View.extend({

  initialize: function() {
    //this.model.get('cards').on("change:complete", this.updateProgress, this);
    this.model.on('change:last_modified', this.updateProgress, this);
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template(this.model));

    this.$progressbar = this.$el.find("#progress-bar");
    this.$duration = this.$el.find("#duration");
    this.$start = this.$el.find("#start-date");
    this.$time = this.$el.find("#total-time");
    this.$progress = this.$el.find("#progress");
    this.$currentcard = this.$el.find("#current-card");

    this.updateProgress();

    return this;
  },

  updateProgress: function() {
    //progress bar
    var percentComplete = this.model.percentComplete();
    this.$progressbar.css({
      width: percentComplete + "%"
    });

    //Duration
    this.$duration.html(fb.msToHMS(this.model.get('duration')));

    
    if(this.model.get('start_date')) {
      //Start Date
      this.$start.html(this.model.get('start_date').toLocaleString());

      //Total Time
      this.$time.html(this.model.getTimeSinceStart());
    } 

    //Total Progress
    var completed = this.model.get('cards').where({
      complete: true
    }).length;
    var total = this.model.get('cards').length;
    this.$progress.html(completed + "/" + total);
  }

});

fb.views.Card = Backbone.View.extend({

  tagName: "div",

  className: "click panel",

  events: {
    "touchstart": "touchStart",
    "touchmove": "touchMove",
    "touchend": "touchEnd",
    "touchstart .action": "flip"
  },

  initialize: function() {
    this.container = $('#canvas');
  },

  render: function() {
    this.$el.attr('id', this.model.get('cardId'));
    this.$el.html(this.options.template({
      card: this.model.toJSON()
    }));
    this.$el.css({
      "z-index": 100 - this.model.get('position'),
      '-webkit-transition-duration': '0s',
      'webkitTransform': 'translate3d(0px, 0px, 0px) scale(1)'
    });
    this.container.append(this.$el);
    return this;
  },

  flip: function() {
    this.$el.toggleClass('flip');
  },

  touchStart: function(event) {

    event.preventDefault();
    var e = event.originalEvent; //Jquery hides original event 
    this.startX = e.targetTouches[0].clientX;
    //Record starting touch position
    this.$el.css({
      '-webkit-transition-duration': '0s' //make sure transition doesn't fire when dragging.  Setting to none on property didn't work, so setting seconds to 0
    });
    this.touchStartTime = new Date().getTime(); //record time started touch to calculate velocity
  },

  touchMove: function(event) {
    event.preventDefault();
    var e = event.originalEvent; //Jquery hides original event 

    this.diffX = (e.targetTouches[0].clientX - this.startX); //Distance between starting position and current touch position         
    var styleStr = "translate3d(" + this.diffX + "px, 0px, 0px) scale(1)"; //create transform to move
    this.$el.css({
      '-webkit-transform': styleStr,
      'transform': styleStr
    });
  },

  touchEnd: function(event) {

    var e = event.originalEvent; //Jquery hides original event 
    var that = this;

    this.posX = this.diffX + this.posX; //save new starting position
    var slideTime = (new Date().getTime() - this.touchStartTime);
    var velX = this.diffX / slideTime;
    this.diffX = 0; //reset difference for next touch event
    if (Math.abs(velX) > 1) {
      //snd.play();
      //slide right
      if (velX > 1) {
        this.$el.css({
          'webkitTransform': 'translate3d(150%, 0px, 0px) scale(1)',
          '-webkit-transition-property': 'webkitTransform',
          '-webkit-transition-duration': '.25s',
          '-webkit-transition-timing-function': 'ease-out'
        });
      } else { //slide left
        this.$el.css({
          'webkitTransform': 'translate3d(-150%, 0px, 0px) scale(1)',
          '-webkit-transition-property': 'webkitTransform',
          '-webkit-transition-duration': '.25s',
          '-webkit-transition-timing-function': 'ease-out'
        });
      }
      //Need to refactor to fire event
      setTimeout(function() {
        that.options.workout.Next(false);
      }, 250);
    } else {
      //add transition to send it back
      this.$el.css({
        'webkitTransform': 'translate3d(0px, 0px, 0px) scale(1)',
        '-webkit-transition-property': 'webkitTransform',
        '-webkit-transition-duration': '.5s'
      });
    }

  },
  enableEvents: function() {
    this.delegateEvents();
  },
  disableEvents: function() {
    this.undelegateEvents();
  },
  destroy_view: function() {

    //COMPLETELY UNBIND THE VIEW
    this.undelegateEvents();

    this.$el.removeData().unbind();

    //Remove view from DOM
    this.remove();
    Backbone.View.prototype.remove.call(this);

  }



});

fb.views.Friends = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template(this.model));
    return this;
  }

});

fb.views.Error = Backbone.View.extend({

  initialize: function() {
    this.template = _.template(fb.templateLoader.get('error'));
    this.render();
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  },

  events: {
    'click .retry': 'retry'
  },

  retry: function() {
    Backbone.history.loadUrl(Backbone.history.fragment);
  }

});

fb.views.Feed = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template(this.model));
    return this;
  }

});

fb.views.Post = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template());
    return this;
  },

  events: {
    "click .post": "postMessage"
  },

  postMessage: function() {
    var status = {
      name: "Check Out Sociogram Mobile",
      link: "http://coenraets.org",
      picture: "http://coenraets.org/sociogram/img/sociogram_80x86.png",
      caption: "A PhoneGap/Facebook starter app",
      description: "Sociogram is a sample application that demonstrates how to use the Facebook JavaScript SDK and the Graph API",
      message: $('.message').val()
    };
    fb.spinner.show();
    console.log(status);
    FB.api('/me/feed', 'post', status, function(response) {
      console.log(response);
      fb.spinner.hide();
      if (response && response.id) {
        fb.alert('Your post was published.');
      } else {
        fb.alert('Your post was not published.');
      }
    });
    return false;
  }

});

fb.views.PostUI = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template());
    return this;
  },

  events: {
    "click .post": "postMessage"
  },

  postMessage: function() {
    FB.ui({
        method: 'feed',
        name: 'Check Out Sociogram Mobile',
        link: "http://coenraets.org",
        picture: "http://coenraets.org/sociogram/img/sociogram_80x86.png",
        caption: "A PhoneGap/Facebook starter app",
        description: "Sociogram is a sample application that demonstrates how to use the Facebook JavaScript SDK and the Graph API"
      },
      function(response) {
        console.log(response);
        if (response && response.post_id) {
          fb.alert('Your post was published.');
        } else {
          fb.alert('Your post was not published.');
        }
      }
    );
    return false;
  }

});

fb.views.Revoke = Backbone.View.extend({

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.template());
    return this;
  },

  events: {
    "click .revoke": "revoke"
  },

  revoke: function() {
    fb.spinner.show();
    FB.api("/me/permissions", "delete", function() {
      fb.spinner.hide();
      fb.alert('Permissions revoked');
      FB.getLoginStatus();
    });
    $(document).trigger('permissions_revoved');
    return false;
  }

});