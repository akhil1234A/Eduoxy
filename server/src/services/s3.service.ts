import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * This is a service class for handling S3 operations.
 * It provides methods to generate presigned URLs for uploading files, delete objects from S3,
 */
export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * This method generates a presigned URL for uploading a file to S3.
   * @param type - The type of the file (video, pdf, subtitle, image).
   * @param fileName 
   * @returns 
   */
  async generatePresignedUrl(
    type: string,
    fileName: string
  ): Promise<{ url: string; key: string; publicUrl: string }> {
    if (!fileName || !type) {
      throw new Error("File name and type are required");
    }

    const folder =
      type === "video" ? "course_videos" :
      type === "pdf" ? "course_pdfs" :
      type === "subtitle" ? "course_subtitles" :
      "course_images";
    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType:
        type === "video" ? "video/*" :
        type === "pdf" ? "application/pdf" :
        type === "subtitle" ? "text/vtt" :
        "image/*",
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return {
      url: presignedUrl,
      key,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
  }

  /**
   * This method deletes an object from S3.
   * @param key 
   */
  async deleteObject(key: string): Promise<void> {
    if (!key) {
      throw new Error("Key is required");
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * This method uploads a file to S3.
   * @param fileBuffer 
   * @param fileName 
   * @param contentType 
   * @param folder 
   * @returns 
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string
  ): Promise<{ key: string; publicUrl: string }> {
    if (!fileBuffer || !fileName || !contentType || !folder) {
      throw new Error("File buffer, name, content type, and folder are required");
    }

    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    return {
      key,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
  }

  /**
   * This method extracts the key from a given S3 URL.
   * Used to get the key from a URL when the file is already uploaded.
   * @param url 
   * @returns 
   */
  extractKeyFromUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    const bucketUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    if (!url.startsWith(bucketUrl)) {
      console.warn(`URL does not match expected bucket format: ${url}`);
      return null;
    }
    return url.split(bucketUrl)[1];
  }
  
  /**
   * Genereates a presigned url for downloading a file from s3. 
   * @param key 
   * @param expiresIn 
   * @returns 
   */
  async generateDownloadPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!key) {
      throw new Error("Key is required");
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    try {
      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      console.error(`Failed to generate presigned download URL for key: ${key}`, error);
      throw new Error("Could not generate presigned URL");
    }
  }

}

export const s3Service = new S3Service();