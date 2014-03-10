function WorkoutSession(cardDeck,workout){
    
    $('#pause').hide();
    $('#resume').hide();
    var template = fb.templateLoader.get('card');
    var ws = this;
    var timer = new Timer();
    this.cardDeck = null;
    this.cards = [];
    this.currentCard = 0;
    this.previousCard = 0;
    this.nextCard = 1;
    this.bottomCard = null;
    var container = $(".content");

    /*functions*/
    this.LoadCards = function(){
       $.ajax({
          url: 'decks/deck1.json',
          dataType: 'json',
          success: function(result){
            ws.cardDeck = result;
          },
          error: function(request, textStatus, errorThrown) {
            alert(textStatus);
          }
        }); 
    }

    //TODO: create proper function
    if(workout){
        ws.cardDeck = workout.cards;
    }else{
        this.LoadCards();
    }

    this.Start = function() {
        
        //Shuffle Deck - Removing for now.  Moving shuffle to when workout is generated.
        //ws.Shuffle();

        //Create array of Card Objects from Data Source. Enable top
        for(i=0;i<ws.cardDeck.length;i++){
          var c = new Card(ws.cardDeck[i].cardId,ws);
          ws.cards.push(c);
        }

        //only render the first 2 cards for performance 
        for(i=0;i<2;i++){
            //Render
            ws.cards[i].render(container,i);
            
            switch(i) {
                case 0:
                    ws.cards[i].enableEvents();
                    break;
                case 1:
                    ws.bottomCard = ws.cards[i];
                    break;
            }
        }
        
        //Start the Timer
        timer.Start();

        console.log(ws.previousCard + " " + ws.currentCard + " " + ws.nextCard);    
              
    }
    
    this.Pause = function(){
        timer.Pause();
    }
    
    this.Resume = function() {
        timer.Resume();
    }
    
    this.Clear = function(){
    
        //reset the timer
        timer.Reset();
        
        //Remove all existing cards
        $("#" + ws.cardDeck[ws.nextCard].cardId).remove();
        $("#" + ws.cardDeck[ws.currentCard].cardId).remove();
        
    }
    
    this.Next = function(isForwardButton) {


        //1. Remove discarded card (allowing for animation to complete)
        ws.cards[ws.currentCard].remove();

        //2. Update position
        ws.previousCard = ws.currentCard;
        ws.currentCard++;
        ws.nextCard = ws.currentCard+1;

        //2.Check if last card - If yes, initiate finish
        if(ws.currentCard == ws.cards.length) {
            console.log("done");
            ws.Pause();
            alert("Great Workout. Grab a drink.  Your time was " + timer.totalElapsed + " seconds.");
            return;
        }

        //enable events on current card
        ws.cards[ws.currentCard].enableEvents();
        console.log(ws.previousCard + " " + ws.currentCard + " " + ws.nextCard);

        //If next card is within the deck, render it.
        if(ws.nextCard < ws.cardDeck.length)
        {
            //Render below current card (container, position)
            ws.cards[ws.nextCard].render(container, ws.nextCard);    
        }
    }
    
    this.Previous = function() {


        //update card position
        if(ws.currentCard >0) {
            //Remove Bottom Card if there is one
            if(ws.cards[ws.nextCard]) ws.cards[ws.nextCard].remove();

            //update deck position
            ws.nextCard = ws.currentCard;
            ws.currentCard = ws.previousCard;
            ws.previousCard = ws.currentCard-1;

            //Add currentCard back on top and enable events
            ws.cards[ws.currentCard].render(container,ws.currentCard);
            ws.cards[ws.currentCard].enableEvents();

            //Disable Events on Bottom Card
            if(ws.cards[ws.nextCard])ws.cards[ws.nextCard].disableEvents();   
        }else{
            alert('no previous');
        }
        console.log(ws.previousCard + " " + ws.currentCard + " " + ws.nextCard);

    }

    this.Shuffle = function() {
        shuffle(ws.cardDeck);
    }
    

    $('#start').click(function(e){
        e.preventDefault();
        //setup sound effects
        //snd.load();
        //Start Workout Session
        ws.Start();     
    });
    $('#pause').click(function(){
        ws.Pause();
    });
    $('#resume').click(function(){
        ws.Resume();
    });
    $('#previous').click(function(e){
        e.preventDefault();
        ws.Previous();
    });
    $('#next').click(function(e){
        e.preventDefault();
        ws.Next();
    });    

    
}

function Card(/*string*/ gridid, workoutSession) {

    /*properties*/
    var ws = this.workoutSession = workoutSession;
    this.sliding = false;
    this.startX = 0;
    this.offsetX = 0;
    this.posX = 0;
    this.diffX = 0;
    var template = fb.templateLoader.get('card');     
    
    /*functions*/
    this.touchStart = function(e){
        e.preventDefault();
        
        this.startX = e.targetTouches[0].clientX; //Record starting touch position
        this.jqElement.css({
            '-webkit-transition-duration':'0s' //make sure transition doesn't fire when dragging.  Setting to none on property didn't work, so setting seconds to 0
        });
        this.touchStartTime = new Date().getTime(); //record time started touch to calculate velocity
    };
    this.touchMove = function(e){
        e.preventDefault();
        this.diffX = (e.targetTouches[0].clientX - this.startX); //Distance between starting position and current touch position         
        var styleStr = "translate3d("+this.diffX+"px, 0px, 0px) scale(1)"; //create transform to move
     
         this.domElement.style.webkitTransform  = this.domElement.style.transform = styleStr; //apply transform
    };
    
    this.touchEnd = function(e){
        this.posX = this.diffX + this.posX; //save new starting position
        var slideTime = (new Date().getTime() - this.touchStartTime);
        var velX = this.diffX/slideTime;
        this.diffX = 0; //reset difference for next touch event
        if(Math.abs(velX) > 1){
            //snd.play();
            //slide right
            if(velX >1){
                this.jqElement.css({
                    'webkitTransform':'translate3d(150%, 0px, 0px) scale(1)',
                    '-webkit-transition-property':'webkitTransform',
                    '-webkit-transition-duration':'.25s',
                    '-webkit-transition-timing-function': 'ease-out'
                });
            }else{ //slide left
                this.jqElement.css({
                    'webkitTransform':'translate3d(-150%, 0px, 0px) scale(1)',
                    '-webkit-transition-property':'webkitTransform',
                    '-webkit-transition-duration':'.25s',
                    '-webkit-transition-timing-function': 'ease-out'
                });
            }
            setTimeout(function() {ws.Next(false);},250);
        }else{
            //add transition to send it back
            this.jqElement.css({
                'webkitTransform':'translate3d(0px, 0px, 0px) scale(1)',
                '-webkit-transition-property':'webkitTransform',
                '-webkit-transition-duration':'.5s'
            });
        }
        
    };

    this.render = function($container, position) {
      $container.append(template(ws.cardDeck[position]));
      this.jqElement = $("#" + gridid);
      this.domElement = document.getElementById(gridid);
      this.flipControl = $("#" + gridid + " .action");   
      this.jqElement.css("z-index",100-position);

    };

    this.enableEvents = function(){

      //Binding
      var thisCard = this; //local variable so not to lose binding on calls
      this.domElement.addEventListener('touchstart', function(e) {thisCard.touchStart(e);}, false);
      this.domElement.addEventListener('touchmove', function(e) {thisCard.touchMove(e);}, false);
      this.domElement.addEventListener('touchend', function(e) {thisCard.touchEnd(e);}, false);
      this.flipControl.bind('touchstart',function(){
          $(this).parent().parent().toggleClass('flip');
      });

    };

    this.disableEvents = function(){
      this.jqElement.off();
      this.flipControl.off();
    };

    this.remove = function() {
        this.disableEvents();
        this.jqElement.remove();
    };
    
}
    
function Timer(){
    
    var timer = this;
    var jqElement = this.jqElement = $("#timer");
    this.totalElapsed = 0;
    var timerID = 0; //outside variable so I can start/stop Interval within functions
    this.storedTime = 0; //store banked time in case of pause/resume
    var start = null;
    var delay = 250;
    
    this.Start = function(){
        start = new Date();
        timerID = window.setInterval(function(){timer.UpdateTime();}, delay);
        $('#pause').show();
    }
    
    this.Pause = function(){
        this.storedTime = this.totalElapsed;
        //clear the inteval
        clearInterval(timerID);
        $('#pause').hide();
        $('#resume').show();
    }
    
    this.Resume = function(){
        //start interval again on UpdateTime
        start = new Date();
        timerID = window.setInterval(function(){timer.UpdateTime();}, delay);
        $('#pause').show();
        $('#resume').hide();
    }
    
    this.UpdateTime = function(){
    
        var time = new Date().getTime() - start.getTime();
        //NEED TO IMPLEMENT.  IF diff greater than say 2 seconds, then pause
        this.totalElapsed = (Math.floor(time / 1000)) + parseFloat(this.storedTime); 
        jqElement.html(secondsToHms(this.totalElapsed));
        
        if(this.totalElapsed>99.9) timer.Pause();
    }
    
    this.Reset = function(){
        //clear the inteval
        clearInterval(timerID);
        
        //reset Stored Time
        this.storedTime = 0;
        this.totalElapsed = 0;
        start = null;
        
        $('#pause').hide();
        $('#resume').hide();
        $('#start').show();
        
    }
    
    function secondsToHms(d) {
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);
        return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
    }
            
}
    