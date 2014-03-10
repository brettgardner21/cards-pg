(function(app) {

  'use strict';

  /*Azure Mobile Services Test */
  var client = new WindowsAzure.MobileServiceClient(
    'https://cardsworkout.azure-mobile.net/',
    'qlIVvwDtVnqyEMnVKMtfIRVrSysAow55'
  );
  var workoutTable = client.getTable('workout');

  app.dbController = {

    db: null,

    // open or create a new DB to store offline card data
    openDB: function() {

      var dbSize = 2 * 1024 * 1024; // Default DB size.  2 MB sound good?

      try {
        this.db = window.openDatabase('cards', '', 'Cards Database', dbSize);
        console.log(this.db.version); // For example, "1.0"
      } catch (e) {
        alert('Error ' + e + '.');
        return;
      }
      console.log('Success: Database is: ' + this.db);

    },

    // db transaction Success Handler Callback
    onSuccess: function(tx) {
      console.log('Success: THis is a call');
    },

    // db transaction Error Handler Callback
    onError: function(tx, e) {
      console.log('There has been an error: ' + e.message);
    },

    //Create GUIDs client-side for new records
    createGuid: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    //Create workout Table
    createTable: function() {
      var that = this;
      var db = this.db;
      db.transaction(function(tx) {
        tx.executeSql('DROP TABLE IF EXISTS workouts'); //Drop table every time for now
        tx.executeSql('CREATE TABLE IF NOT EXISTS ' +
          'workouts(id, userid INTEGER, deckid INTEGER, start_date DATETIME, last_modified DATETIME, duration INTEGER, cards TEXT, syncDate DATETIME)', []);
        // tx.executeSql('INSERT INTO workouts (id, deckid,last_modified,duration) VALUES (?,?,?,?)',
        //     [that.createGuid(),1,new Date(),1000],
        //     that.onSuccess,
        //     that.onError
        //     );
      });
      //tx.executeSql('DROP TABLE IF EXISTS DEMO');
      //tx.executeSql('CREATE TABLE IF NOT EXISTS DEMO (id unique, data)');
    },

    //Seed Record for Testing
    seedRecord: function() {
      var that = this;
      var db = this.db;
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      db.transaction(function(tx) {
        tx.executeSql('INSERT INTO workouts (id, userid, deckid, last_modified, duration, cards, syncDate) VALUES (?,?,?,?,?,?,?)', [that.createGuid(), 10151729718357451, 1, new Date().toISOString(), 1000, JSON.stringify({}), yesterday.toISOString()],
          that.onSuccess,
          that.onError
        );
      });

    },

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
            },
            that.onError
          );
        });

      }, function(error) {
        alert(JSON.parse(error.request.responseText).error);
      });

    },

    find: function(model, callback) {

    },

    findAll: function(callback) {
      debugger;
      this.db.transaction(
        function(tx) {
          var sql = 'SELECT * FROM workouts';
          tx.executeSql(sql, [], function(tx, results) {
            debugger;
            var len = results.rows.length;
            var workouts = [];
            for (var i = 0; i < len; i++) {
              workouts[i] = results.rows.item(i);
            }
            callback(workouts);
          });
        },
        function(tx, error) {
          debugger;
          alert("Transaction Error: " + error);
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
            console.log(JSON.stringify(results[i]));
            workoutTable.insert(JSON.stringify(results[i])).done(function(res) {
              console.log(JSON.stringify(res));
              //update local record with confirmed syncdate
              that.db.transaction(function(tx) {
                tx.executeSql('UPDATE workouts set syncDate = ? WHERE ID = ?', [
                    res.__updatedAt,
                    res.id
                  ],
                  that.onSuccess,
                  that.onError
                );
              });

            }, function(error) {
              alert(JSON.parse(error.request.responseText).error);
            });
          }

        }

      });
    },
    syncDown: function(callback) {

    }
  }

  app.dbController.openDB();
  app.dbController.createTable();
  app.dbController.seedRecord();
  app.dbController.syncUp();


})(fb);