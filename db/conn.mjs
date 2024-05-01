// import express from 'express';
// import { MongoClient } from 'mongodb';
import mongoose from "mongoose";

// const connectionString = process.env.ATLAS_URI || "";
// const client = new MongoClient(connectionString);
mongoose.connect(process.env.ATLAS_URI || "");


// let conn;
// try{
//     conn = await client.connect();
//     console.log('Connected to MongoDB');
// } catch(err) {
//     console.log(err)
// }

// let db = conn.db("sample_training");
const db = mongoose.connection;


// Create indexes
(async () => {
    const collection = await db.collection("grades");
    
    // Create a single-field index on class_id.
    await collection.createIndex({ class_id: 1 });
  
    // Create a single-field index on learner_id.
    await collection.createIndex({ learner_id: 1 });
  
    // Create a compound index on learner_id and class_id, in that order, both ascending.
    await collection.createIndex({ learner_id: 1, class_id: 1 });
  })();

export default db;