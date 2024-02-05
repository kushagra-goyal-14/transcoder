const { connectToQueue } = require("./config/queueSubscriber");

const startWorker = () => {
  try {
    console.log("Worker started...");
    connectToQueue();
    console.log("Worker connected to queue...");
  } catch (error) {
    console.log("Error:", error);
  }
};

startWorker();
