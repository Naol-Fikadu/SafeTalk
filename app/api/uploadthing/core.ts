import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db } from "@/lib/db/queries";

const f = createUploadthing();

export const ourFileRouter = {

  postMedia: f({
    image: { maxFileSize: "4MB", maxFileCount: 10, contentDisposition: "inline" },
    video: { maxFileSize: "8MB", maxFileCount: 10, contentDisposition: "inline" },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Post media uploaded by userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.url, type: file.type };
  }),

  imageUploader: f({ 
    image: { 
      maxFileSize: "4MB", 
      maxFileCount: 5 
    } 
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Upload complete for userId:", metadata.userId);
      console.log("📎 File URL:", file.url);
      return { uploadedBy: metadata.userId };
    }),
  
  avatarUploader: f({ 
    image: { 
      maxFileSize: "4MB", 
      maxFileCount: 1 
    } 
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Avatar upload complete for userId:", metadata.userId);
      await db.users.updateAvatar(metadata.userId, file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  coverUploader: f({ 
    image: { 
      maxFileSize: "8MB", 
      maxFileCount: 1 
    } 
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Cover upload complete for userId:", metadata.userId);
      await db.users.updateCover(metadata.userId, file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  videoUploader: f({ 
    video: { 
      maxFileSize: "16MB", 
      maxFileCount: 3 
    } 
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Video upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  // ✅ New endpoint for stories (images & videos)
  storyMedia: f({
    image: { maxFileSize: "32MB", maxFileCount: 1 },
    video: { maxFileSize: "128MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Story media uploaded by userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;