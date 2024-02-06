const mongoose = require("mongoose");
const config = require("./config");

const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log("Connected to database...");
  } catch (error) {
    console.log("Error:", error);
  }
};

const Asset =
  mongoose.models.Asset ||
  mongoose.model(
    "Asset",
    new mongoose.Schema(
      {
        title: {
          type: String,
          default: "",
        },
        type: {
          type: String,
          enum: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/svg",
            "image/gif",
            "video/mp4",
            "video/webm",
            "audio/mp3",
            "audio/wav",
            "application/pdf",
            "application/msword",
            "application/vnd.ms-excel",
            "application/vnd.ms-powerpoint",
          ],
          default: "video",
        },
        status: {
          type: String,
          enum: ["queued", "processing", "processed", "failed"],
          default: "queued",
        },
        key: {
          type: String,
          default: "",
        },
        durationInSeconds: {
          type: Number,
          default: 0,
        },
        courseId: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "Course",
        },
        creator: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "User",
        },
      },
      {
        timestamps: true,
      }
    )
  );

const updateDuration = async (courseId, assetId, durationInSeconds) => {
  const asset = await Asset.findOne({
    courseId,
    _id: assetId,
  });
  asset.durationInSeconds = durationInSeconds;

  await asset.save();

  return asset;
};

const changeAssetStatus = async (courseId, assetId, status) => {
  //   console.log(mongoose);

  const asset = await Asset.findOne({
    courseId,
    _id: assetId,
  });
  asset.status = status;
  await asset.save();
};

module.exports = {
  changeAssetStatus,
  connectToDatabase,
  updateDuration,
};
