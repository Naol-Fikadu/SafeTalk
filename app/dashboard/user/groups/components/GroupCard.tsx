// app/(dashboard)/user/groups/components/GroupCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, Lock, Globe, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "react-hot-toast";

interface GroupCardProps {
  group: any;
  onUpdate: () => void;
}

export function GroupCard({ group, onUpdate }: GroupCardProps) {
  const handleJoin = async () => {
    try {
      const response = await fetch(`/api/groups/${group.id}/join`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success(`Joined ${group.name}`);
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to join group");
    }
  };

  const handleLeave = async () => {
    try {
      const response = await fetch(`/api/groups/${group.id}/leave`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success(`Left ${group.name}`);
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to leave group");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition">
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500">
        {group.cover_url && (
          <Image
            src={group.cover_url}
            alt={group.name}
            fill
            className="object-cover"
          />
        )}

        {/* Avatar */}
        <div className="absolute -bottom-8 left-4">
          <Avatar
            src={group.avatar_url}
            alt={group.name}
            size="lg"
            className="border-4 border-white dark:border-gray-800"
          />
        </div>

        {/* Privacy Badge */}
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="bg-black/50 text-white border-0"
          >
            {group.privacy === "private" ? (
              <Lock className="h-3 w-3 mr-1" />
            ) : (
              <Globe className="h-3 w-3 mr-1" />
            )}
            {group.privacy}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-10">
        <Link href={`/groups/${group.id}`}>
          <h3 className="font-semibold text-lg mb-1 hover:text-primary transition">
            {group.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {group.description}
        </p>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {group.members_count.toLocaleString()} members
          </div>
          <div className="flex items-center">
            <span>{group.posts_count} posts</span>
          </div>
        </div>

        {/* Actions */}
        {group.is_member ? (
          <div className="flex space-x-2">
            <Button className="flex-1" asChild>
              <Link href={`/groups/${group.id}`}>View Group</Link>
            </Button>
            {group.role === "admin" ? (
              <Button variant="outline" asChild>
                <Link href={`/groups/${group.id}/manage`}>Manage</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={handleLeave}>
                Leave
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={handleJoin} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Join Group
          </Button>
        )}
      </div>
    </div>
  );
}
