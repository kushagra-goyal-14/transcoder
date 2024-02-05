const ffmpeg = require("fluent-ffmpeg");
const config = require("../config/config");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { PassThrough } = require("stream");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require("@azure/storage-blob");

const {
  account,
  accountKey,
  containerName,
  privateContainerName,
  connectionString,
} = config.azure.blobStorage;

const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);

const containerClient = blobServiceClient.getContainerClient(containerName);
const privateContainerClient =
  blobServiceClient.getContainerClient(privateContainerName);

const outputDirectory = "encoded"; // Change to your desired local directory

async function generateSasToken(blobClient) {
  const startDate = new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setMinutes(startDate.getMinutes() + 60); // Token expires in 1 hour
  startDate.setMinutes(startDate.getMinutes() - 5); // Token is valid 5 minutes before the current time

  const permissions = BlobSASPermissions.parse("racwd").toString(); // Permission string (read, add, create, write, delete)

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: blobClient.containerName,
      blobName: blobClient.name,
      permissions: permissions,
      startsOn: startDate,
      expiresOn: expiryDate,
    },
    new StorageSharedKeyCredential(account, accountKey)
  ).toString();

  return sasToken;
}

async function getBlobURL(blobName, isPrivate = false) {
  const blobClient = isPrivate
    ? privateContainerClient.getBlobClient(blobName)
    : containerClient.getBlobClient(blobName);

  const sasToken = await generateSasToken(blobClient);

  if (isPrivate) {
    return `${blobClient.url}?${sasToken}`;
  }

  return `${blobClient.url}`;
}

async function deleteBlob(blobName, isPrivate = false) {
  const blobClient = isPrivate
    ? privateContainerClient.getBlobClient(blobName)
    : containerClient.getBlobClient(blobName);
  return blobClient.delete();
}

async function uploadStream(stream, folder = "uploads", isPrivate = false) {
  const videoName = `${uuidv4()}.flv`;
  const blobName = `${folder}/${videoName}`;
  const blobClient = isPrivate
    ? privateContainerClient.getBlockBlobClient(blobName)
    : containerClient.getBlockBlobClient(blobName);
  await blobClient.uploadStream(stream, undefined, undefined, {
    blobHTTPHeaders: { blobContentType: "video/flv" },
  });
  const blobURL = await getBlobURL(blobName, isPrivate);

  return {
    key: blobName,
    url: blobURL,
  };
}

async function uploadBlobs(files, folder = "uploads", isPrivate = false) {
  return Promise.all(
    files.map(async (file) => {
      // const containerCreateResponse = await containerClient.create();
      // console.log('Container was created successfully. requestId: ', containerCreateResponse.requestId, '\n');
      const videoName = file.split("/").pop();
      const blobName = `${folder}/${videoName}`;
      const blobClient = isPrivate
        ? privateContainerClient.getBlockBlobClient(blobName)
        : containerClient.getBlockBlobClient(blobName);
      await blobClient.uploadFile(file, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });
      const blobURL = await getBlobURL(blobName, isPrivate);

      return {
        key: blobName,
        url: blobURL,
      };
    })
  );
}

// Function to encode video in multiple resolutions and formats
async function encodeVideo(inputStream, courseId, assetId) {
  try {
    const resolutions = ["scale=1280:720", "scale=854:480", "scale=1920:1080"];

    for (const resolution of resolutions) {
      const outputFilePath = `${outputDirectory}/video-${
        resolution.split(":")[1]
      }.${"mp4"}`;

      // Perform video encoding
      await new Promise((resolve, reject) => {
        const command = ffmpeg(inputStream)
          // .input(inputStream)
          .videoFilters(resolution)
          .videoCodec("libx264")
          .audioCodec("aac")
          .toFormat("mp4")
          .on("end", () => {
            resolve();
          })
          .on("error", function (err, stdout, stderr) {
            console.log("an error happened: " + err.message);
            console.log("ffmpeg stdout: " + stdout);
            console.log("ffmpeg stderr: " + stderr);
          })
          .on("progress", function (progress) {
            console.log("Processing: " + progress.percent + "% done");
          });
        // .saveToFile(outputFilePath);
        console.log("command", command);
        var stream11 = command.pipe();
        stream11.on("data", async (chunk) => {
          console.log("chunk", chunk);
        });
        console.log("stream11", stream11);
      });

      const ans = await uploadStream(
        stream11,
        `__courses/${courseId}/COURSE_ASSETS/${assetId}`,
        true
      );

      // const ans = await uploadBlobs(
      //   [outputFilePath],
      //   `__courses/${courseId}/COURSE_ASSETS/${assetId}`,
      //   true
      // );

      console.log("ans", ans);

      console.log(
        `Video encoded in ${resolution}.mp4 and saved locally at ${outputFilePath}`
      );
    }

    console.log(
      "All resolutions and formats encoded and saved locally successfully."
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

// // Example usage with a readable stream
// (async () => {
//   try {
//     await encodeVideo(inputVideoUrl);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// })();

module.exports = {
  encodeVideo,
  getBlobURL,
  deleteBlob,
  uploadBlobs,
};
