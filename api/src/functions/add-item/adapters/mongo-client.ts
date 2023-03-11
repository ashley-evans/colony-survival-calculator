import { MongoClient } from "mongodb";

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

export default client;
