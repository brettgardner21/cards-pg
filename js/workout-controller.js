(function(app) {
  'use strict';

  app.WorkoutController = {

    currentWorkout: null,

    createWorkout: function(deckId) {
      var that = this;
      //Fake it for now
      var deferred = $.Deferred();

      //Create Model
      var workout = new app.models.Workout();

      //Generate Cards for workout
      $.when(this._loadDeck(deckId)).done(function(deck) {

        var cardcollection = new app.collections.WorkoutCards(deck.cards);

        //shuffle collection
        cardcollection.reset(cardcollection.shuffle(), {
          silent: true
        });

        //Store position on workout card to preserve sort order just in case.
        cardcollection.forEach(function(card) {
          card.set('position', cardcollection.indexOf(card));
          return card;
        });


        workout.set('cards', cardcollection);

        that.currentWorkout = workout;

        deferred.resolve(workout);

      });

      return deferred;

    },

    //Grabs the cards from the stored json file
    _loadDeck: function(deckId) {
      var that = this;
      var call = $.ajax({
          url: 'decks/deck1.json',
          dataType: 'json'
        })

        .done(function(result) {
          //shuffle the cards
          //var cards = that._shuffleCards(result);
          console.log(result);
        })
        .fail(function(request, textStatus, errorThrown) {
          alert(textStatus);
        });
      return call;
    },
    
    //no need for this.  User _ shuffle
    _shuffleCards: function(array) {
      var tmp, current, top = array.length;

      if (top)
        while (--top) {
          current = Math.floor(Math.random() * (top + 1));
          tmp = array[current];
          array[current] = array[top];
          array[top] = tmp;
        }

      return array;
    },

    _generateCards: function(deckId) {
      return this._loadCards(deckId);
    },

    getWorkouts: function() {

    },

    getWorkout: function(id) {

      //Check if id matches current workout
      if (this.currentWorkout && this.currentWorkout.id === id) {
        return this.currentWorkout;
      }

      //Get workout by Id
      var workout = new Workout({id: id});
      this.currentWorkout = workout.fetch();
      return this.currentWorkout;

    }


  }

})(fb);