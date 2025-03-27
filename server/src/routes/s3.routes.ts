import express, { Request, Response } from "express";
import { s3Service } from "../services/s3.service";

const router = express.Router();

router.post("/presigned-url", async (req: Request, res: Response) => {
  try {
    // const { type, fileName } = req.query as { type: string; fileName: string };
    const { type, fileName } = req.body;
    if (!type || !fileName) {
      res.status(400).json({ message: "Type and fileName are required" });
      return;
    }
    const result = await s3Service.generatePresignedUrl(type, fileName);
    res.json(result);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete("/delete", async (req: Request, res: Response) => {
  try {
    console.log("DELETE /api/upload/delete request body:", req.body);
    const { key } = req.body;
    if (!key) {
      res.status(400).json({ error: "Key is required" }); 
      return;
    }
    await s3Service.deleteObject(key);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting S3 object:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;