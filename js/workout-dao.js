(function(app) {

  'use strict';

  var workoutTable = app.client.getTable('workout');

  app.WorkoutDao = {

    db: app.dbController.db,

    // db transaction Success Handler Callback
    onSuccess: app.dbController.onSuccess,

    // db transaction Error Handler Callback
    onError: app.dbController.onError,

    //TODO:  Make all DAOs inherit from base db controller
    createGuid: app.dbController.createGuid,

    /* Ideal Steps
        1. Save Local
        2. Save Online
        3. Update SyncDate
        ?.  Should I just use syncUp?
        */
    insert: function(model, callback) {
      var that = this;
      var db = this.db;

      //create a GUID for the record.  Add to the model if transaction was successful
      var newGUID = that.createGuid();

      //Save locally with no syncDate.  Try to save online.  If success, update local.
      db.transaction(function(tx) {
        tx.executeSql('INSERT INTO workouts (id, userid, deckid, last_modified, duration, cards) VALUES (?,?,?,?,?,?)', [
            newGUID,
            model.get('userid'),
            model.get('deckid'),
            model.get('last_modified').toISOString(), //Need to convert all dates to ISO for SQLite
            model.get('duration'),
            JSON.stringify(model.get('cards'))
          ],
          function(tx, results) {
            model.set('id', newGUID);
            //enable for online mode
            that.insertOnline(model, callback);
          },
          that.onError
        );
      });
    },

    insertOnline: function(model, callback) {

      var that = this;
      console.log(JSON.stringify(model));
      //Try inserting online
      workoutTable.insert(JSON.stringify(model)).done(function(res) {
        //Success: Update local record with confirmed syncdate
        that.db.transaction(function(tx) {
          tx.executeSql('UPDATE workouts set syncDate = ? WHERE ID = ?', [
              res.__updatedAt.toISOString(),
              res.id
            ],
            function(tx, result) {
              console.log('Successfully updated workout ' + res.id + ': syncDate = ' + res.__updatedAt.toISOString());
              if (callback) callback(JSON.stringify(model));
            },
            that.onError
          );
        });

      }, function(error) {
        app.alert(JSON.parse(error.request.responseText).error);
      });

    },
    //TODO: Make syncdate available locally with new api.
    // Combine update statements to only sync online if last mod > syncdate
    update: function(model, callback) {
      var that = this;
      var db = this.db;

      //Save locally with no syncDate.  Try to save online.  If success, update local.
      db.transaction(function(tx) {
        tx.executeSql('UPDATE workouts set start_date=?, last_modified=?, duration=?, cards=? where id=?', [
            model.get('start_date').toISOString(), //Need to convert all dates to ISO for SQLite
            model.get('last_modified').toISOString(), //Need to convert all dates to ISO for SQLite
            model.get('duration'),
            JSON.stringify(model.get('cards')),
            model.get('id')
          ],
          function(tx, results) {
            console.log("updated" + results);
            //enable for online mode
            that.updateOnline(model, callback);
          },
          that.onError
        );
      });
    },
    updateLocal: function(workouts, callback) {
      var that = this;

      var deferred = $.Deferred();
      var db = this.db;
      db.transaction(
        function(tx) {
          var l = workouts.length;
          var sql =
            "INSERT OR REPLACE INTO workouts (id, userid, deckid, last_modified, duration, cards, syncDate) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)";
          var w;
          for (var i = 0; i < l; i++) {
            w = workouts[i];
            var params = [w.id, w.userid, w.deckid, w.last_modified.toISOString(), w.duration, JSON.stringify(w.cards), w.__updatedAt.toISOString()];
            tx.executeSql(sql, params);
          }
        },
        that.onError,
        function(tx) {
          if (callback) callback();
          deferred.resolve("success");
        }
      );

      return deferred;
    },

    updateOnline: function(model, callback) {

      var that = this;
      var modelJSON = null;


      //TODO  This needs to work with backbone models AND results from sqlite
      if (model instanceof Backbone.Model) {
        modelJSON = model.toJSON();
      } else {
        modelJSON = model;
      }

      //Try inserting online
      workoutTable.update({
        id: modelJSON.id,
        cards: JSON.stringify(modelJSON.cards),
        last_modified: modelJSON.last_modified,
        duration: modelJSON.duration
      }).done(function(res) {
        //Success: Update local record with confirmed syncdate
        that.db.transaction(function(tx) {
          tx.executeSql('UPDATE workouts set syncDate = ? WHERE ID = ?', [
              res.__updatedAt.toISOString(),
              res.id
            ],
            function(tx, result) {
              console.log('Successfully updated workout ' + res.id + ': syncDate = ' + res.__updatedAt.toISOString());
              if (callback) callback(JSON.stringify(model));
            },
            that.onError
          );
        });

      }, function(error) {
        app.alert(JSON.parse(error.request.responseText).error);
      });

    },

    find: function(model, callback) {

    },

    findAll: function(callback) {
      this.db.transaction(
        function(tx) {
          var sql = 'SELECT * FROM workouts';
          tx.executeSql(sql, [], function(tx, results) {
            var len = results.rows.length;
            var workouts = [];
            for (var i = 0; i < len; i++) {
              workouts[i] = results.rows.item(i);
            }
            callback(workouts);
          });
        },
        function(tx, error) {
          app.alert("Transaction Error: " + error);
        }
      );
    },

    getWorkouts: function() {

      workoutTable.read().done(
        function(results) {
          console.log(JSON.stringify(results));
        },
        function(error) {
          console.log(JSON.parse(error.request.responseText).error);
        });

    },

    getWorkoutsSince: function(date) {

      var that = this;
      //Convert to Deferred
      var deferred = $.Deferred();

      this.db.transaction(
        function(tx) {
          tx.executeSql('SELECT * FROM workouts WHERE last_modified > ?', [date],
            function(tx, results) {
              var len = results.rows.length;
              var workouts = [];
              for (var i = 0; i < len; i++) {
                workouts[i] = results.rows.item(i);
              }
              //Can I just return an array, or do I have to convert to JSON
              //callback(wines);
              //var jsonResults = that.resultsToJSON(results);
              //deferred.resolve(jsonResults);
              deferred.resolve(workouts);
            },
            function(tx, e) {
              console.log("my error:" + e);
              deferred.fail();
            }
          );
        }
      );
      return deferred;

    },

    resultsToJSON: function(resultset) {

      var results = [];
      for (var i = 0; i < resultset.rows.length; i++) {
        results[i] = resultset.rows.item(i);
      }

      return JSON.parse(JSON.stringify(results));

    },

    getLastSync: function() {

      var db = this.db;

      //Convert to Deferred
      var deferred = $.Deferred();

      db.transaction(function(tx) {
        //tx.executeSql('SELECT MAX(last_modified) FROM workouts',that.onError,that.onSuccess);
        tx.executeSql('SELECT MAX(syncDate) as syncDate FROM workouts', [],
          function(tx, results) {
            var lastSync = results.rows.item(0).syncDate;
            deferred.resolve(lastSync);
          },
          function(tx, e) {
            console.log('error:' + e);
            deferred.fail();
          });

      });
      return deferred;
    },
    getLastModifiedDate: function() {

      var db = this.db;

      //Convert to Deferred
      var deferred = $.Deferred();

      db.transaction(function(tx) {
        //tx.executeSql('SELECT MAX(last_modified) FROM workouts',that.onError,that.onSuccess);
        tx.executeSql('SELECT MAX(last_modified) as last_modified FROM workouts', [],
          function(tx, results) {
            debugger;
            var lastMod = results.rows.item(0).last_modified;
            deferred.resolve(lastMod);
          },
          function(tx, e) {
            console.log('error:' + e);
            deferred.fail();
          });

      });
      return deferred;
    },

    /* Sync Up
        1. Get Last Sync Date
        2. Grab Workouts Needing to Sync With Server
        3. Loop through, either updating or deleting (check if syncDate)
        4. Update local record
        */
    syncUp: function() {
      var that = this;
      this.getLastSync().then(function(lastSync) {
        return that.getWorkoutsSince(lastSync);
      }).done(function(results) {

        console.log(results);
        //Loop through, either updating or deleting
        for (var i = 0; i < results.length; i++) {

          //if no syncDate, insert.
          if (!results[i].syncDate) {

            //insert online?
            that.insertOnline(results[i]);

          } else {
            that.updateOnline(results[i]);
          }

        }

      });
    },
    syncDown: function(callback) {
      var that = this;

      var deferred = $.Deferred();

      //Get Local Last Modified Date
      var step1 = this.getLastModifiedDate();

      //Grab Online records I don't have locally
      var step2 = step1.then(function(lastMod) {
        return that.getWorkoutsOnlineSince(lastMod);
      });

      //Update those records locally
      var step3 = step2.then(function(workouts) {
        return that.updateLocal(workouts, callback);
      });

      //return success
      var step4 = step3.done(function(message) {
        deferred.resolve(message);
      });

      return deferred;

    },
    syncWorkouts: function(callback) {

      var that = this;
      this.syncDown().then(function(message) {
        that.syncUp();
      });

    },
    getWorkoutsOnlineSince: function(date) {

      var deferred = $.Deferred();
      //get workouts since the beginning of time if no date;
      if (!date) date = new Date(0).toISOString();

      //limited to 1000 rows max.
      //This may be a problem if someone has more than 3 years of historical data and are starting form scratch.
      workoutTable.take(1000).where(function(modDate) {
        return this.last_modified > modDate;
      }, date).read().done(
        function(results) {
          deferred.resolve(results);
        },
        function(error) {
          console.log(JSON.parse(error.request.responseText).error);
          deferred.fail();
        });
      return deferred;
    },
    getWorkoutStream: function() {

      // Best practice. http://blog.mediumequalsmessage.com/promise-deferred-objects-in-javascript-pt2-practical-use
      // Name each step
      // New step = previous step.then()
      // TODO: Refactor all other deferreds to follow this paradigm

      var deferred = $.Deferred();
      var step1 = fbWrapper.getAppFriends();
      var step2 = step1.then(function(friends) {
        //convert friends array to array of only ids
        var ids = friends.map(function(x) {
          return x.uid;
        });
        return ids;
      });
      var step3 = step2.done(function(friendIds) {
        //take the array of ids and pull from server
        // http://stackoverflow.com/questions/15464832/how-to-query-rows-where-id-in-some-array-of-numbers-in-azure-mobile-services
        workoutTable.where(function(arr) {
          return this.userid in arr;
        }, friendIds).read().done(
          function(results) {
            //Turn result into collection
            var workouts = new app.collections.Workouts(results);
            console.log(JSON.stringify(workouts.for_template()));
            deferred.resolve(workouts.for_template());
          },
          function(error) {
            console.log(JSON.parse(error.request.responseText).error);
            deferred.fail();
          });
      });
      return deferred;
    }
  };

})(fb);