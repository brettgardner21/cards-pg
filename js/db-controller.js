(function(app) {

  'use strict';

  var current_migration = null;
  var current_schema_version = null;

  var db_migrations = {
    v1: {
      version: "1.0",
      up: function(tx) {
        tx.executeSql('DROP TABLE IF EXISTS workouts'); //Drop table every time for now
        tx.executeSql('CREATE TABLE IF NOT EXISTS workouts(id, userid INTEGER, deckid INTEGER, start_date DATETIME, last_modified DATETIME, duration INTEGER, cards TEXT, syncDate DATETIME)', []);
      },
      down: function(tx) {
        tx.executeSql('DROP TABLE IF EXISTS workouts');
      }
    }
    // v2: {
    //   version: "2.0",
    //   up: function(tx) {
    //     tx.executeSql('CREATE TABLE IF NOT EXISTS food_notes (food_id INTEGER NOT NULL, note TEXT, picture VARCHAR(255));');
    //     tx.executeSql('CREATE INDEX IF NOT EXISTS food_notes_food_id_idx ON food_notes(food_id);');

    //   },
    //   down: function(tx) {
    //     tx.executeSql('DROP INDEX IF EXISTS food_notes_food_id_idx;');
    //     tx.executeSql('DROP TABLE IF EXISTS food_notes;');
    //   }
    // }
  };

  app.dbController = {

    db: null,

    // open or create a new DB to store offline workout and card data
    openDB: function() {

      var that = this;

      //1. Set DB size
      var dbSize = 2 * 1024 * 1024; // Default DB size.  2 MB sound good?

      //2. Open database
      try {
        this.db = window.openDatabase('cards', '', 'Cards Database', dbSize);

        //NEED TO REMOVE: test migration by forcing the db to start over.
        this.db.changeVersion(this.db.version, "0.1");

        console.log(this.db.version); // For example, "1.0"
      } catch (e) {
        alert('Error ' + e + '.');
        return;
      }


      //3. Run Migrations
      for (var m in db_migrations) {
        current_migration = db_migrations[m];
        if (this.db.version < current_migration.version) {
          this.db.transaction(
            current_migration.up,
            function(err) {
              that.createDBError.call(that, err);
            },
            this.createDBSuccess.apply(this)
          );
        }
      }

    },

    createDBSuccess: function() {
      current_schema_version = current_migration.version;
      this.db.changeVersion(this.db.version, current_schema_version);
    },

    createDBError: function(err) {
      app.alert('Error updating ' + this.db.version + ' database: ' + err.message);
      this.db.transaction(current_migration.down, this.createDBErrorFatal, this.createDBSuccessAll);
    },


    createDBErrorFatal: function(err) {
      app.alert('Fatal Error when rollback ' + current_migration.version + ' database: ' + err.message);
    },

    createDBSuccessAll: function() {
      app.alert('Database rollback from ' + current_migration.version + ' version to previous version.');
    },

    // Generic db transaction Success Handler Callback
    onSuccess: function(tx) {
      console.log('Success: This is a call.');
    },

    // Generic db transaction Error Handler Callback
    onError: function(tx, e) {
      debugger;
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
    }
  };

  app.dbController.openDB();

})(fb);