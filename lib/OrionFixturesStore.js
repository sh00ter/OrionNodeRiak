/*

An attempt to add a fixtures store...

So the only things actually supported are fetch and retrieve record.
the other functions just return the data they receive



*/
require('./OrionStore');
var sys = require('sys');

global.OrionFixturesStore = OrionStore.extend({
   
   // User adjustable properties
   
   primaryKey: '',
   
   fixturesBaseDir: './fixtures',
   
   /*
   the storeRequest is an object with the following layout:
   { bucket: '', 
     key: '',
     conditions: '', 
     parameters: {}, 
     recordData: {},
     relations: [ 
        { bucket: '', type: 'toOne', propertyName: '', keys: [] }, 
        { bucket: '', type: 'toMany', propertyName: '', keys: [] } 
     ] 
   }
   */
   
   /*
   The idea behind the fixtures is that it is easy to work both with fixtures AND with a live server
   Or some applications just require only fixtures
   
   The fixture data should be normal node module files that are loadable using require();
   the file names should be equal to the the bucket/resource name.
   The layout of those modules should be: exports.resourcename = [ array of records ]
   relations should already be in the fixtures
   
   */
   
   _loadedFixtures: {}, // place to store the fixtures
   
   _fixturesByBucketAndKey: {},
   
   loadFixtures: function(bucket){
      var fixturesDir = this.fixturesBaseDir;
      fixturesDir = (fixturesDir[fixturesDir-1] == "/")? fixturesDir: [fixturesDir,"/"].join("");
      var filename = [fixturesDir,bucket].join("");
      var ret = require(filename)[bucket];
      this._loadedFixtures[bucket] = [];
      // load the data twice to be able to index it
      var currec;
      var primaryKeyName = this.primaryKey;
      this._fixturesByBucketAndKey[bucket] = {}; // init fixtures by bucket
      for(var i=0,len=ret.length;i<len;i++){
         currec = ret[i];
         if(!currec.key){
            if(currec.id !== undefined) ret[i].key = currec.id;
         }
         this._loadedFixtures[bucket].push(ret[i]);
         this._fixturesByBucketAndKey[bucket][currec[primaryKeyName]] = ret[i]; // put in indexed
      }
      return ret;
   },
   
   fetch: function(storeRequest,clientId,callback){  
      var bucket = storeRequest.bucket;
      var loadedData = this._loadedFixtures[bucket];
      loadedData = (loadedData)? loadedData: this.loadFixtures(bucket);
      var conditions = storeRequest.conditions, parameters = storeRequest.parameters;
      var ret;
      if(this.filterBySCQuery && conditions){
         ret = this._filterRecordsByQuery(loadedData,conditions,parameters);
      }
      else {
         ret = loadedData;
      }
      callback({ recordResult: ret });
   },
   
   refreshRecord: function(storeRequest,clientId,callback){
      // let's do this using a query
      var bucket = storeRequest.bucket;
      // check whether stuff is loaded
      if(!this._loadedFixtures[bucket]) this.loadFixtures(bucket); 
      // we don't care about the return value here, as we want access through the indexed set
      var record = this._fixturesByBucketAndKey[bucket][storeRequest.key];
      callback(record);
   },
   
   createRecord: function(storeRequest,clientId,callback){
      callback(storeRequest.record);
   },
   
   updateRecord: function(storeRequest,clientId,callback){
      callback(storeRequest.record);
   },
   
   deleteRecord: function(storeRequest,clientId,callback){
      callback(storeRequest.record);
   }
   
   
});