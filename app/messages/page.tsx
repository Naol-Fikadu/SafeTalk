'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Image as ImageIcon,
  Paperclip,
  Send,
  Smile,
  Check,
  CheckCheck,
  User,
  Users,
  Archive,
  Trash2,
  Bell,
  BellOff,
  Mic,
  Camera,
  ChevronLeft,
  MessageCircle,
  X,
  Loader2,
  Edit,
  Copy,
  Download,
  ArrowLeft,
  Menu,
  LogOut,
  Settings,
  UserPlus,
  UserMinus,
  Hash,
  Globe,
  Lock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { toast } from 'react-hot-toast';
import { pusherClient } from '@/lib/pusher';

// ==============================================
// INTERFACES
// ==============================================

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: 'text' | 'image' | 'video' | 'file' | 'audio';
  media_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  is_read: boolean;
  created_at: string;
  edited_at?: string;
  sender?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  reactions?: Array<{
    user_id: string;
    reaction: string;
    created_at: string;
    user?: {
      username: string;
      avatar_url: string;
    };
  }>;
  read_receipts?: Array<{
    user_id: string;
    read_at: string;
  }>;
}

interface Participant {
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  is_muted: boolean;
  is_archived: boolean;
  joined_at: string;
  last_read_at?: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_online: boolean;
    last_seen?: string;
  };
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  participants: Participant[];
  unread_count: number;
  is_archived?: boolean;
  is_muted?: boolean;
}

interface SearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_following?: boolean;
  is_online?: boolean;
  last_seen?: string;
  type?: 'user' | 'group';
  members_count?: number;
  is_member?: boolean;
}

// ==============================================
// MAIN MESSAGES PAGE COMPONENT
// ==============================================

export default function MessagesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');

  // State Management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true); // Always show sidebar on desktop
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ==============================================
  // EFFECTS
  // ==============================================

  // Fetch conversations on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
    }
  }, [session]);

  // Fetch conversation details when conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
      fetchMessages(conversationId);
      // Don't hide sidebar on desktop, only on mobile
      if (window.innerWidth < 768) {
        setShowMobileSidebar(false);
      }
    }
  }, [conversationId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pusher real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id || !pusherClient) return;

    const channel = pusherClient.subscribe(`user-${session.user.id}`);
    
    channel.bind('new-conversation-message', (data: any) => {
      if (data.conversationId !== conversationId) {
        fetchConversations();
      }
    });

    channel.bind('conversation-updated', () => {
      fetchConversations();
    });

    channel.bind('user-online', (data: { userId: string; isOnline: boolean }) => {
      updateUserOnlineStatus(data.userId, data.isOnline);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [session, conversationId]);

  // Conversation-specific Pusher subscriptions
  useEffect(() => {
    if (!conversationId || !session?.user?.id || !pusherClient) return;

    const channel = pusherClient.subscribe(`conversation-${conversationId}`);
    
    channel.bind('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      fetchConversations();
    });

    channel.bind('message-updated', (data: { messageId: string; content: string }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId 
            ? { ...msg, content: data.content, edited_at: new Date().toISOString() } 
            : msg
        )
      );
    });

    channel.bind('message-deleted', (data: { messageId: string }) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    channel.bind('typing-indicator', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== session.user.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, session]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus message input when conversation changes
  useEffect(() => {
    if (conversationId && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [conversationId]);

  // ==============================================
  // API FUNCTIONS
  // ==============================================

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      // Log for debugging
      console.log('Fetched conversations:', data.length);
      data.forEach((conv: Conversation) => {
        console.log(`Conversation ${conv.id}:`, {
          type: conv.type,
          name: getConversationName(conv),
          participants: conv.participants.map(p => p.user_id),
          currentUserIncluded: conv.participants.some(p => p.user_id === session?.user?.id)
        });
      });
      
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setCurrentConversation(data);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          messageType: 'text',
        }),
      });

      if (response.ok) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      toast.success('Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      toast.success('Message updated');
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast.error('Failed to edit message');
    }
  };

  const addReaction = async (messageId: string, reaction: string) => {
    try {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction }),
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleTyping = () => {
    if (!conversationId || !session?.user?.id) return;

    if (!isTyping) {
      setIsTyping(true);
      fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, isTyping: true }),
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, isTyping: false }),
      });
    }, 2000);
  };

  const search = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/messages/search?q=${encodeURIComponent(query)}&type=users`);
      const users = await response.json();
      setSearchResults(users.map((u: any) => ({ ...u, type: 'user' })));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const createDirectChat = async (userId: string) => {
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'direct', 
          participantIds: [userId] 
        }),
      });

      if (response.ok) {
        const conversation = await response.json();
        router.push(`/messages?conversation=${conversation.id}`);
        setShowNewChatModal(false);
        resetNewChatModal();
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create chat');
    }
  };

  const createGroupChat = async () => {
    if (selectedUsers.length < 2) {
      toast.error('Select at least 2 users');
      return;
    }

    setIsCreatingGroup(true);
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'group',
          participantIds: selectedUsers,
          name: groupName || `${session?.user?.name}'s Group`,
        }),
      });

      if (response.ok) {
        const conversation = await response.json();
        router.push(`/messages?conversation=${conversation.id}`);
        setShowNewChatModal(false);
        resetNewChatModal();
        toast.success('Group created successfully');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const archiveConversation = async () => {
    if (!currentConversation) return;
    router.push('/messages');
    toast.success('Conversation archived');
  };

  const muteConversation = async () => {
    if (!currentConversation) return;
    toast.success(currentConversation.is_muted ? 'Unmuted' : 'Muted');
  };

  const leaveGroup = async () => {
    if (!currentConversation) return;
    router.push('/messages');
    toast.success('Left group');
  };

  // ==============================================
  // HELPER FUNCTIONS
  // ==============================================

  const resetNewChatModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName('');
  };

  const updateUserOnlineStatus = (userId: string, isOnline: boolean) => {
    setConversations(prev =>
      prev.map(conv => ({
        ...conv,
        participants: conv.participants.map(p =>
          p.user_id === userId
            ? { ...p, user: { ...p.user, is_online: isOnline } }
            : p
        ),
      }))
    );

    if (currentConversation) {
      setCurrentConversation({
        ...currentConversation,
        participants: currentConversation.participants.map(p =>
          p.user_id === userId
            ? { ...p, user: { ...p.user, is_online: isOnline } }
            : p
        ),
      });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      return conversation.participants.find(p => p.user_id !== session?.user?.id)?.user;
    }
    return null;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    
    const otherUser = getOtherParticipant(conversation);
    if (otherUser) {
      return otherUser.full_name || otherUser.username || 'User';
    }
    
    // Fallback if other user not found
    if (conversation.participants?.length === 1) {
      return conversation.participants[0].user.full_name || conversation.participants[0].user.username || 'User';
    }
    
    return 'Chat';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.avatar_url || '';
    }
    const otherUser = getOtherParticipant(conversation);
    return otherUser?.avatar_url || '';
  };

  const getConversationStatus = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherUser = getOtherParticipant(conversation);
      if (otherUser?.is_online) {
        return { text: 'Active now', color: 'text-green-500' };
      } else if (otherUser?.last_seen) {
        return { 
          text: `Last seen ${formatDistanceToNow(new Date(otherUser.last_seen), { addSuffix: true })}`,
          color: 'text-gray-500'
        };
      }
      return { text: 'Offline', color: 'text-gray-500' };
    } else {
      return { 
        text: `${conversation.participants.length} members`,
        color: 'text-gray-500'
      };
    }
  };

  // Update filtered conversations with new categories
  const filteredConversations = conversations.filter(conv => {
    // First, ensure the current user is in participants
    const userIsParticipant = conv.participants?.some(p => p.user_id === session?.user?.id);
    
    if (!userIsParticipant) {
      console.warn('Conversation without current user as participant:', conv.id);
      return false; // Don't show conversations where user isn't a participant
    }

    if (activeTab === 'unread') return conv.unread_count > 0;
    if (activeTab === 'direct') return conv.type === 'direct';
    if (activeTab === 'groups') return conv.type === 'group';
    return !conv.is_archived; // 'all' tab
  });

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) return 'Today';
    if (isYesterday(messageDate)) return 'Yesterday';
    return format(messageDate, 'MMMM d, yyyy');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate unread count for the badge
  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  // ==============================================
  // RENDER
  // ==============================================

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to Messages
          </h2>
          <p className="text-gray-500 mb-6 max-w-md">
            Sign in to start chatting with friends and create group conversations
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            size="lg"
          >
            Login to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <div className="flex h-full max-w-7xl mx-auto relative">
        {/* Mobile Menu Button */}
        {conversationId && (
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push('/dashboard/user')}
          className="fixed top-4 right-4 z-50 p-2.5 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden md:inline text-sm font-medium">Dashboard</span>
        </button>

        {/* Chat List Sidebar - Always visible on desktop */}
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ 
            x: showMobileSidebar ? 0 : -300,
            opacity: showMobileSidebar ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className={`${
            showMobileSidebar ? 'block' : 'hidden md:block'
          } md:block absolute md:relative z-40 w-full md:w-96 h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Messages
              </h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/messages/diagnose')}
                  className="hover:bg-purple-100 dark:hover:bg-purple-900/20"
                  title="Diagnose"
                >
                  <AlertTriangle className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewChatModal(true)}
                  className="hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-600 transition-all rounded-full"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages or users..."
                className="pl-9 bg-gray-100/50 dark:bg-gray-700/50 border-0 focus:ring-2 focus:ring-purple-600/20 rounded-full"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  search(e.target.value);
                }}
              />
            </div>
          </div>

          {/* Tabs - Updated with 4 tabs: All, Unread, Direct, Groups */}
          <div className="px-4 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 dark:bg-gray-700/50 p-1 rounded-xl">
                <TabsTrigger value="all" className="text-xs md:text-sm rounded-lg">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs md:text-sm rounded-lg relative">
                  Unread
                  {totalUnread > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="direct" className="text-xs md:text-sm rounded-lg">
                  Direct
                </TabsTrigger>
                <TabsTrigger value="groups" className="text-xs md:text-sm rounded-lg">
                  Groups
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2">
            <AnimatePresence>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 px-4"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-gray-500 mb-2">
                    {activeTab === 'all' && 'No conversations yet'}
                    {activeTab === 'unread' && 'No unread messages'}
                    {activeTab === 'direct' && 'No direct messages'}
                    {activeTab === 'groups' && 'No group chats'}
                  </p>
                  <Button
                    onClick={() => setShowNewChatModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </motion.div>
              ) : (
                filteredConversations.map((conversation) => (
                  <ChatListItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversationId === conversation.id}
                    onClick={() => {
                      router.push(`/messages?conversation=${conversation.id}`);
                      // On mobile, hide sidebar when conversation is selected
                      if (window.innerWidth < 768) {
                        setShowMobileSidebar(false);
                      }
                    }}
                    currentUserId={session.user.id}
                    name={getConversationName(conversation)}
                    avatar={getConversationAvatar(conversation)}
                    status={getConversationStatus(conversation)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Chat Window */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${
            conversationId ? 'flex' : 'hidden md:flex'
          } flex-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl flex-col relative`}
        >
          {conversationId && currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center space-x-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-full flex-shrink-0"
                    onClick={() => {
                      setShowMobileSidebar(true);
                    }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <div className="relative flex-shrink-0">
                    {currentConversation.type === 'group' ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <Avatar
                        src={getConversationAvatar(currentConversation)}
                        alt={getConversationName(currentConversation)}
                        size="lg"
                        className="ring-2 ring-purple-600/20"
                      />
                    )}
                    {getOtherParticipant(currentConversation)?.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-lg truncate">
                      {getConversationName(currentConversation)}
                    </h2>
                    <p className={`text-xs truncate ${getConversationStatus(currentConversation).color}`}>
                      {getConversationStatus(currentConversation).text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  {currentConversation.type === 'group' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowGroupInfo(true)}
                      className="hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-full"
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-full"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {currentConversation.type === 'direct' && (
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={muteConversation} className="cursor-pointer">
                        {currentConversation.is_muted ? (
                          <Bell className="h-4 w-4 mr-2" />
                        ) : (
                          <BellOff className="h-4 w-4 mr-2" />
                        )}
                        {currentConversation.is_muted ? 'Unmute' : 'Mute'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={archiveConversation} className="cursor-pointer">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      {currentConversation.type === 'group' && (
                        <DropdownMenuItem onClick={leaveGroup} className="cursor-pointer text-orange-600">
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave Group
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.map((message, index) => {
                  const showDate = index === 0 || 
                    format(new Date(message.created_at), 'yyyy-MM-dd') !== 
                    format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd');

                  const showAvatar = index === 0 || 
                    messages[index - 1]?.sender_id !== message.sender_id;

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full text-xs text-gray-600 dark:text-gray-400">
                            {formatMessageDate(message.created_at)}
                          </span>
                        </div>
                      )}
                      <MessageBubble
                        message={message}
                        isOwn={message.sender_id === session.user.id}
                        showAvatar={showAvatar}
                        avatar={message.sender?.avatar_url}
                        senderName={message.sender?.full_name || message.sender?.username}
                        onReact={(reaction) => addReaction(message.id, reaction)}
                        onDelete={deleteMessage}
                        onEdit={(id, content) => {
                          setEditingMessage(message);
                          setEditContent(content);
                        }}
                        editing={editingMessage?.id === message.id}
                        editContent={editContent}
                        onEditChange={setEditContent}
                        onEditSubmit={() => {
                          editMessage(message.id, editContent);
                          setEditingMessage(null);
                          setEditContent('');
                        }}
                        onEditCancel={() => {
                          setEditingMessage(null);
                          setEditContent('');
                        }}
                      />
                    </div>
                  );
                })}
                
                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex items-center space-x-2 text-gray-500 ml-12">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="text-sm">Someone is typing...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <Textarea
                      ref={messageInputRef}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={handleKeyPress}
                      className="min-h-[40px] max-h-[120px] resize-none bg-gray-100/50 dark:bg-gray-700/50 border-0 focus:ring-2 focus:ring-purple-600/20 rounded-2xl pr-12"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      size="icon"
                      className="absolute right-2 bottom-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full h-8 w-8 shadow-lg"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <MessageCircle className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Your Messages
                </h3>
                <p className="text-gray-500 mb-6">
                  Select a conversation to start chatting or create a new one
                </p>
                <Button
                  onClick={() => setShowNewChatModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Message
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => {
          setShowNewChatModal(false);
          resetNewChatModal();
        }}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          search(value);
        }}
        searchResults={searchResults}
        isSearching={isSearching}
        selectedUsers={selectedUsers}
        onToggleUser={(userId) => {
          setSelectedUsers(prev =>
            prev.includes(userId)
              ? prev.filter(id => id !== userId)
              : [...prev, userId]
          );
        }}
        groupName={groupName}
        onGroupNameChange={setGroupName}
        onCreateDirect={createDirectChat}
        onCreateGroup={createGroupChat}
        isCreatingGroup={isCreatingGroup}
      />

      {/* Group Info Modal */}
      {currentConversation?.type === 'group' && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          conversation={currentConversation}
          currentUserId={session.user.id}
          onLeaveGroup={leaveGroup}
        />
      )}
    </div>
  );
}

// ==============================================
// CHAT LIST ITEM COMPONENT
// ==============================================

function ChatListItem({ conversation, isSelected, onClick, currentUserId, name, avatar, status }: any) {
  const otherParticipant = conversation.type === 'direct'
    ? conversation.participants.find((p: any) => p.user_id !== currentUserId)?.user
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-3 rounded-xl mb-2 cursor-pointer transition-all ${
        isSelected
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
          : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          {conversation.type === 'group' ? (
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          ) : (
            <Avatar 
              src={otherParticipant?.avatar_url || avatar} 
              alt={name} 
              size="md" 
              className="ring-2 ring-white dark:ring-gray-800" 
            />
          )}
          {otherParticipant?.is_online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`font-semibold truncate ${isSelected ? 'text-white' : ''}`}>
              {name}
            </p>
            {conversation.last_message && (
              <span className={`text-xs ml-2 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <p className={`text-sm truncate max-w-[150px] ${
              isSelected ? 'text-white/80' : 'text-gray-500'
            }`}>
              {conversation.last_message?.content || 'No messages yet'}
            </p>
            {conversation.unread_count > 0 && !isSelected && (
              <Badge variant="destructive" className="ml-2">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
          
          <p className={`text-xs mt-1 ${isSelected ? 'text-white/60' : status.color}`}>
            {status.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ==============================================
// MESSAGE BUBBLE COMPONENT
// ==============================================

function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar, 
  avatar, 
  senderName, 
  onReact, 
  onDelete, 
  onEdit,
  editing,
  editContent,
  onEditChange,
  onEditSubmit,
  onEditCancel
}: any) {
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

  // Safe defaults
  const safeMessage = {
    ...message,
    content: message?.content || '',
    message_type: message?.message_type || 'text',
    created_at: message?.created_at || new Date().toISOString(),
    sender: message?.sender || { avatar_url: '' },
    reactions: message?.reactions || [],
    edited_at: message?.edited_at,
  };

  const messageTime = format(new Date(safeMessage.created_at), 'h:mm a');

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
          {showAvatar && !isOwn && (
            <Avatar src={avatar} alt="User" size="sm" className="ring-2 ring-purple-600/20" />
          )}
          <div className="relative w-full">
            <Textarea
              value={editContent}
              onChange={(e) => onEditChange(e.target.value)}
              className="min-h-[80px] bg-gray-100 dark:bg-gray-700 rounded-2xl p-3 text-sm"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
              <Button size="sm" variant="ghost" onClick={onEditCancel}>Cancel</Button>
              <Button size="sm" onClick={onEditSubmit} className="bg-gradient-to-r from-purple-600 to-pink-600">
                Save
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}
    >
      <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {showAvatar && !isOwn && (
          <Avatar src={avatar} alt="User" size="sm" className="ring-2 ring-purple-600/20" />
        )}
        
        <div className="relative">
          {/* Sender Name for group chats */}
          {!isOwn && showAvatar && senderName && (
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ml-1">
              {senderName}
            </p>
          )}

          {/* Message Content */}
          {safeMessage.message_type === 'text' && (
            <div
              className={`p-3 rounded-2xl ${
                isOwn
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
              } shadow-md`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{safeMessage.content}</p>
              {safeMessage.edited_at && (
                <span className="text-xs opacity-70 mt-1 block">(edited)</span>
              )}
              <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                isOwn ? 'text-white/70' : 'text-gray-500'
              }`}>
                <span>{messageTime}</span>
                {isOwn && (
                  <>
                    {safeMessage.is_read ? (
                      <CheckCheck className="h-3 w-3 text-blue-300" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Message Actions */}
          <div className={`absolute top-0 ${isOwn ? 'left-0' : 'right-0'} -translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-1 mb-1 z-10`}>
            <DropdownMenu open={showReactions} onOpenChange={setShowReactions}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full shadow-lg"
                >
                  <Smile className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="flex p-2 min-w-[200px] justify-center flex-wrap gap-1">
                {reactions.map((reaction) => (
                  <button
                    key={reaction}
                    onClick={() => {
                      onReact(reaction);
                      setShowReactions(false);
                    }}
                    className="w-8 h-8 hover:scale-125 transition-all text-lg rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    {reaction}
                  </button>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isOwn && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full shadow-lg"
                  onClick={() => onEdit(message.id, message.content)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full shadow-lg"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              </>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full shadow-lg"
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                toast.success('Copied!');
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4 z-20">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 max-w-xs">
                <p className="text-sm font-medium mb-3">Delete this message?</p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => { onDelete(message.id); setShowDeleteConfirm(false); }} className="flex-1 bg-red-600 hover:bg-red-700">
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==============================================
// NEW CHAT MODAL COMPONENT
// ==============================================

function NewChatModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  selectedUsers,
  onToggleUser,
  groupName,
  onGroupNameChange,
  onCreateDirect,
  onCreateGroup,
  isCreatingGroup,
}: any) {
  const [mode, setMode] = useState<'direct' | 'group'>('direct');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            New Message
          </DialogTitle>
          <DialogDescription>
            Start a new conversation or create a group chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-700/50 p-1 rounded-xl">
            <button
              onClick={() => setMode('direct')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'direct'
                  ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Direct Message
            </button>
            <button
              onClick={() => setMode('group')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'group'
                  ? 'bg-white dark:bg-gray-800 text-purple-600 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              Group Chat
            </button>
          </div>

          {mode === 'group' && (
            <Input
              placeholder="Group name (optional)"
              value={groupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
              className="bg-gray-100/50 dark:bg-gray-700/50 border-0 focus:ring-2 focus:ring-purple-600/20"
            />
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${mode === 'direct' ? 'users' : 'users or groups'}...`}
              className="pl-9 bg-gray-100/50 dark:bg-gray-700/50 border-0 focus:ring-2 focus:ring-purple-600/20"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
            />
          </div>

          {/* Selected Users for group */}
          {mode === 'group' && selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((userId: string) => {
                const user = searchResults.find((r: any) => r.id === userId);
                return (
                  <Badge key={userId} variant="secondary" className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                    <span>{user?.full_name || user?.username}</span>
                    <X className="h-3 w-3 cursor-pointer" onClick={() => onToggleUser(userId)} />
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result: any) => (
                <div
                  key={result.id}
                  className={`flex items-center justify-between p-3 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 cursor-pointer transition-all ${
                    selectedUsers.includes(result.id) ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-600' : ''
                  }`}
                  onClick={() => mode === 'group' ? onToggleUser(result.id) : onCreateDirect(result.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar src={result.avatar_url} alt={result.username} size="md" />
                    <div>
                      <p className="font-medium">{result.full_name || result.username}</p>
                      <p className="text-sm text-gray-500">@{result.username}</p>
                    </div>
                  </div>
                  {result.is_online && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              ))
            ) : searchQuery ? (
              <p className="text-center text-gray-500 py-4">No users found</p>
            ) : (
              <p className="text-center text-gray-500 py-4">Start typing to search...</p>
            )}
          </div>

          {/* Create Group Button */}
          {mode === 'group' && selectedUsers.length >= 2 && (
            <Button
              onClick={onCreateGroup}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              isLoading={isCreatingGroup}
            >
              Create Group Chat ({selectedUsers.length} members)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==============================================
// GROUP INFO MODAL COMPONENT
// ==============================================

function GroupInfoModal({ isOpen, onClose, conversation, currentUserId, onLeaveGroup }: any) {
  if (!isOpen) return null;

  const isAdmin = conversation.participants.find((p: any) => p.user_id === currentUserId)?.role === 'admin';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Group Info
          </DialogTitle>
          <DialogDescription>
            {conversation.participants.length} members • 
            Created {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Info */}
          <div className="flex items-center space-x-4">
            {conversation.avatar_url ? (
              <img src={conversation.avatar_url} alt={conversation.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{conversation.name || 'Group Chat'}</h3>
              <p className="text-sm text-gray-500">
                {isAdmin ? 'You are an admin' : 'You are a member'}
              </p>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h4 className="font-medium mb-2">Members</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conversation.participants.map((participant: any) => {
                const isCurrentUser = participant.user_id === currentUserId;
                return (
                  <div key={participant.user_id} className="flex items-center justify-between p-2 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar src={participant.user.avatar_url} alt={participant.user.username} size="sm" />
                        {participant.user.is_online && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {participant.user.full_name || participant.user.username}
                          {isCurrentUser && ' (You)'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDistanceToNow(new Date(participant.joined_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {participant.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave Group Button */}
          {!isAdmin && (
            <Button
              onClick={onLeaveGroup}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Group
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}