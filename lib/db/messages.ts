import { pool } from './index';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: 'text' | 'image' | 'video' | 'file' | 'audio';
  media_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  metadata?: any;
  is_read: boolean;
  read_at?: string;
  is_deleted: boolean;
  edited_at?: string;
  created_at: string;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
  sender?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  reactions?: any[];
  read_receipts?: any[];
}

export interface Participant {
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

export interface Conversation {
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

export const messageQueries = {
  // Helper function to check if user is online
  isUserOnline(lastLogin: string): boolean {
    if (!lastLogin) return false;
    const lastLoginTime = new Date(lastLogin).getTime();
    const now = Date.now();
    return now - lastLoginTime < 5 * 60 * 1000;
  },

  // Fix missing participants - only add if user should be there
  async fixMissingParticipants(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      // Find conversations where user might be missing but should be included
      // Based on messages sent/received
      const missingConvs = await client.query(
        `SELECT DISTINCT c.id, c.type, c.created_by
        FROM conversations c
        WHERE (
          -- User created the conversation
          c.created_by = $1
          OR 
          -- User has sent messages in the conversation
          EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.conversation_id = c.id AND m.sender_id = $1
          )
          OR
          -- User has received messages in the conversation (for direct messages)
          EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.conversation_id = c.id AND m.receiver_id = $1
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM conversation_participants 
          WHERE conversation_id = c.id AND user_id = $1
        )`,
        [userId]
      );

      for (const conv of missingConvs.rows) {
        // Determine role based on whether user created the conversation
        const role = conv.created_by === userId ? 'admin' : 'member';
        
        // Add user as participant
        await client.query(
          `INSERT INTO conversation_participants 
          (conversation_id, user_id, role, joined_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT DO NOTHING`,
          [conv.id, userId, role]
        );

        console.log(`✅ Fixed: Added user ${userId} to conversation ${conv.id} as ${role}`);
      }

      if (missingConvs.rows.length > 0) {
        console.log(`Fixed ${missingConvs.rows.length} conversations for user ${userId}`);
      }
    } catch (error) {
      console.error('Error fixing missing participants:', error);
    } finally {
      client.release();
    }
  },

  // Get user's conversations - ONLY where user is a participant
// Get user's conversations - ONLY where user is a participant
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      // At the start of getUserConversations, add:
      await this.debugCheckConversations(userId);
      // First, check for and fix any conversations missing the current user
      await this.fixMissingParticipants(userId);
      
      // Get conversations where user is a participant - simplified query without row_to_json
      const result = await pool.query(
        `SELECT 
          c.*,
          (
            SELECT jsonb_build_object(
              'id', m.id,
              'content', m.content,
              'created_at', m.created_at,
              'sender_id', m.sender_id,
              'message_type', m.message_type,
              'is_read', m.is_read,
              'sender', jsonb_build_object(
                'id', u.id,
                'username', u.username,
                'full_name', u.full_name,
                'avatar_url', u.avatar_url
              )
            )
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = c.id AND m.is_deleted = false
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message,
          get_unread_count(c.id, $1) as unread_count
        FROM conversations c
        INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = $1 AND cp.is_archived = false
        ORDER BY c.updated_at DESC`,
        [userId]
      );

      const conversations = [];

      for (const row of result.rows) {
        // Get participants for each conversation with proper structure
        const participantsResult = await pool.query(
          `SELECT 
            cp.*,
            u.id as user_id,
            u.username,
            u.full_name,
            u.avatar_url,
            u.last_login
          FROM conversation_participants cp
          INNER JOIN users u ON cp.user_id = u.id
          WHERE cp.conversation_id = $1`,
          [row.id]
        );

        // Double-check that current user is in participants
        const hasCurrentUser = participantsResult.rows.some(p => p.user_id === userId);
        
        // Skip if current user is not in participants (shouldn't happen but just in case)
        if (!hasCurrentUser) {
          console.warn(`Conversation ${row.id} does not have user ${userId} as participant, skipping`);
          continue;
        }

        conversations.push({
          id: row.id,
          type: row.type,
          name: row.name,
          avatar_url: row.avatar_url,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_at: row.updated_at,
          unread_count: parseInt(row.unread_count) || 0,
          last_message: row.last_message,
          participants: participantsResult.rows.map(p => ({
            user_id: p.user_id,
            role: p.role,
            is_muted: p.is_muted || false,
            is_archived: p.is_archived || false,
            joined_at: p.joined_at,
            last_read_at: p.last_read_at,
            user: {
              id: p.user_id,
              username: p.username || 'unknown',
              full_name: p.full_name || p.username || 'User',
              avatar_url: p.avatar_url || '',
              is_online: this.isUserOnline(p.last_login),
              last_seen: p.last_login,
            },
          })),
        });
      }

      console.log(`Found ${conversations.length} conversations for user ${userId}`);
      return conversations;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  },

  // Get conversation with details
  // Get conversation with details
  async getConversationWithDetails(conversationId: string): Promise<Conversation | null> {
    try {
      const conversationResult = await pool.query(
        `SELECT * FROM conversations WHERE id = $1`,
        [conversationId]
      );

      if (conversationResult.rows.length === 0) {
        return null;
      }

      const conversation = conversationResult.rows[0];

      // Get participants with complete user details
      const participantsResult = await pool.query(
        `SELECT 
          cp.*,
          u.id as user_id,
          u.username,
          u.full_name,
          u.avatar_url,
          u.last_login
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = $1`,
        [conversationId]
      );

      // Get last message with sender details - using jsonb_build_object instead of row_to_json
      const lastMessageResult = await pool.query(
        `SELECT 
          jsonb_build_object(
            'id', m.id,
            'content', m.content,
            'created_at', m.created_at,
            'sender_id', m.sender_id,
            'message_type', m.message_type,
            'is_read', m.is_read,
            'sender', jsonb_build_object(
              'id', u.id,
              'username', u.username,
              'full_name', u.full_name,
              'avatar_url', u.avatar_url
            )
          ) as last_message
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1 AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT 1`,
        [conversationId]
      );

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        avatar_url: conversation.avatar_url,
        created_by: conversation.created_by,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        unread_count: 0,
        last_message: lastMessageResult.rows[0]?.last_message || null,
        participants: participantsResult.rows.map(p => ({
          user_id: p.user_id,
          role: p.role,
          is_muted: p.is_muted || false,
          is_archived: p.is_archived || false,
          joined_at: p.joined_at,
          last_read_at: p.last_read_at,
          user: {
            id: p.user_id,
            username: p.username || 'unknown',
            full_name: p.full_name || p.username || 'User',
            avatar_url: p.avatar_url || '',
            is_online: this.isUserOnline(p.last_login),
            last_seen: p.last_login,
          },
        })),
      };
    } catch (error) {
      console.error('Error in getConversationWithDetails:', error);
      return null;
    }
  },

  // Get messages for a conversation
  async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: string
  ): Promise<Message[]> {
    try {
      let query = `
        SELECT m.*,
              u.username as sender_username,
              u.full_name as sender_full_name,
              u.avatar_url as sender_avatar,
              m.reply_to,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'user_id', mr.user_id,
                    'reaction', mr.reaction,
                    'created_at', mr.created_at,
                    'user', json_build_object(
                      'username', ru.username,
                      'avatar_url', ru.avatar_url
                    )
                  )
                )
                FROM message_reactions mr
                JOIN users ru ON mr.user_id = ru.id
                WHERE mr.message_id = m.id
                ), '[]'::json) as reactions,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'user_id', mrr.user_id,
                    'read_at', mrr.read_at
                  )
                )
                FROM message_read_receipts mrr
                WHERE mrr.message_id = m.id
                ), '[]'::json) as read_receipts
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1 AND m.is_deleted = false
      `;

      const params: any[] = [conversationId];

      if (before) {
        query += ` AND m.created_at < $2`;
        params.push(before);
      }

      query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await pool.query(query, params);

      // Mark messages as read
      await this.markMessagesAsRead(conversationId, userId);

      // Map the results with safe defaults
      return result.rows.reverse().map(row => ({
        id: row.id,
        conversation_id: row.conversation_id,
        sender_id: row.sender_id,
        content: row.content || '',
        message_type: row.message_type || 'text',
        media_url: row.media_url,
        file_name: row.file_name,
        file_size: row.file_size,
        mime_type: row.mime_type,
        is_read: row.is_read || false,
        created_at: row.created_at,
        edited_at: row.edited_at,
        reply_to: row.reply_to,
        sender: {
          id: row.sender_id,
          username: row.sender_username || 'unknown',
          full_name: row.sender_full_name || row.sender_username || 'User',
          avatar_url: row.sender_avatar || '',
        },
        reactions: row.reactions || [],
        read_receipts: row.read_receipts || [],
      }));
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  },

  // Add this temporary debug function
  async debugCheckConversations(userId: string): Promise<void> {
    try {
      // Check if user exists
      const userCheck = await pool.query('SELECT id, username FROM users WHERE id = $1', [userId]);
      console.log('Current user:', userCheck.rows[0]);

      // Check all conversations
      const allConvs = await pool.query(`
        SELECT c.id, c.type, c.name, 
          array_agg(cp.user_id) as participant_ids
        FROM conversations c
        LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
        GROUP BY c.id
      `);
      console.log('All conversations in DB:', allConvs.rows.length);

      // Check conversations where user is participant
      const userConvs = await pool.query(`
        SELECT c.id, c.type, c.name
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = $1
      `, [userId]);
      console.log(`Conversations where user ${userId} is participant:`, userConvs.rows.length);
      
      if (userConvs.rows.length === 0) {
        console.log('No conversations found for user. Check if user has any messages or created any conversations.');
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  },
  // Send a message
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'video' | 'file' | 'audio' = 'text',
    mediaUrl?: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string,
    metadata?: any,
    replyToId?: string
  ): Promise<Message | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const messageId = uuidv4();
      
      // Get conversation type and participants
      const convType = await client.query(
        `SELECT type FROM conversations WHERE id = $1`,
        [conversationId]
      );

      let receiverId = null;
      
      // For direct messages, set receiver_id
      if (convType.rows[0]?.type === 'direct') {
        const participants = await client.query(
          `SELECT user_id FROM conversation_participants 
          WHERE conversation_id = $1 AND user_id != $2`,
          [conversationId, senderId]
        );
        receiverId = participants.rows[0]?.user_id || null;
      }

      // Get reply info if provided
      let replyToData = null;
      if (replyToId) {
        const replyResult = await client.query(
          `SELECT content, sender_id FROM messages WHERE id = $1`,
          [replyToId]
        );
        if (replyResult.rows.length > 0) {
          const replySender = await client.query(
            `SELECT full_name, username FROM users WHERE id = $1`,
            [replyResult.rows[0].sender_id]
          );
          replyToData = {
            id: replyToId,
            content: replyResult.rows[0].content,
            sender_name: replySender.rows[0].full_name || replySender.rows[0].username,
          };
        }
      }

      // Insert message - handle both with and without reply_to
      let result;
      
      // Build the query dynamically based on whether we have replyToData
      if (receiverId) {
        // Direct message with receiver
        if (replyToData) {
          // With reply
          result = await client.query(
            `INSERT INTO messages (
              id, conversation_id, sender_id, receiver_id, content, message_type,
              media_url, file_name, file_size, mime_type, metadata, is_read, created_at,
              reply_to
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, NOW(), $12)
            RETURNING *`,
            [
              messageId, conversationId, senderId, receiverId, content, messageType,
              mediaUrl, fileName, fileSize, mimeType, metadata, replyToData,
            ]
          );
        } else {
          // Without reply
          result = await client.query(
            `INSERT INTO messages (
              id, conversation_id, sender_id, receiver_id, content, message_type,
              media_url, file_name, file_size, mime_type, metadata, is_read, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, NOW())
            RETURNING *`,
            [
              messageId, conversationId, senderId, receiverId, content, messageType,
              mediaUrl, fileName, fileSize, mimeType, metadata,
            ]
          );
        }
      } else {
        // Group message (no receiver)
        if (replyToData) {
          // With reply
          result = await client.query(
            `INSERT INTO messages (
              id, conversation_id, sender_id, content, message_type,
              media_url, file_name, file_size, mime_type, metadata, is_read, created_at,
              reply_to
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW(), $11)
            RETURNING *`,
            [
              messageId, conversationId, senderId, content, messageType,
              mediaUrl, fileName, fileSize, mimeType, metadata, replyToData,
            ]
          );
        } else {
          // Without reply
          result = await client.query(
            `INSERT INTO messages (
              id, conversation_id, sender_id, content, message_type,
              media_url, file_name, file_size, mime_type, metadata, is_read, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW())
            RETURNING *`,
            [
              messageId, conversationId, senderId, content, messageType,
              mediaUrl, fileName, fileSize, mimeType, metadata,
            ]
          );
        }
      }

      // Update conversation's updated_at
      await client.query(
        `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
        [conversationId]
      );

      await client.query('COMMIT');

      // Get sender details
      const senderResult = await client.query(
        `SELECT id, username, full_name, avatar_url FROM users WHERE id = $1`,
        [senderId]
      );

      const message = {
        ...result.rows[0],
        sender: senderResult.rows[0],
      };

      return message;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in sendMessage:', error);
      return null;
    } finally {
      client.release();
    }
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update last_read_at for participant
      await client.query(
        `UPDATE conversation_participants
         SET last_read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      // Add read receipts for unread messages
      await client.query(
        `INSERT INTO message_read_receipts (message_id, user_id)
         SELECT m.id, $2
         FROM messages m
         WHERE m.conversation_id = $1
           AND m.sender_id != $2
           AND m.is_read = false
           AND NOT EXISTS (
             SELECT 1 FROM message_read_receipts
             WHERE message_id = m.id AND user_id = $2
           )`,
        [conversationId, userId]
      );

      // Update messages is_read flag
      await client.query(
        `UPDATE messages
         SET is_read = true,
             read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1
           AND sender_id != $2
           AND is_read = false`,
        [conversationId, userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in markMessagesAsRead:', error);
    } finally {
      client.release();
    }
  },

  // Search users for new chat
  async searchUsers(query: string, currentUserId: string, limit: number = 10): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, username, full_name, avatar_url, last_login,
                EXISTS(SELECT 1 FROM follows 
                       WHERE follower_id = $2 AND following_id = users.id) as is_following
         FROM users
         WHERE (username ILIKE $1 OR full_name ILIKE $1)
           AND id != $2
           AND NOT EXISTS(SELECT 1 FROM blocks 
                         WHERE user_id = $2 AND blocked_user_id = users.id)
         LIMIT $3`,
        [`%${query}%`, currentUserId, limit]
      );

      return result.rows.map(user => ({
        ...user,
        is_online: this.isUserOnline(user.last_login),
      }));
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  },
  
  // Delete a message (soft delete)
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE messages
        SET is_deleted = true
        WHERE id = $1 AND sender_id = $2`,
        [messageId, userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      return false;
    }
  },

  // Edit a message
  async editMessage(messageId: string, userId: string, content: string): Promise<Message | null> {
    try {
      const result = await pool.query(
        `UPDATE messages
        SET content = $1, edited_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND sender_id = $3 AND is_deleted = false
        RETURNING *`,
        [content, messageId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      // Get sender details
      const senderResult = await pool.query(
        `SELECT id, username, full_name, avatar_url FROM users WHERE id = $1`,
        [userId]
      );

      return {
        ...result.rows[0],
        sender: senderResult.rows[0],
      };
    } catch (error) {
      console.error('Error in editMessage:', error);
      return null;
    }
  },

  // Create a new conversation
  async createConversation(
    type: 'direct' | 'group',
    participantIds: string[],
    createdBy: string,
    name?: string,
    avatarUrl?: string
  ): Promise<Conversation | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const conversationId = uuidv4();
      
      await client.query(
        `INSERT INTO conversations (id, type, name, avatar_url, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [conversationId, type, name, avatarUrl, createdBy]
      );

      // IMPORTANT: Ensure the creator is included in participants
      const allParticipants = [...new Set([createdBy, ...participantIds])];

      for (const userId of allParticipants) {
        const role = userId === createdBy ? 'admin' : 'member';
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
           VALUES ($1, $2, $3, NOW())`,
          [conversationId, userId, role]
        );
      }

      await client.query('COMMIT');

      return this.getConversationWithDetails(conversationId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in createConversation:', error);
      return null;
    } finally {
      client.release();
    }
  },

  // Add participants to group
  async addParticipants(conversationId: string, userIds: string[], addedBy: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user is admin
      const adminCheck = await client.query(
        `SELECT role FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, addedBy]
      );

      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        throw new Error('Not authorized to add participants');
      }

      for (const userId of userIds) {
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
           VALUES ($1, $2, 'member', NOW())
           ON CONFLICT DO NOTHING`,
          [conversationId, userId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in addParticipants:', error);
      return false;
    } finally {
      client.release();
    }
  },

  // Remove participant from group
  async removeParticipant(conversationId: string, userId: string, removedBy: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user is admin
      const adminCheck = await client.query(
        `SELECT role FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, removedBy]
      );

      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        throw new Error('Not authorized to remove participants');
      }

      // Cannot remove the last admin
      if (userId !== removedBy) {
        const adminCount = await client.query(
          `SELECT COUNT(*) FROM conversation_participants 
           WHERE conversation_id = $1 AND role = 'admin'`,
          [conversationId]
        );

        if (adminCount.rows[0].count <= 1) {
          throw new Error('Cannot remove the last admin');
        }
      }

      await client.query(
        `DELETE FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in removeParticipant:', error);
      return false;
    } finally {
      client.release();
    }
  },

  // Leave group
  async leaveGroup(conversationId: string, userId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user is the last admin
      const userRole = await client.query(
        `SELECT role FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      if (userRole.rows[0]?.role === 'admin') {
        const adminCount = await client.query(
          `SELECT COUNT(*) FROM conversation_participants 
           WHERE conversation_id = $1 AND role = 'admin'`,
          [conversationId]
        );

        if (adminCount.rows[0].count <= 1) {
          // Make another member admin
          await client.query(
            `UPDATE conversation_participants 
             SET role = 'admin' 
             WHERE conversation_id = $1 AND role = 'member' 
             LIMIT 1`,
            [conversationId]
          );
        }
      }

      await client.query(
        `DELETE FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in leaveGroup:', error);
      return false;
    } finally {
      client.release();
    }
  },

  // Mute/unmute conversation
  async toggleMute(conversationId: string, userId: string, mute: boolean): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE conversation_participants
         SET is_muted = $1
         WHERE conversation_id = $2 AND user_id = $3`,
        [mute, conversationId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error in toggleMute:', error);
      return false;
    }
  },

  // Archive/unarchive conversation
  async toggleArchive(conversationId: string, userId: string, archive: boolean): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE conversation_participants
         SET is_archived = $1
         WHERE conversation_id = $2 AND user_id = $3`,
        [archive, conversationId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error in toggleArchive:', error);
      return false;
    }
  },

  // Delete conversation (soft delete)
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user is admin
      const adminCheck = await client.query(
        `SELECT role FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        throw new Error('Not authorized to delete conversation');
      }

      // Soft delete messages
      await client.query(
        `UPDATE messages SET is_deleted = true WHERE conversation_id = $1`,
        [conversationId]
      );

      // Remove all participants
      await client.query(
        `DELETE FROM conversation_participants WHERE conversation_id = $1`,
        [conversationId]
      );

      // Delete conversation
      await client.query(
        `DELETE FROM conversations WHERE id = $1`,
        [conversationId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in deleteConversation:', error);
      return false;
    } finally {
      client.release();
    }
  },

  // Add reaction to message
  async addReaction(messageId: string, userId: string, reaction: string): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO message_reactions (message_id, user_id, reaction, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (message_id, user_id, reaction) DO NOTHING`,
        [messageId, userId, reaction]
      );
      return true;
    } catch (error) {
      console.error('Error in addReaction:', error);
      return false;
    }
  },

  // Remove reaction from message
  async removeReaction(messageId: string, userId: string, reaction: string): Promise<boolean> {
    try {
      await pool.query(
        `DELETE FROM message_reactions
         WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
        [messageId, userId, reaction]
      );
      return true;
    } catch (error) {
      console.error('Error in removeReaction:', error);
      return false;
    }
  },
};