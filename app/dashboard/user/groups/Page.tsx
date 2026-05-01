// app/(dashboard)/user/groups/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  Hash,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { CreateGroupModal } from "./components/CreateGroupModal";
import { GroupCard } from "./components/GroupCard";

interface Group {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  avatar_url: string;
  privacy: "public" | "private";
  members_count: number;
  posts_count: number;
  created_at: string;
  is_member: boolean;
  role?: "admin" | "moderator" | "member";
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const [discoverRes, myGroupsRes] = await Promise.all([
        fetch("/api/groups/discover"),
        fetch("/api/groups/my-groups"),
      ]);

      const discoverData = await discoverRes.json();
      const myGroupsData = await myGroupsRes.json();

      setGroups(discoverData);
      setMyGroups(myGroupsData);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredMyGroups = myGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse">
                <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Groups & Communities</h1>
            <p className="text-gray-500">
              Join communities that share your interests
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <div className="max-w-xl mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search groups..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-groups">My Groups</TabsTrigger>
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No groups found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search or create a new group
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GroupCard group={group} onUpdate={fetchGroups} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-groups">
            {filteredMyGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">
                  You haven't joined any groups yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Discover and join groups that interest you
                </p>
                <Button onClick={() => setActiveTab("discover")}>
                  Discover Groups
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GroupCard group={group} onUpdate={fetchGroups} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggested">
            {/* Similar structure for suggested groups */}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchGroups}
        />
      )}
    </div>
  );
}
