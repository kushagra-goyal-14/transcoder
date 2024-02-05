const Joi = require("joi");
const path = require("path");
const dotnev = require("dotenv");

dotnev.config({ path: path.join(__dirname, "../../.env") });

// schema of env files for validation
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("test", "development", "production")
      .required(),
  })
  .unknown();

// validating the process.env object that contains all the env variables
const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

// throw error if the validation fails or results into false
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  //   env: envVars.NODE_ENV,
  //   port: envVars.PORT,
  azure: {
    blobStorage: {
      account: envVars.AZURE_BLOB_STORAGE_ACCOUNT,
      accountKey: envVars.AZURE_BLOB_STORAGE_ACCOUNT_KEY,
      containerName: envVars.AZURE_BLOB_STORAGE_CONTAINER_NAME,
      privateContainerName: envVars.AZURE_BLOB_STORAGE_PRIVATE_CONTAINER_NAME,
      connectionString: envVars.AZURE_BLOB_STORAGE_CONNECTION_STRING,
    },
    queueService: {
      queueName: envVars.AZURE_QUEUE_NAME,
      connectionString: envVars.AZURE_QUEUE_CONNECTION_STRING,
    },
  },
};
