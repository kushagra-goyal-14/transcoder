const { connectToQueue } = require("./config/queueSubscriber");
const { connectToDatabase } = require("./config/mongoose");

const startWorker = async () => {
  try {
    console.log("Worker started...");
    await connectToQueue();
    await connectToDatabase();
    console.log("Worker connected to queue and database...");
  } catch (error) {
    console.log("Error:", error);
  }
};

startWorker();
