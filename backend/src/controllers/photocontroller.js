const Photo = require("../models/photo");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// ================= UPLOAD MULTIPLE PHOTOS =================
exports.uploadPhoto = async (req, res) => {
  console.log("🔥 UPLOAD API HIT");
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const { eventName, customerName, category, isBestPhoto, allowDownload } =
      req.body;

    if (!eventName || !customerName || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const savedPhotos = [];

    for (const file of req.files) {
      // ================= FINAL FOLDER =================
      const finalFolder = path.join(
        process.cwd(),
        "uploads",
        customerName,
        eventName,
        category,
      );

      if (!fs.existsSync(finalFolder)) {
        fs.mkdirSync(finalFolder, { recursive: true });
      }

      const finalPath = path.join(finalFolder, path.basename(file.path));

      // Move file from temp → final
      fs.renameSync(file.path, finalPath);

      const relativePath = path
        .relative(process.cwd(), finalPath)
        .replace(/\\/g, "/");
      const isBest = req.body.isBestPhoto === "true";

      const photo = new Photo({
        eventName,
        customerName,
        category,
        imagePath: relativePath,
        isBestPhoto: isBest,
      });

      await photo.save();
      savedPhotos.push(photo);
    }

    res.status(201).json({
      message: "Photos uploaded successfully",
      data: savedPhotos,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};

// ================= GET ALL PHOTOS =================
exports.getPhotos = async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
};

// ================= EVENT PAGE DATA =================
exports.getEventPhotos = async (req, res) => {
  try {
    const { eventName } = req.params;

    const photos = await Photo.find({ eventName }).sort({ createdAt: -1 });

    if (!photos.length) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      eventName,
      client: {
        name: photos[0].customerName,
      },
      bestPhotos: photos.filter((p) => p.isBestPhoto),
      allPhotos: photos,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load event" });
  }
};

// ================= UPDATE CATEGORY =================
exports.updatePhoto = async (req, res) => {
  const { eventName, customerName, category } = req.body;

  const photo = await Photo.findByIdAndUpdate(
    req.params.id,
    { eventName, customerName, category},
    { new: true },
  );

  res.json(photo);
};

// ================= DELETE PHOTO =================
exports.deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    const absolutePath = path.join(process.cwd(), photo.imagePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await Photo.findByIdAndDelete(req.params.id);

    res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};


// ================= DOWNLOAD ALL PHOTOS (ZIP) =================
exports.downloadEventPhotos = async (req, res) => {
  try {
    const { customerName, eventName } = req.params;

    const photos = await Photo.find({ customerName, eventName });

    if (!photos.length) {
      return res.status(404).json({ error: "No photos found" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${customerName}_${eventName}.zip`,
    );
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    photos.forEach((photo) => {
      const absolutePath = path.join(process.cwd(), photo.imagePath);
      if (fs.existsSync(absolutePath)) {
        archive.file(absolutePath, { name: path.basename(photo.imagePath) });
      }
    });

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ZIP download failed" });
  }
};
