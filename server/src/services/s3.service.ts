import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

  extractKeyFromUrl(url: string | undefined | null): string | null {
    if (!url) return null;
    const bucketUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    if (!url.startsWith(bucketUrl)) {
      console.warn(`URL does not match expected bucket format: ${url}`);
      return null;
    }
    return url.split(bucketUrl)[1];
  }
  
}

export const s3Service = new S3Service();