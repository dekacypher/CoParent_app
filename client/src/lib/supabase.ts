import { createClient } from '@supabase/supabase-js'

// Use environment variables if available, otherwise use production fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oydddblbkqokxkqghuwp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZGRkYmxia3Fva3hrcWdodXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Njg0NDgsImV4cCI6MjA4NDA0NDQ0OH0.5DRAvHQZEs_JStplsrhDGiKnLG3voHnDFoK653jdYlw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          role: string
          parent_a_name: string
          parent_b_name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      children: {
        Row: {
          id: number
          name: string
          age: number
          gender: string
          interests: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['children']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['children']['Row']>
      }
      events: {
        Row: {
          id: number
          child_id: number | null
          title: string
          start_date: string
          end_date: string
          start_time: string
          end_time: string
          time_zone: string
          parent: string
          type: string
          recurrence: string | null
          recurrence_interval: number
          recurrence_end: string | null
          recurrence_days: string | null
          description: string | null
          location: string | null
          created_at: string
        }
      }
      friends: {
        Row: {
          id: number
          name: string
          email: string | null
          avatar: string | null
          relation: string
          kids: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['friends']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['friends']['Row']>
      }
      expenses: {
        Row: {
          id: number
          child_id: number
          title: string
          amount: number
          category: string
          paid_by: string
          split_percentage: number
          date: string
          receipt: string | null
          status: string
          notes: string | null
          created_at: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          content_hash: string | null
          created_at: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          category: string | null
          child_id: number | null
          uploaded_by: string
          tags: string[] | null
          shared_with: string[] | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

// Helper functions for common operations
export const supabaseApi = {
  // Profiles
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateProfile(userId: string, updates: { parent_a_name?: string; parent_b_name?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Children
  async getChildren() {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Events
  async getEvents(childId?: number) {
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (childId) {
      query = query.eq('child_id', childId)
    }

    const { data, error } = await query
    return { data, error }
  },

  async createEvent(event: any) {
    // Handle both schemas: with 'date' column or with 'start_date'/'end_date'
    const insertData = {
      ...event,
      // Add 'date' column if the table uses the old schema
      ...(event.start_date && { date: event.start_date })
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single()
    return { data, error }
  },

  async updateEvent(id: number, updates: any) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async deleteEvent(id: number) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    return { error }
  },

  // Expenses
  async getExpenses(childId?: number, status?: string) {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })

    if (childId) {
      query = query.eq('child_id', childId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    return { data, error }
  },

  async createExpense(expense: any) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()
    return { data, error }
  },

  // Friends
  async getFriends() {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async createFriend(friend: any) {
    const { data, error } = await supabase
      .from('friends')
      .insert(friend)
      .select()
      .single()
    return { data, error }
  },

  // Messages
  async getMessages(otherUserId?: string) {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (otherUserId) {
      query = query.or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
    }

    const { data, error } = await query
    return { data, error }
  },

  async sendMessage(message: any) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()
    return { data, error }
  },

  // Documents
  async getDocuments(category?: string, childId?: number) {
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (childId) {
      query = query.eq('child_id', childId)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Storage
  async uploadDocument(file: File, metadata: any) {
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `documents/${fileName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (error) {
      return { data: null, error }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Save document metadata
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        title: metadata.title || file.name,
        description: metadata.description,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category: metadata.category,
        child_id: metadata.childId,
        uploaded_by: metadata.uploadedBy,
        tags: metadata.tags || [],
        shared_with: metadata.sharedWith || []
      })
      .select()
      .single()

    return { data: doc, error: docError }
  },

  // Authentication
  async signUp(email: string, password: string, metadata: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: metadata.username,
          role: metadata.role,
        }
      }
    })
    return { data, error }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
}
