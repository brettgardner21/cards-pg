/*globals fb*/
function WorkoutSession(cardDeck, workout) {

  var template = fb.templateLoader.get('card');
  var ws = this;
  var timer = new Timer(workout);
  this.cardDeck = null;
  this.cards = [];
  this.currentCard = 0;
  this.previousCard = 0;
  this.nextCard = 1;

  //var container = $('#canvas');
  var $modal = $('#pause-modal');
  var $start = $('#start');
  var $pause = $('#pause');
  var $resume = $('#resume');
  var $previous = $('#previous');
  var $next = $('#next');
  var $back = $('#back');
  var $exit = $('#exit');


  //Methods
  this.initialize = function() {

    $start.click(function(e) {
      e.preventDefault();
      //setup sound effects
      //snd.load();
      //Start Workout Session
      ws.Start();
    });
    $pause.click(function() {
      ws.Pause();
    });
    $resume.click(function() {
      ws.Resume();
    });
    $previous.click(function(e) {
      e.preventDefault();
      ws.Previous();
    });
    $next.click(function(e) {
      e.preventDefault();
      ws.Next();
    });
    $exit.click(function(e) {
      e.preventDefault();
      ws.Exit();
    });


    //Has started, need to resume.
    if (workout.get('start_date')) {
      $start.hide();
      $back.hide(); //hiding back button for now to prevent navigating away with an active timer
      ws.Pause();
      this.RenderDeck();
    } else {
      $pause.hide();
    }

  };

  this.LoadCards = function() {
    $.ajax({
      url: 'decks/deck1.json',
      dataType: 'json',
      success: function(result) {
        ws.cardDeck = result;
      },
      error: function(request, textStatus, errorThrown) {
        alert(textStatus);
      }
    });
  };

  // //TODO: create proper function
  // if (workout) {
  //     ws.cards = workout.get('cards');
  // } else {
  //     this.LoadCards();
  // }

  this.Start = function() {

    //Shuffle Deck - Removing for now.  Moving shuffle to when workout is generated.
    //ws.Shuffle();

    //Create array of Card Objects from Data Source. Enable top
    // for (i = 0; i < ws.cardDeck.length; i++) {
    //     var c = new Card(ws.cardDeck[i].cardId, ws);
    //     ws.cards.push(c);
    // }
    $pause.show();

    //Create Views and Render top 2 Cards
    this.RenderDeck();

    //Record Start Date and Start the Timer
    workout.set('start_date', new Date());
    workout.set('last_modified', new Date());

    timer.Start();
    console.log(ws.previousCard + " " + ws.currentCard + " " + ws.nextCard);

  };

  this.RenderDeck = function() {

    //Get Current Position based on last completed and set working positions
    var currentPosition = workout.getPosition();
    this.currentCard = currentPosition;
    this.previousCard = (currentPosition > 0) ? currentPosition - 1 : currentPosition;
    this.nextCard = currentPosition + 1;


    //Create an array of Card Views
    workout.get('cards').forEach(function(model) {
      //new card view
      var view = new fb.views.Card({
        template: fb.templateLoader.get('card2'),
        model: model,
        workout: ws
      });
      ws.cards.push(view);
    });

    //only render the first 2 cards for performance 
    for (var i = 0; i < 2; i++) {

      var marker = currentPosition + i;

      if (marker < ws.cards.length) {
        //Render
        ws.cards[marker].render();
        if (i !== 0) ws.cards[marker].disableEvents(); //disable all but top card
      }
      // switch (i) {
      //   case 0:
      //     //ws.cards[i].enableEvents();
      //     break;
      //   case 1:

      //     break;
      // }
    }

  };

  this.Pause = function() {
    timer.Pause();
    $modal.toggleClass('active');
  };

  this.Resume = function() {
    timer.Resume();
    $modal.toggleClass('active');
  };

  this.Clear = function() {

    //reset the timer
    timer.Reset();

    //Remove all existing cards
    $("#" + ws.cardDeck[ws.nextCard].cardId).remove();
    $("#" + ws.cardDeck[ws.currentCard].cardId).remove();

  };

  this.Next = function(isForwardButton) {

    console.log('next');

    //1. Remove discarded card (allowing for animation to complete)
    ws.cards[ws.currentCard].model.set("complete", true);
    ws.cards[ws.currentCard].destroy_view();

    //2. Update last modified and duration from the timer
    workout.set('last_modified', new Date());
    //workout.set('duration',timer.totalElapsed);
    workout.save();

    //3. Update position
    ws.previousCard = ws.currentCard;
    ws.currentCard++;
    ws.nextCard = ws.currentCard + 1;

    //4.Check if last card - If yes, initiate finish
    if (ws.currentCard == ws.cards.length) {
      console.log("done");
      ws.Pause();
      $modal.find('.title').html('Workout Complete');
      $modal.find('.content').prepend('<p>Great Workout. Grab a drink. Your time was</p>');
      $resume.hide();
      $previous.hide();
      return;
    }

    //enable events on current card
    ws.cards[ws.currentCard].enableEvents();
    console.log(ws.previousCard + " " + ws.currentCard + " " + ws.nextCard);

    //If next card is within the deck, render it.
    if (ws.nextCard < ws.cards.length) {
      //Render below current card, with events disabled
      ws.cards[ws.nextCard].render();
      ws.cards[ws.nextCard].disableEvents();
    }
  };

  this.Previous = function() {

    console.log('previous');
    //update card position
    if (ws.currentCard > 0) {
      //Remove Bottom Card if there is one
      if (ws.cards[ws.nextCard]) ws.cards[ws.nextCard].destroy_view();

      //update deck position
      ws.nextCard = ws.currentCard;
      ws.currentCard = ws.previousCard;
      ws.previousCard = (ws.currentCard === 0) ? ws.currentCard : ws.currentCard - 1;

      //Disable Events on Bottom Card
      if (ws.cards[ws.nextCard]) ws.cards[ws.nextCard].disableEvents();

      //Add currentCard back on top and delegate events
      ws.cards[ws.currentCard].render();
      ws.cards[ws.currentCard].enableEvents();

    } else {
      alert('no previous');
    }
    console.log(ws.previousCard + " " + ws.currentCard + " " + ws.nextCard);

  };
  this.Exit = function() {

    //destroy all views.
    ws.cards.forEach(function(view) {
      view.destroy_view();
    });
    //go back to deck screen
    window.history.back();
    return false;
  };

  this.Shuffle = function() {
    shuffle(ws.cardDeck);
  };

  this.initialize();

}

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

function Timer(workout) {

  var timer = this;
  var jqElement = this.jqElement = $("#timer");
  this.totalElapsed = ((workout.get('duration')) ? workout.get('duration') : 0);
  this.storedTime = this.totalElapsed;
  var timerID = 0; //outside variable so I can start/stop Interval within functions
  var start = null;
  var delay = 100;

  this.Start = function() {
    start = new Date();
    timerID = window.setInterval(function() {
      timer.UpdateTime();
    }, delay);
  };

  this.Pause = function() {
    this.storedTime = this.totalElapsed;
    //clear the inteval
    clearInterval(timerID);
    //$('#pause').hide();
    //$('#resume').show();

  };

  this.Resume = function() {
    //start interval again on UpdateTime
    start = new Date();
    timerID = window.setInterval(function() {
      timer.UpdateTime();
    }, delay);
    //$('#pause').show();
    //$('#resume').hide();
  };

  this.UpdateTime = function() {

    var time = new Date().getTime() - start.getTime();
    //NEED TO IMPLEMENT.  IF diff greater than say 2 seconds, then pause
    this.totalElapsed = (Math.floor(time)) + parseFloat(this.storedTime);

    //update display
    jqElement.html(fb.msToHMS(this.totalElapsed));

    workout.set('duration', this.totalElapsed);
    workout.set('last_modified', new Date());

    if (this.totalElapsed > 99999) timer.Pause();
  };

  this.Reset = function() {
    //clear the inteval
    clearInterval(timerID);

    //reset Stored Time
    this.storedTime = 0;
    this.totalElapsed = 0;
    start = null;

    $('#pause').hide();
    //$('#resume').hide();
    $('#start').show();

  };

  function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
  };


}