const { ServiceBusClient } = require("@azure/service-bus");
const EventEmitter = require("events");
const eventEmitter = new EventEmitter();
const config = require("./config");
const { queueName } = config.azure.queueService;
const connectionString = config.azure.queueService.connectionString;
const { encodeVideo } = require("../services/fileprocess.service");

async function connectToQueue() {
  const sbClient = new ServiceBusClient(connectionString, {
    retryOptions: {
      maxAutoRenewDurationInMs: 15000,
    },
  });

  const receiver = sbClient.createReceiver(queueName);

  // function to handle messages
  const myMessageHandler = async (messageReceived) => {
    console.log(`Received message: ${messageReceived.body}`);
    try {
      const { key, courseId, assetId } = JSON.parse(messageReceived.body);
      await encodeVideo(key, courseId, assetId);
      await receiver.completeMessage(messageReceived);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  // function to handle any errors
  const myErrorHandler = async (error) => {
    console.log(error);
  };

  // subscribe and specify the message and error handlers
  receiver.subscribe({
    processMessage: myMessageHandler,
    processError: myErrorHandler,
  });
}

module.exports = {
  eventEmitter,
  connectToQueue,
};
