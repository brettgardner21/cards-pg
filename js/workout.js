
//Card Array
var cards = [
  { cardId: "card0",suit:"hearts",face:"2"},
  { cardId: "card1",suit:"hearts",face:"3"},
  { cardId: "card2",suit:"hearts",face:"4"},
  { cardId: "card3",suit:"hearts",face:"5"},
  { cardId: "card4",suit:"hearts",face:"6"},
  { cardId: "card5",suit:"hearts",face:"7"},
  { cardId: "card6",suit:"hearts",face:"8"},
  { cardId: "card7",suit:"hearts",face:"9"},
  { cardId: "card8",suit:"hearts",face:"10"},
  { cardId: "card9",suit:"hearts",face:"J"},
  { cardId: "card10",suit:"hearts",face:"Q"},
  { cardId: "card11",suit:"hearts",face:"K"},
  { cardId: "card12",suit:"hearts",face:"A"},
  { cardId: "card13",suit:"clubs",face:"2"},
  { cardId: "card14",suit:"clubs",face:"3"},
  { cardId: "card15",suit:"clubs",face:"4"},
  { cardId: "card16",suit:"clubs",face:"5"},
  { cardId: "card17",suit:"clubs",face:"6"},
  { cardId: "card18",suit:"clubs",face:"7"},
  { cardId: "card19",suit:"clubs",face:"8"},
  { cardId: "card20",suit:"clubs",face:"9"},
  { cardId: "card21",suit:"clubs",face:"10"},
  { cardId: "card22",suit:"clubs",face:"J"},
  { cardId: "card23",suit:"clubs",face:"Q"},
  { cardId: "card24",suit:"clubs",face:"K"},
  { cardId: "card25",suit:"clubs",face:"A"},
  { cardId: "card26",suit:"diamonds",face:"2"},
  { cardId: "card27",suit:"diamonds",face:"3"},
  { cardId: "card28",suit:"diamonds",face:"4"},
  { cardId: "card29",suit:"diamonds",face:"5"},
  { cardId: "card30",suit:"diamonds",face:"6"},
  { cardId: "card31",suit:"diamonds",face:"7"},
  { cardId: "card32",suit:"diamonds",face:"8"},
  { cardId: "card33",suit:"diamonds",face:"9"},
  { cardId: "card34",suit:"diamonds",face:"10"},
  { cardId: "card35",suit:"diamonds",face:"J"},
  { cardId: "card36",suit:"diamonds",face:"Q"},
  { cardId: "card37",suit:"diamonds",face:"K"},
  { cardId: "card38",suit:"diamonds",face:"A"},
  { cardId: "card39",suit:"spades",face:"2"},
  { cardId: "card40",suit:"spades",face:"3"},
  { cardId: "card41",suit:"spades",face:"4"},
  { cardId: "card42",suit:"spades",face:"5"},
  { cardId: "card43",suit:"spades",face:"6"},
  { cardId: "card44",suit:"spades",face:"7"},
  { cardId: "card45",suit:"spades",face:"8"},
  { cardId: "card46",suit:"spades",face:"9"},
  { cardId: "card47",suit:"spades",face:"10"},
  { cardId: "card48",suit:"spades",face:"J"},
  { cardId: "card49",suit:"spades",face:"Q"},
  { cardId: "card50",suit:"spades",face:"K"},
  { cardId: "card51",suit:"spades",face:"A"},
  { cardId: "card52",suit:"joker",face:"J"},
  { cardId: "card53",suit:"joker",face:"J"}   
];

function WorkoutSession(cardDeck){
    
    $('#pause').hide();
    $('#resume').hide();
    var ws = this;
    var timer = new Timer();
    this.cardDeck = cardDeck;
    this.currentCard = 0;
    this.previousCard = 0;
    this.nextCard = 1;
    /*functions*/
    
    this.Start = function() {
        
        //Shuffle Deck
        ws.Shuffle();
        //Add the first 2 cards
        for(i=0;i<2;i++){
            //Apply template
            $("#cardTemplate").tmpl(ws.cardDeck[i]).appendTo(".content");
            $("#" + ws.cardDeck[i].cardId).css("z-index",100-i);
            //Make new card
            var c = new Card(ws.cardDeck[i].cardId,ws);
        }
        
        //Start the Timer
        timer.Start();          
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

        //delete previous card (allowing for animation to complete)
        //update currentCard
        ws.previousCard = ws.currentCard;
        ws.currentCard++;
        ws.nextCard = ws.currentCard+1;
        
        //Remove discarded card
        $("#" + ws.cardDeck[ws.previousCard].cardId).remove();
        
        //Add next card underneath deck
        $("#cardTemplate").tmpl(ws.cardDeck[ws.nextCard]).appendTo(".content");
        $("#" + ws.cardDeck[ws.nextCard].cardId).css("z-index",100-(ws.nextCard));
        
        //Make new card object
        var c = new Card(ws.cardDeck[ws.nextCard].cardId,ws);
        
    }
    
    this.Previous = function() {
        //delete the bottom card and load previous on top
        ws.nextCard = ws.currentCard;
        ws.currentCard = ws.previousCard;
        if(ws.currentCard >0) ws.previousCard = ws.currentCard-1;
        
        //Add currentCard back on top
        $("#cardTemplate").tmpl(ws.cardDeck[ws.currentCard]).appendTo(".content");
        $("#" + ws.cardDeck[ws.currentCard].cardId).css("z-index",100-(ws.currentCard));
        
        //Make new card object
        var c = new Card(ws.cardDeck[ws.currentCard].cardId,ws);
        
        //Remove bottom card
        $("#" + ws.cardDeck[ws.nextCard+1].cardId).remove();
        
    }

    this.Shuffle = function() {
        shuffle(ws.cardDeck);
    }
    function shuffle(array) {
        var tmp, current, top = array.length;

        if(top) while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }

        return array;
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
    
}

function Card(/*string*/ gridid, workoutSession) {

    /*properties*/
    var ws = this.workoutSession = workoutSession;
    this.sliding = false;
    this.startX = 0;
    this.offsetX = 0;
    this.posX = 0;
    this.diffX = 0;
    //this.label = $("#offset1");
    this.domElement = document.getElementById(gridid);
    this.jqElement = $("#" + gridid);
    this.flipControl = $("#" + gridid + " .action");        
    
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
            snd.play();
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
    
    //Binding
    var thisCard = this; //local variable so not to lose binding on calls
    this.domElement.addEventListener('touchstart', function(e) {thisCard.touchStart(e);}, false);
    this.domElement.addEventListener('touchmove', function(e) {thisCard.touchMove(e);}, false);
    this.domElement.addEventListener('touchend', function(e) {thisCard.touchEnd(e);}, false);
    this.flipControl.bind('touchstart',function(){
        $(this).parent().parent().toggleClass('flip');
    });
}
    
function Timer(){
    
    var timer = this;
    var jqElement = this.jqElement = $("#timer");
    var totalElapsed = 0;
    var timerID = 0; //outside variable so I can start/stop Interval within functions
    var storedTime = 0; //store banked time in case of pause/resume
    var start = null;
    var delay = 250;
    
    this.Start = function(){
        start = new Date();
        timerID = window.setInterval(function(){timer.UpdateTime();}, delay);
        $('#pause').show();
    }
    
    this.Pause = function(){
        storedTime = totalElapsed;
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
        totalElapsed = (Math.floor(time / 1000)) + parseFloat(storedTime); 
        jqElement.html(secondsToHms(totalElapsed));
        
        if(totalElapsed>99.9) timer.Pause();
    }
    
    this.Reset = function(){
        //clear the inteval
        clearInterval(timerID);
        
        //reset Stored Time
        storedTime = 0;
        totalElapsed = 0;
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
    