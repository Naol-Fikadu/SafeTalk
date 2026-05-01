"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useSession } from "next-auth/react";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption?: string;
  username: string;
  full_name: string;
  avatar_url: string;
  viewed: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onComplete: () => void;
  onStoryViewed: (storyId: string) => void; // callback to mark as viewed
}

const STORY_DURATION = 5000; // 5 seconds

export function StoryViewer({
  stories,
  initialIndex,
  onClose,
  onComplete,
  onStoryViewed,
}: StoryViewerProps) {
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentStory = stories[currentIndex];

  // Mark story as viewed when it appears
  useEffect(() => {
    if (currentStory && !currentStory.viewed && session?.user?.id) {
      fetch(`/api/stories/${currentStory.id}/view`, { method: "POST" });
      onStoryViewed(currentStory.id);
    }
  }, [currentIndex, currentStory?.id]);

  // Progress animation (for images)
  useEffect(() => {
    if (paused || currentStory?.media_type === "video") return;

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(newProgress);
      if (newProgress >= 100) {
        goToNext();
      }
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, paused, currentStory?.media_type]);

  // Video handling
  useEffect(() => {
    if (currentStory?.media_type === "video" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setProgress(0);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      setPaused(false);
    } else {
      onClose();
      onComplete();
    }
  }, [currentIndex, stories.length]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      setPaused(false);
    }
  };

  const togglePause = () => setPaused((p) => !p);

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Progress bar */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {stories.map((_, idx) => (
          <div
            key={idx}
            className="h-1 flex-1 bg-white/30 rounded overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{
                width:
                  idx < currentIndex
                    ? "100%"
                    : idx === currentIndex
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-10 left-4 right-4 flex items-center space-x-3 z-10">
        <Avatar src={currentStory.avatar_url} alt={currentStory.username} size="sm" />
        <div>
          <p className="text-white font-medium text-sm">
            {currentStory.full_name || currentStory.username}
          </p>
          <p className="text-white/60 text-xs">@{currentStory.username}</p>
        </div>
      </div>

      {/* Media */}
      <div
        className="w-full h-full max-w-lg mx-auto relative"
        onClick={togglePause}
      >
        {currentStory.media_type.startsWith("video") ? (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            onEnded={goToNext}
            onPause={() => setPaused(true)}
            onPlay={() => setPaused(false)}
            playsInline
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt=""
            className="w-full h-full object-contain"
          />
        )}

        {/* Play/Pause overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {paused && (
            <div className="bg-black/40 rounded-full p-3">
              <Play className="h-8 w-8 text-white" fill="white" />
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-8 left-0 right-0 text-center z-10">
          <p className="text-white text-sm bg-black/30 inline-block px-4 py-2 rounded-full">
            {currentStory.caption}
          </p>
        </div>
      )}
    </div>
  );
}


