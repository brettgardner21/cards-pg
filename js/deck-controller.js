(function(app) {
    'use strict';

    var decks = {};

    app.DeckController = {

        fetchedDecks: null,
        
        getDecks: function() {
            if(this.fetchedDecks) return this.fetchedDecks;

            var that = this;

            var deferred = $.Deferred();

            //Stub to get local deck now.  Need to change to hit local db table of purchases, or check online
            $.when(this.getDeck(1)).done(function(data){
                var decks = [];
                decks.push(data);
                that.fetchedDecks = decks;
                deferred.resolve(decks);
            });

            return deferred;

            //Parse Code:  Taking Out for Now
            // var query = new Parse.Query(app.models.Deck);
            // var call = parseWrapper.find(query);
            
            // $.when(call).done(function(callresp){
            //     that.fetchedDecks = callresp;
            // });

            // return call;
        },

        getDeck: function(id) {

            // //fakedeck for offline testing
            // var deferred = $.Deferred();
            // var deck  = new fb.models.Deck;
            // deck.name="test deck";
            // deck.description="test description";
            // deck.objectId=id;
            // var decks=[];
            // decks.push(deck);
            // deferred.resolve(decks);
            // return deferred;

            var deferred = $.Deferred();

            var that = this;
            var call = $.ajax({
              url: 'decks/deck' + id + '.json',
              dataType: 'json'
            })
            .done(function(result) {
              //shuffle the cards
              //var cards = that._shuffleCards(result);
              deferred.resolve(result);
            })
            .fail(function(request, textStatus, errorThrown) {
              alert(textStatus);
            });
            return deferred;

            // //TODO:  get in memory deck if we have it
            // if(this.fetchedDecks){
            //     var deckArray = [];  //Matching the parse signature, so add to array
            //     var deck = _.find(this.fetchedDecks, function(deck){ return deck.objectId === id });
            //     if (deck) {
            //         deckArray.push(deck);
            //         return deckArray;
            //     }

            // }

            // var query = new Parse.Query(fb.models.Deck);
            // query.equalTo("objectId", id);
            // var call = parseWrapper.find(query);

            // return call;

        }

        
    }

})(fb);
