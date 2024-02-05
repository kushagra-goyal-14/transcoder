// const ffmpeg = require("fluent-ffmpeg");
// const config = require("../config/config");

// const {
//   BlobServiceClient,
//   StorageSharedKeyCredential,
//   generateBlobSASQueryParameters,
//   BlobSASPermissions,
// } = require("@azure/storage-blob");

// const {
//   account,
//   accountKey,
//   containerName,
//   privateContainerName,
//   connectionString,
// } = config.azure.blobStorage;

// const blobServiceClient =
//   BlobServiceClient.fromConnectionString(connectionString);

// const containerClient = blobServiceClient.getContainerClient(containerName);
// const privateContainerClient =
//   blobServiceClient.getContainerClient(privateContainerName);

// async function generateSasToken(blobClient) {
//   const startDate = new Date();
//   const expiryDate = new Date(startDate);
//   expiryDate.setMinutes(startDate.getMinutes() + 60); // Token expires in 1 hour
//   startDate.setMinutes(startDate.getMinutes() - 5); // Token is valid 5 minutes before the current time

//   const permissions = BlobSASPermissions.parse("racwd").toString(); // Permission string (read, add, create, write, delete)

//   const sasToken = generateBlobSASQueryParameters(
//     {
//       containerName: blobClient.containerName,
//       blobName: blobClient.name,
//       permissions: permissions,
//       startsOn: startDate,
//       expiresOn: expiryDate,
//     },
//     new StorageSharedKeyCredential(account, accountKey)
//   ).toString();

//   return sasToken;
// }

// async function getBlobURL(blobName, isPrivate = false) {
//   const blobClient = isPrivate
//     ? privateContainerClient.getBlobClient(blobName)
//     : containerClient.getBlobClient(blobName);

//   const sasToken = await generateSasToken(blobClient);

//   if (isPrivate) {
//     return `${blobClient.url}?${sasToken}`;
//   }

//   return `${blobClient.url}`;
// }

// async function deleteBlob(blobName, isPrivate = false) {
//   const blobClient = isPrivate
//     ? privateContainerClient.getBlobClient(blobName)
//     : containerClient.getBlobClient(blobName);
//   return blobClient.delete();
// }

// async function uploadStream(
//   stream,
//   folder = "uploads",
//   fileName,
//   isPrivate = false
// ) {
//   const videoName = fileName;
//   const blobName = `${folder}/${videoName}`;
//   const blobClient = isPrivate
//     ? privateContainerClient.getBlockBlobClient(blobName)
//     : containerClient.getBlockBlobClient(blobName);
//   await blobClient.uploadStream(stream, undefined, undefined, {
//     blobHTTPHeaders: { blobContentType: "video/mp4" },
//   });
//   const blobURL = await getBlobURL(blobName, isPrivate);

//   return {
//     key: blobName,
//     url: blobURL,
//   };
// }

// async function uploadBlobs(files, folder = "uploads", isPrivate = false) {
//   return Promise.all(
//     files.map(async (file) => {
//       const videoName = file.split("/").pop();
//       const blobName = `${folder}/${videoName}`;
//       const blobClient = isPrivate
//         ? privateContainerClient.getBlockBlobClient(blobName)
//         : containerClient.getBlockBlobClient(blobName);
//       await blobClient.uploadFile(file, {
//         blobHTTPHeaders: { blobContentType: file.mimetype },
//       });
//       const blobURL = await getBlobURL(blobName, isPrivate);

//       return {
//         key: blobName,
//         url: blobURL,
//       };
//     })
//   );
// }

// // Function to encode video in multiple resolutions and formats
// async function encodeVideo(inputStream, courseId, assetId) {
//   try {
//     const resolutions = ["scale=1280:720", "scale=854:480", "scale=1920:1080"];

//     for (const resolution of resolutions) {
//       const fileName = `video-${resolution.split(":")[1]}.${"mp4"}`;

//       // Perform video encoding
//       await new Promise(async (resolve, reject) => {
//         const command = ffmpeg(inputStream)
//           .videoFilters(resolution)
//           .videoCodec("libx264")
//           .audioCodec("aac")
//           .toFormat("mp4")
//           .outputOptions("-movflags frag_keyframe+empty_moov")
//           .on("end", async () => {
//             resolve();
//           })
//           .on("error", function (err, stdout, stderr) {
//             console.log("an error happened: " + err.message);
//             console.log("ffmpeg stdout: " + stdout);
//             console.log("ffmpeg stderr: " + stderr);
//           })
//           .on("progress", function (progress) {
//             console.log("Processing: " + progress.percent + "% done");
//           });

//         var stream11 = command.pipe();
//         // stream11.on("data", async (chunk) => {
//         //   console.log("chunk", chunk);
//         //   // outputStream.write(chunk);
//         // });

//         var ans = await uploadStream(
//           stream11,
//           `__courses/${courseId}/COURSE_ASSETS/${assetId}`,
//           fileName,
//           true
//         );
//         console.log("ans", ans);
//       });

//       console.log(
//         `Video encoded in ${resolution}.mp4 and saved to Azure Blob Storage.`
//       );
//     }

//     console.log(
//       "All resolutions and formats encoded and saved locally successfully."
//     );
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// module.exports = {
//   encodeVideo,
//   getBlobURL,
//   deleteBlob,
//   uploadBlobs,
// };

const ffmpeg = require("fluent-ffmpeg");
const config = require("../config/config");

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

async function generateSasToken(blobClient) {
  const startDate = new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setMinutes(startDate.getMinutes() + 60);
  startDate.setMinutes(startDate.getMinutes() - 5);

  const permissions = BlobSASPermissions.parse("racwd").toString();

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: blobClient.containerName,
      blobName: blobClient.name,
      permissions,
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

  return isPrivate ? `${blobClient.url}?${sasToken}` : blobClient.url;
}

async function deleteBlob(blobName, isPrivate = false) {
  const blobClient = isPrivate
    ? privateContainerClient.getBlobClient(blobName)
    : containerClient.getBlobClient(blobName);

  return blobClient.delete();
}

async function uploadStream(
  stream,
  folder = "uploads",
  fileName,
  isPrivate = false
) {
  const videoName = fileName;
  const blobName = `${folder}/${videoName}`;
  const blobClient = isPrivate
    ? privateContainerClient.getBlockBlobClient(blobName)
    : containerClient.getBlockBlobClient(blobName);

  await blobClient.uploadStream(stream, undefined, undefined, {
    blobHTTPHeaders: { blobContentType: "video/mp4" },
  });

  const blobURL = await getBlobURL(blobName, isPrivate);

  return { key: blobName, url: blobURL };
}

async function uploadBlobs(files, folder = "uploads", isPrivate = false) {
  return Promise.all(
    files.map(async (file) => {
      const videoName = file.split("/").pop();
      const blobName = `${folder}/${videoName}`;
      const blobClient = isPrivate
        ? privateContainerClient.getBlockBlobClient(blobName)
        : containerClient.getBlockBlobClient(blobName);

      await blobClient.uploadFile(file, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const blobURL = await getBlobURL(blobName, isPrivate);

      return { key: blobName, url: blobURL };
    })
  );
}

async function encodeVideo(inputStream, courseId, assetId) {
  try {
    const resolutions = ["scale=1280:720", "scale=854:480", "scale=1920:1080"];

    for (const resolution of resolutions) {
      const fileName = `video-${resolution.split(":")[1]}.mp4`;
      const command = ffmpeg(inputStream)
        .videoFilters(resolution)
        .videoCodec("libx264")
        .audioCodec("aac")
        .toFormat("mp4")
        .outputOptions("-movflags frag_keyframe+empty_moov")
        .on("progress", (progress) => {
          console.log("Processing:", progress.percent + "% done");
        })
        .on("end", () => {
          console.log(`Video encoded in ${fileName}`);
        })
        .on("error", (err, stdout, stderr) => {
          console.error("Error encoding video:", err.message);
          console.log("ffmpeg stdout:", stdout);
          console.log("ffmpeg stderr:", stderr);
        });

      const stream = command.pipe();

      const ans = await uploadStream(
        stream,
        `__courses/${courseId}/COURSE_ASSETS/${assetId}`,
        fileName,
        true
      );
      console.log("ans", ans);
    }

    console.log(
      "All resolutions and formats encoded and saved to azure Blob Storage successfully."
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = { encodeVideo, getBlobURL, deleteBlob, uploadBlobs };
