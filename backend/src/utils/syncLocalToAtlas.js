const mongoose = require('mongoose');

const localUri = 'mongodb://127.0.0.1:27017/careflow';
// Notice %40 encodes the '@' in CareFlowSecure@2026, and CareFlow matches the Atlas database name
const atlasUri = 'mongodb+srv://rohitks1905_db_user:CareFlowSecure%402026@cluster0.njzih9o.mongodb.net/CareFlow?retryWrites=true&w=majority';

async function syncLocalToAtlas() {
  console.log('=== SYNCING LOCAL MONGODB DATABASE TO MONGODB ATLAS ===\n');

  console.log('1. Connecting to Local MongoDB (localhost:27017/careflow)...');
  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log('✅ Connected to Local MongoDB.');

  console.log('\n2. Connecting to MongoDB Atlas Cloud Database...');
  const atlasConn = await mongoose.createConnection(atlasUri).asPromise();
  console.log('✅ Connected to MongoDB Atlas successfully! (Password with %40 resolved authentication).');

  const collections = await localConn.db.listCollections().toArray();
  console.log(`\n3. Found ${collections.length} collections to sync:`, collections.map((c) => c.name));

  for (const col of collections) {
    const colName = col.name;
    const docs = await localConn.db.collection(colName).find({}).toArray();
    console.log(`- Copying collection '${colName}' (${docs.length} documents)...`);

    if (docs.length > 0) {
      // Clear destination collection on Atlas and copy
      await atlasConn.db.collection(colName).deleteMany({});
      await atlasConn.db.collection(colName).insertMany(docs);
      console.log(`  ✅ Successfully copied ${docs.length} documents to Atlas '${colName}'.`);
    }
  }

  console.log('\n=============================================================');
  console.log('🎉 ALL LOCAL DATA SUCCESSFULLY SYNCED TO MONGODB ATLAS!');
  console.log('=============================================================');

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

syncLocalToAtlas().catch((err) => {
  console.error('Sync error:', err);
  process.exit(1);
});
