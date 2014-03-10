(function(app) {

  'use strict';

  /*Azure Mobile Services Test */
  var client = new WindowsAzure.MobileServiceClient(
    'https://cardsworkout.azure-mobile.net/',
    'qlIVvwDtVnqyEMnVKMtfIRVrSysAow55'
  );

  var workoutTable = client.getTable('workout');

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

    updateOnline: function(model, callback) {

      var that = this;
      var modelJSON = null;


      //TODO  This needs to work with backbone models AND results from sqlite
      if(model instanceof Backbone.Model){
        modelJSON = model.toJSON();
      }else{
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
      // var that = this;
      // debugger;
      // this.db.transaction(
      //       function(tx) {
      //           var sql = 'SELECT (last_modified) as syncDate FROM workouts';
      //           tx.executeSql(sql,that.onError,
      //               function(tx, results) {
      //                 console.log(results);
      //                   var lastSync = results.rows.item(0).syncDate;
      //                   callback(lastSync.toString());
      //               }
      //           );
      //       }
      //   );
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

            // console.log(JSON.stringify(results[i]));
            // workoutTable.insert(JSON.stringify(results[i])).done(function(res) {
            //   console.log(JSON.stringify(res));
            //   //update local record with confirmed syncdate
            //   that.db.transaction(function(tx) {
            //     tx.executeSql('UPDATE workouts set syncDate = ? WHERE ID = ?', [
            //         res.__updatedAt,
            //         res.id
            //       ],
            //       that.onSuccess,
            //       that.onError
            //     );
            //   });

            // }, function(error) {
            //   app.alert(JSON.parse(error.request.responseText).error);
            // });

          } else {
            that.updateOnline(results[i]);
          }

        }

      });
    },
    syncDown: function(callback) {
      var that = this;
      this.getLastSync().then(function(lastSync) {
        workoutTable.read().then(function(workouts) {
          console.log(workouts);
        });

      });

    }
  }

  app.WorkoutDao.syncDown();


})(fb);