'use client';

import { useState, useRef } from 'react';
import { useUploadThing } from '@/lib/uploadthing';
import { Image, Smile, MapPin, X, Loader2, Globe, Users, Lock, Upload, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { toast } from 'react-hot-toast';

interface CreatePostProps {
  user: any;
  onPostCreated?: (newPost: any) => void;
}

export function CreatePost({ user, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing('postMedia', {
    onUploadProgress: (p) => setUploadProgress(p),
    onClientUploadComplete: (res) => {
      setUploadedFiles(prev => [...prev, ...res]);
      setIsUploading(false);
      setUploadProgress(0);
      toast.success('Upload complete!');
    },
    onUploadError: (error) => {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe },
    { value: 'followers', label: 'Followers only', icon: Users },
    { value: 'close_friends', label: 'Close friends', icon: Lock },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      await startUpload(Array.from(files));
    } catch (err) {
      console.error(err);
    } finally {
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && uploadedFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          visibility,
          location,
          tags,
          mediaUrls: uploadedFiles.map(f => f.ufsUrl),
          mediaTypes: uploadedFiles.map(f => f.type?.startsWith('image') ? 'image' : 'video'),
        }),
      });

      if (response.ok) {
        const newPost = await response.json();
        toast.success('Post created successfully!');
        setContent('');
        setUploadedFiles([]);
        setLocation('');
        setTags('');
        setIsExpanded(false);
        if (onPostCreated) onPostCreated(newPost);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create post');
      }
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const SelectedVisibilityIcon = visibilityOptions.find(v => v.value === visibility)?.icon || Globe;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          <Avatar src={user.avatar_url} alt={user.username} size="md" />
          <div className="flex-1">
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-700"
              rows={isExpanded ? 4 : 1}
            />

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="mt-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading... {uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {file.type?.startsWith('image') ? (
                        <img
                          src={file.ufsUrl}
                          alt="Uploaded"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <Play className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Expanded Options */}
            {isExpanded && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Add location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-700"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">#</span>
                    <input
                      type="text"
                      placeholder="Add tags (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* File Upload Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-purple-600"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-5 w-5 mr-1" />
                      Media
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <Button type="button" variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
                      <Smile className="h-5 w-5 mr-1" />
                      Feeling
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
                          <SelectedVisibilityIcon className="h-5 w-5 mr-1" />
                          {visibilityOptions.find(v => v.value === visibility)?.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {visibilityOptions.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => setVisibility(option.value)}
                            className="cursor-pointer"
                          >
                            <option.icon className="h-4 w-4 mr-2" />
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsExpanded(false);
                        setContent('');
                        setUploadedFiles([]);
                        setLocation('');
                        setTags('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={(!content.trim() && uploadedFiles.length === 0) || isSubmitting || isUploading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}


