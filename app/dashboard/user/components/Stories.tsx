"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Plus, Camera } from "lucide-react";
import { StoryViewer } from "./StoryViewer";
import { CreateStory } from "./CreateStory";

interface Story {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  media_url: string;
  viewed: boolean;
}

export function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const data = await fetch("/api/stories").then((res) => res.json());
      setStories(data);
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (index: number) => {
    setSelectedStory(index);
  };

  const handleStoryComplete = () => {
    if (selectedStory !== null && selectedStory < stories.length - 1) {
      setSelectedStory(selectedStory + 1);
    } else {
      setSelectedStory(null);
    }
  };
  

  const handleStoryViewed = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, viewed: true } : s))
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="w-16 h-3 mt-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Create Story Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 text-center cursor-pointer"
            onClick={() => setShowCreateStory(true)}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400 p-0.5">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="text-xs mt-1 block">Your Story</span>
          </motion.div>

          {/* Stories List */}
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 text-center cursor-pointer"
              onClick={() => handleStoryClick(index)}
            >
              <div
                className={`w-16 h-16 rounded-full p-0.5 ${
                  story.viewed
                    ? "bg-gray-300 dark:bg-gray-600"
                    : "bg-gradient-to-tr from-yellow-400 to-pink-400"
                }`}
              >
                <Avatar
                  src={story.avatar_url}
                  alt={story.username}
                  className="w-full h-full border-2 border-white dark:border-gray-800"
                />
              </div>
              <span className="text-xs mt-1 block truncate w-16">
                {story.full_name?.split(" ")[0] || story.username}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStory !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStory}
          onClose={() => setSelectedStory(null)}
          onComplete={handleStoryComplete}
          onStoryViewed={handleStoryViewed}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStory
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={fetchStories}
        />
      )}
    </>
  );
}


