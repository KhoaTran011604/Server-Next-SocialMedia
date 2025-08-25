import mongoose from "mongoose";

export const connectDB = async () => {

  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("Mongo conected....."); const adminDb = mongoose.connection.client.db().admin(); // <-- dùng client.db()
      const buildInfo = await adminDb.command({ buildInfo: 1 });
      console.log("MongoDB version:", buildInfo.version);
    })
    .catch(err => console.log(err))
};
