const mongoose = require('mongoose');
const env = require('./src/config/env');

const cleanIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (let col of collections) {
      if (col.name === 'bookings') {
        console.log(`Cleaning indexes for collection: ${col.name}`);
        const collection = mongoose.connection.db.collection(col.name);
        const indexes = await collection.indexes();
        
        // Drop ALL indexes except _id
        // Mongoose will recreate the correct ones from the current models on restart
        for (let idx of indexes) {
          if (idx.name !== '_id_') {
            try {
              await collection.dropIndex(idx.name);
              console.log(`Dropped index: ${idx.name}`);
            } catch (e) {
              console.log(`Could not drop ${idx.name}: ${e.message}`);
            }
          }
        }
      }
    }

    console.log('Database cleanup complete! Mongoose will recreate the correct indexes on next start.');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

cleanIndexes();
