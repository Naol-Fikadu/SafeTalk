"use client";

interface ReactionPickerProps {
  onSelect: (reaction: string) => void;
  onClose: () => void;
}

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const reactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 flex space-x-1">
      {reactions.map((reaction) => (
        <button
          key={reaction}
          onClick={() => onSelect(reaction)}
          className="w-8 h-8 hover:scale-125 transition text-xl"
        >
          {reaction}
        </button>
      ))}
    </div>
  );
}
