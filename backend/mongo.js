import { MongoClient } from "mongodb";

const uri = "mongodb+srv://lalitdatabase:lalitdatabase7758@employee.6tpdrsq.mongodb.net/?retryWrites=true&w=majority&appName=employee";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db("testdb");
    const users = db.collection("users");

    const data = await users.find().toArray();
    console.log("Users:", data);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

run();
