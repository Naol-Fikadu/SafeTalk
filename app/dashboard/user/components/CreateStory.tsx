"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/Button";
import { X, Camera, Upload, Loader2, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface CreateStoryProps {
  onClose: () => void;
  onStoryCreated: (story: any) => void;
}

export function CreateStory({ onClose, onStoryCreated }: CreateStoryProps) {
  const { data: session } = useSession();
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);   // <-- progress state
  const [complete, setComplete] = useState(false); // <-- success state

  // Initialize UploadThing hook
  const { startUpload } = useUploadThing("storyMedia", {
    onUploadProgress: (p) => {
      setProgress(p);                 // update progress bar
    },
    onClientUploadComplete: async (res) => {
      // This callback fires when upload is done
      if (!res?.[0]) return;
      try {
        const uploadedFile = res[0];
        const response = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_url: uploadedFile.url,
            media_type: uploadedFile.type.startsWith("video") ? "video" : "image",
            caption: caption || null,
            audience: "public",
          }),
        });

        if (!response.ok) throw new Error("Failed to save story");

        const newStory = await response.json();
        onStoryCreated(newStory);

        // Show success message, then close
        setComplete(true);
        setTimeout(() => {
          onClose();
        }, 800);
      } catch (err) {
        console.error(err);
        setError("Failed to save story");
        setUploading(false);
      }
    },
    onUploadError: (err) => {
      setError("Upload failed. Please try again.");
      console.error(err);
      setUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
    setProgress(0);
    setComplete(false);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setProgress(0);
    setComplete(false);

    // startUpload will fire the callbacks above
    await startUpload([file]);
  };

  // If upload complete, show a green success overlay
  if (complete) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Story uploaded!</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Create Story</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!preview ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl h-64 cursor-pointer hover:border-purple-400 transition">
              <Camera className="h-10 w-10 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Click to upload photo/video</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative">
              {file?.type.startsWith("video") ? (
                <video
                  src={preview}
                  controls
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <button
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Progress bar - appears during upload */}
          {uploading && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">{progress}%</p>
            </div>
          )}

          <textarea
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 resize-none focus:ring-2 focus:ring-purple-500 outline-none"
            rows={2}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Share Story
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}




