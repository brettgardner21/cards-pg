/*globals fb*/

//Override Backbone Sync
Backbone.sync = function(method, model, options) {

  var dao = model.dao;
  switch (method) {
    case "read":
      if (model.id)
        dao.find(model, function(data) {
          options.success(model, data, options);
          console.log(method + ": " + JSON.stringify(model));
        });
      else
        dao.findAll(function(data) {
          options.success(model, data, options);
          console.log(method + ": " + JSON.stringify(model));
        });
      break;
    case "create":
      dao.insert(model, function(data) {
        options.success(model, data, options);
        console.log(method + ": " + JSON.stringify(model));
      });
      break;
    case "update":
      dao.update(model, function(data) {
        options.success(model, data, options);
      });
      console.log(method + ": " + JSON.stringify(model));
      break;
    case "delete":
      // dao.destroy(model, function (data) {
      //     options.success(data);
      // });
      console.log(method + ": " + JSON.stringify(model));
      break;
  }
};


// Simple syntax to create a new subclass of Parse.Object.
fb.models.Deck = Parse.Object.extend("Deck");

//My Backbone models
fb.models.WorkoutCard = Backbone.Model.extend({
  defaults: {
    complete: false
  }
});

fb.collections.WorkoutCards = Backbone.Collection.extend({
  model: fb.models.WorkoutCard,
  comparator: 'position'
});

//Jill's ID 518798258
//Brett's ID 519337450

fb.models.Workout = Backbone.Model.extend({
  dao: fb.WorkoutDao,
  defaults: {
    deckid: 1,
    last_modified: new Date(),
    duration: 0,
    cards: null
  },
  initialize: function() {
    var cards = new fb.collections.WorkoutCards();
    this.set('cards', cards);
    this.set('userid',fb.user.id); //uncomment this for live
  },
  percentComplete: function() {
    var completed = this.get('cards').where({complete: true}).length;
    return ((completed / this.get('cards').length) * 100).toFixed(1);
  },
  getDuration: function() {
    return fb.msToHMS(this.get('duration'));
  },
  getTimeSinceStart: function() {
    var time = Math.abs(this.get('last_modified') - this.get('start_date'));
    return fb.msToHMS(time);
  },
  getPosition: function() {
    return this.get('cards').where({complete: true}).length;
  },
  for_template: function() {
    var j = this.toJSON();
    j.getDuration = this.getDuration();
    return j;
  }
});

fb.collections.Workouts = Backbone.Collection.extend({
  model: fb.models.Workout,
  controller: fb.dbController,
  for_template: function() {
    return this.map(function(model){ return model.for_template(); });
  }
});


//My models
function Card( /*string*/ gridid, workoutSession) {

  /*properties*/
  var ws = this.workoutSession = workoutSession;
  this.sliding = false;
  this.startX = 0;
  this.offsetX = 0;
  this.posX = 0;
  this.diffX = 0;
  var template = fb.templateLoader.get('card');

  /*functions*/
  this.touchStart = function(e) {
    e.preventDefault();

    this.startX = e.targetTouches[0].clientX; //Record starting touch position
    this.jqElement.css({
      '-webkit-transition-duration': '0s' //make sure transition doesn't fire when dragging.  Setting to none on property didn't work, so setting seconds to 0
    });
    this.touchStartTime = new Date().getTime(); //record time started touch to calculate velocity
  };
  this.touchMove = function(e) {
    e.preventDefault();
    this.diffX = (e.targetTouches[0].clientX - this.startX); //Distance between starting position and current touch position         
    var styleStr = "translate3d(" + this.diffX + "px, 0px, 0px) scale(1)"; //create transform to move

    this.domElement.style.webkitTransform = this.domElement.style.transform = styleStr; //apply transform
  };

  this.touchEnd = function(e) {
    this.posX = this.diffX + this.posX; //save new starting position
    var slideTime = (new Date().getTime() - this.touchStartTime);
    var velX = this.diffX / slideTime;
    this.diffX = 0; //reset difference for next touch event
    if (Math.abs(velX) > 1) {
      //snd.play();
      //slide right
      if (velX > 1) {
        this.jqElement.css({
          'webkitTransform': 'translate3d(150%, 0px, 0px) scale(1)',
          '-webkit-transition-property': 'webkitTransform',
          '-webkit-transition-duration': '.25s',
          '-webkit-transition-timing-function': 'ease-out'
        });
      } else { //slide left
        this.jqElement.css({
          'webkitTransform': 'translate3d(-150%, 0px, 0px) scale(1)',
          '-webkit-transition-property': 'webkitTransform',
          '-webkit-transition-duration': '.25s',
          '-webkit-transition-timing-function': 'ease-out'
        });
      }
      setTimeout(function() {
        ws.Next(false);
      }, 250);
    } else {
      //add transition to send it back
      this.jqElement.css({
        'webkitTransform': 'translate3d(0px, 0px, 0px) scale(1)',
        '-webkit-transition-property': 'webkitTransform',
        '-webkit-transition-duration': '.5s'
      });
    }

  };

  this.render = function($container, position) {
    $container.append(template(ws.cardDeck[position]));
    this.jqElement = $("#" + gridid);
    this.domElement = document.getElementById(gridid);
    this.flipControl = $("#" + gridid + " .action");
    this.jqElement.css("z-index", 100 - position);

  };

  this.enableEvents = function() {

    //Binding
    var thisCard = this; //local variable so not to lose binding on calls
    this.domElement.addEventListener('touchstart', function(e) {
      thisCard.touchStart(e);
    }, false);
    this.domElement.addEventListener('touchmove', function(e) {
      thisCard.touchMove(e);
    }, false);
    this.domElement.addEventListener('touchend', function(e) {
      thisCard.touchEnd(e);
    }, false);
    this.flipControl.bind('touchstart', function() {
      $(this).parent().parent().toggleClass('flip');
    });

  };

  this.disableEvents = function() {
    this.jqElement.off();
    this.flipControl.off();
  };

  this.remove = function() {
    this.disableEvents();
    this.jqElement.remove();
  };

}

// function Timer() {

//   var timer = this;
//   var jqElement = this.jqElement = $("#timer");
//   this.totalElapsed = 0;
//   var timerID = 0; //outside variable so I can start/stop Interval within functions
//   this.storedTime = 0; //store banked time in case of pause/resume
//   var start = null;
//   var delay = 100;

//   this.Start = function() {
//     start = new Date();
//     timerID = window.setInterval(function() {
//       timer.UpdateTime();
//     }, delay);
//     $('#pause').show();
//   }

//   this.Pause = function() {
//     this.storedTime = this.totalElapsed;
//     //clear the inteval
//     clearInterval(timerID);
//     $('#pause').hide();
//     $('#resume').show();
//   }

//   this.Resume = function() {
//     //start interval again on UpdateTime
//     start = new Date();
//     timerID = window.setInterval(function() {
//       timer.UpdateTime();
//     }, delay);
//     $('#pause').show();
//     $('#resume').hide();
//   }

//   this.UpdateTime = function() {

//     var time = new Date().getTime() - start.getTime();
//     //NEED TO IMPLEMENT.  IF diff greater than say 2 seconds, then pause

//     //store total elapse in miliseconds
//     this.totalElapsed = (Math.floor(time)) + parseFloat(this.storedTime);
//     //jqElement.html(secondsToHms(this.totalElapsed));
//     jqElement.html(this.timeToHMS(this.totalElapsed));

//     if (this.totalElapsed > 9999) timer.Pause();
//   }

//   this.Reset = function() {
//     //clear the inteval
//     clearInterval(timerID);

//     //reset Stored Time
//     this.storedTime = 0;
//     this.totalElapsed = 0;
//     start = null;

//     $('#pause').hide();
//     $('#resume').hide();
//     $('#start').show();

//   }

//   this.timeToHMS = function(ms) {

//     function addZ(n) {
//       return (n<10? '0':'') + n;
//     }

//     var ms = s % 1000;
//     s = (s - ms) / 1000;
//     var secs = s % 60;
//     s = (s - secs) / 60;
//     var mins = s % 60;
//     var hrs = (s - mins) / 60;

//     return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
//   }

//   function secondsToHms(d) {
//     d = Number(d);
//     var h = Math.floor(d / 3600);
//     var m = Math.floor(d % 3600 / 60);
//     var s = Math.floor(d % 3600 % 60);
//     return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
//   }

// }