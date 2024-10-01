const { MongoClient } = require("mongodb");


const uri = "mongodb://127.0.0.1:27017/";

const client = new MongoClient(uri);

let obj={
    db:null
}



let connection = async function () {
  try {
    await client.connect();
    console.log("connection Succsfull");
    const database = client.db("shopping");

    if(database){
        obj.db=database
    }else{
        throw "database not get";
        
    }
   
  } catch (e) {
    console.log("failed" + e);
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
};



 module.exports.get = function () {
   return obj.db;
 };
  

module.exports.connect = connection;
