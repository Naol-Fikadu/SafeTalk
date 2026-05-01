'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Video,
  Heart,
  Share2,
  Bookmark,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';

interface EventCardProps {
  event: any;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isRsvped, setIsRsvped] = useState(false);

  const handleRsvp = async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, { method: 'POST' });
      const data = await res.json();
      setIsRsvped(data.attending);
      toast.success(data.attending ? 'You are attending!' : 'RSVP cancelled');
    } catch (error) {
      toast.error('Failed to RSVP');
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Event removed from saved' : 'Event saved!');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    toast.success('Link copied to clipboard!');
  };

  const startTime = new Date(event.start_time);
  const endTime = event.end_time ? new Date(event.end_time) : null;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 ${
        featured ? 'lg:col-span-2' : ''
      }`}>
        <div className="relative h-48 group">
          <Image
            src={event.cover_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-110 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Tags (if any) */}
          {event.tags && event.tags.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {event.tags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-black/50 text-white border-0">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Online Badge */}
          {event.is_online && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-purple-600 text-white border-0">
                <Video className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute bottom-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
            <Button
              size="sm"
              variant="ghost"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={handleSave}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-white' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Link href={`/events/${event.id}`}>
              <h3 className={`font-bold hover:text-purple-600 transition ${
                featured ? 'text-xl' : 'text-lg'
              }`}>
                {event.title}
              </h3>
            </Link>
            {event.max_attendees && (
              <Badge variant="outline" className="text-xs">
                {event.attendees_count || 0}/{event.max_attendees}
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {event.description}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-2 text-purple-600" />
              <span className="font-medium">{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center text-gray-500">
              <Clock className="h-4 w-4 mr-2 text-purple-600" />
              <span>
                {format(startTime, 'h:mm a')}
                {endTime && ` - ${format(endTime, 'h:mm a')}`}
              </span>
            </div>

            <div className="flex items-center text-gray-500">
              {event.is_online ? (
                <Globe className="h-4 w-4 mr-2 text-purple-600" />
              ) : (
                <MapPin className="h-4 w-4 mr-2 text-purple-600" />
              )}
              <span className="truncate">
                {event.is_online ? (event.meeting_url || 'Online event') : event.location}
              </span>
            </div>

            <div className="flex items-center text-gray-500">
              <Users className="h-4 w-4 mr-2 text-purple-600" />
              <span>{event.attendees_count || 0} attending</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Avatar src={event.organizer_avatar} alt={event.organizer_username} size="sm" />
              <span className="text-xs text-gray-500">
                by {event.organizer_name || event.organizer_username}
              </span>
            </div>
            
            <Button
              size="sm"
              onClick={handleRsvp}
              variant={isRsvped ? 'outline' : 'default'}
              className={isRsvped ? '' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'}
            >
              {isRsvped ? '✓ RSVPed' : 'RSVP'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}