import { MongoClient } from "mongodb";

import type { StoreItemPort } from "../interfaces/store-item-port";

const databaseName = process.env["DATABASE_NAME"];
if (!databaseName) {
    throw new Error("Misconfigured: Database name not provided");
}

const itemCollectionName = process.env["ITEM_COLLECTION_NAME"];
if (!itemCollectionName) {
    throw new Error("Misconfigured: Item collection name not provided");
}

const mongoURI = process.env["MONGO_DB_URI"];
if (!mongoURI) {
    throw new Error("Misconfigured: URI for MongoDB not provided");
}

const accessKeyID = process.env["AWS_ACCESS_KEY_ID"];
if (!accessKeyID) {
    throw new Error("Misconfigured: AWS Access Key ID not provided");
}

const secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
if (!secretAccessKey) {
    throw new Error("Misconfigured: AWS Secret Access Key not provided");
}

const client = MongoClient.connect(mongoURI, {
    ...(process.env["TEST_ENV"]
        ? {}
        : {
              auth: {
                  username: accessKeyID,
                  password: secretAccessKey,
              },
              authSource: "$external",
              authMechanism: "MONGODB-AWS",
          }),
});

const storeItem: StoreItemPort = async (items) => {
    if (items.length === 0) {
        return true;
    }

    const connection = await client;
    const db = connection.db(databaseName);
    const collection = db.collection(itemCollectionName);

    await collection.deleteMany();
    await collection.insertMany(items);

    return true;
};

export { storeItem };
