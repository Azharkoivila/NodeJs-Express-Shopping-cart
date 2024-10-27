const { MongoClient } = require("mongodb");
const collections=require('./collections')

const uri = "mongodb://127.0.0.1:27017/";

const client = new MongoClient(uri);

let obj={
    db:null
}



let connection = async function () {
  try {
    await client.connect();
    console.log("DB Connection Successful");
    const database = client.db(collections.DbName);

    if(database){
        obj.db=database
    }else{
        throw "database not get";
        
    }
   
  } catch (e) {
    console.log("failed" + e);
  } finally {

  }
};



 module.exports.get = function () {
   return obj.db;
 };
  

module.exports.connect = connection;
