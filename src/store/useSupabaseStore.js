import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import supabase from '../lib/supabase'

// Enhanced history store with Supabase integration
export const useSupabaseHistoryStore = create(
  persist(
    (set, get) => ({
      entries: [],
      loading: false,
      error: null,

      // Load history from Supabase
      loadHistory: async () => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ loading: false, error: 'User not authenticated' })
            return
          }

          const { data, error } = await supabase
            .from('analysis_history_rp2025')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

          if (error) throw error

          // Transform data to match existing format
          const transformedEntries = data.map(entry => ({
            id: entry.id,
            imageUrl: entry.image_url,
            imageName: entry.image_name,
            imageSize: entry.image_size,
            description: entry.description,
            tags: entry.tags || [],
            colors: entry.colors || [],
            prompts: entry.prompts || [],
            templateParams: entry.template_params || {},
            analysisData: entry.analysis_data || {},
            createdAt: entry.created_at,
            processingTime: entry.processing_time,
            creditsUsed: entry.credits_used,
            analysisProvider: entry.analysis_provider,
            promptProvider: entry.prompt_provider
          }))

          set({ entries: transformedEntries, loading: false })
        } catch (error) {
          console.error('Error loading history:', error)
          set({ loading: false, error: error.message })
        }
      },

      // Add new entry to Supabase
      addEntry: async (entry) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ loading: false, error: 'User not authenticated' })
            return
          }

          const { data, error } = await supabase
            .from('analysis_history_rp2025')
            .insert([{
              user_id: user.id,
              image_name: entry.imageName,
              image_url: entry.imageUrl,
              image_size: entry.imageSize,
              description: entry.description,
              tags: entry.tags || [],
              colors: entry.colors || [],
              analysis_data: entry.analysisData || {},
              prompts: entry.prompts || [],
              template_params: entry.templateParams || {},
              analysis_provider: entry.analysisProvider || 'visionati',
              prompt_provider: entry.promptProvider || 'straico',
              processing_time: entry.processingTime,
              credits_used: entry.creditsUsed || 0
            }])
            .select()

          if (error) throw error

          // Transform and add to local state
          const transformedEntry = {
            id: data[0].id,
            imageUrl: data[0].image_url,
            imageName: data[0].image_name,
            imageSize: data[0].image_size,
            description: data[0].description,
            tags: data[0].tags || [],
            colors: data[0].colors || [],
            prompts: data[0].prompts || [],
            templateParams: data[0].template_params || {},
            analysisData: data[0].analysis_data || {},
            createdAt: data[0].created_at,
            processingTime: data[0].processing_time,
            creditsUsed: data[0].credits_used,
            analysisProvider: data[0].analysis_provider,
            promptProvider: data[0].prompt_provider
          }

          set(state => ({
            entries: [transformedEntry, ...state.entries],
            loading: false
          }))

          // Update user stats
          await supabase
            .from('users_rp2025')
            .update({
              total_analyses: supabase.sql`total_analyses + 1`,
              total_prompts: supabase.sql`total_prompts + ${entry.prompts?.length || 0}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
        } catch (error) {
          console.error('Error adding entry:', error)
          set({ loading: false, error: error.message })
        }
      },

      // Remove entry from Supabase
      removeEntry: async (id) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ loading: false, error: 'User not authenticated' })
            return
          }

          const { error } = await supabase
            .from('analysis_history_rp2025')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          set(state => ({
            entries: state.entries.filter(entry => entry.id !== id),
            loading: false
          }))
        } catch (error) {
          console.error('Error removing entry:', error)
          set({ loading: false, error: error.message })
        }
      },

      // Clear all history
      clearHistory: async () => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ loading: false, error: 'User not authenticated' })
            return
          }

          const { error } = await supabase
            .from('analysis_history_rp2025')
            .delete()
            .eq('user_id', user.id)

          if (error) throw error

          set({ entries: [], loading: false })
        } catch (error) {
          console.error('Error clearing history:', error)
          set({ loading: false, error: error.message })
        }
      },

      // Get specific entry
      getEntry: (id) => {
        const state = get()
        return state.entries.find(entry => entry.id === id)
      }
    }),
    {
      name: 'repromp-supabase-history',
      partialize: (state) => ({
        entries: state.entries // Only persist entries, not loading states
      })
    }
  )
)

// Enhanced settings store with Supabase integration
export const useSupabaseSettingsStore = create(
  persist(
    (set, get) => ({
      visionatiKey: '',
      straicoKey: '',
      defaultTemplateParams: {
        style: 'Photorealistic',
        length: 'Medium',
        tone: 'Descriptive',
        artisticStyle: 'None',
        mood: 'Neutral',
        lighting: 'Natural',
        composition: 'Balanced',
        manualPrompt: ''
      },
      loading: false,
      error: null,
      isInitialized: false, // 添加初始化标记

      // Load settings from Supabase
      loadSettings: async () => {
        const state = get()
        if (state.loading || state.isInitialized) {
          console.log('Settings already loading or initialized, skipping...')
          return
        }

        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            console.log('No user found, using local settings')
            set({ loading: false, isInitialized: true })
            return
          }

          console.log('Loading settings for user:', user.id)

          const { data, error } = await supabase
            .from('user_settings_rp2025')
            .select('*')
            .eq('user_id', user.id)

          if (error) {
            console.error('Supabase error:', error)
            throw error
          }

          // Process settings data
          const settings = {}
          data.forEach(setting => {
            if (setting.category === 'api' && setting.key === 'visionati_key') {
              settings.visionatiKey = setting.value
            } else if (setting.category === 'api' && setting.key === 'straico_key') {
              settings.straicoKey = setting.value
            } else if (setting.category === 'template' && setting.key === 'default_params') {
              settings.defaultTemplateParams = {
                ...get().defaultTemplateParams,
                ...setting.value
              }
            }
          })

          console.log('Loaded settings from Supabase:', settings)

          // Update local state
          set({ 
            ...settings, 
            loading: false, 
            isInitialized: true 
          })

          // Also update localStorage for immediate access
          if (settings.visionatiKey) {
            localStorage.setItem('visionati_api_key', settings.visionatiKey)
          }
          if (settings.straicoKey) {
            localStorage.setItem('straico_api_key', settings.straicoKey)
          }
        } catch (error) {
          console.error('Error loading settings:', error)
          set({ loading: false, error: error.message, isInitialized: true })
        }
      },

      // Save API key to Supabase
      setVisionatiKey: async (key) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            console.log('Saving Visionati key to Supabase for user:', user.id)
            
            const { error } = await supabase
              .from('user_settings_rp2025')
              .upsert({
                user_id: user.id,
                category: 'api',
                key: 'visionati_key',
                value: key,
                updated_at: new Date().toISOString()
              })

            if (error) {
              console.error('Supabase upsert error:', error)
              throw error
            }
            console.log('Visionati key saved successfully')
          }

          set({ visionatiKey: key })

          // Also save to localStorage for immediate access
          if (key) {
            localStorage.setItem('visionati_api_key', key)
          } else {
            localStorage.removeItem('visionati_api_key')
          }
        } catch (error) {
          console.error('Error saving Visionati key:', error)
          // Still update local state even if Supabase fails
          set({ visionatiKey: key })
          if (key) {
            localStorage.setItem('visionati_api_key', key)
          } else {
            localStorage.removeItem('visionati_api_key')
          }
          throw error
        }
      },

      setStraicoKey: async (key) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            console.log('Saving Straico key to Supabase for user:', user.id)
            
            const { error } = await supabase
              .from('user_settings_rp2025')
              .upsert({
                user_id: user.id,
                category: 'api',
                key: 'straico_key',
                value: key,
                updated_at: new Date().toISOString()
              })

            if (error) {
              console.error('Supabase upsert error:', error)
              throw error
            }
            console.log('Straico key saved successfully')
          }

          set({ straicoKey: key })

          // Also save to localStorage for immediate access
          if (key) {
            localStorage.setItem('straico_api_key', key)
          } else {
            localStorage.removeItem('straico_api_key')
          }
        } catch (error) {
          console.error('Error saving Straico key:', error)
          // Still update local state even if Supabase fails
          set({ straicoKey: key })
          if (key) {
            localStorage.setItem('straico_api_key', key)
          } else {
            localStorage.removeItem('straico_api_key')
          }
          throw error
        }
      },

      // Save template parameters to Supabase
      setDefaultTemplateParams: async (params) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { error } = await supabase
              .from('user_settings_rp2025')
              .upsert({
                user_id: user.id,
                category: 'template',
                key: 'default_params',
                value: params,
                updated_at: new Date().toISOString()
              })

            if (error) throw error
          }

          set({ defaultTemplateParams: params })
        } catch (error) {
          console.error('Error saving template params:', error)
          // Still update local state even if Supabase fails
          set({ defaultTemplateParams: params })
          throw error
        }
      },

      // Initialize from localStorage (for offline access)
      initializeFromStorage: () => {
        const state = get()
        if (state.isInitialized) {
          console.log('Settings already initialized from storage, skipping...')
          return
        }

        const visionatiKey = localStorage.getItem('visionati_api_key') || ''
        const straicoKey = localStorage.getItem('straico_api_key') || ''
        set({ 
          visionatiKey, 
          straicoKey, 
          isInitialized: true 
        })
        console.log('Initialized settings from localStorage')
      },

      // Reset initialization state (for debugging)
      resetInitialization: () => {
        set({ isInitialized: false })
      }
    }),
    {
      name: 'repromp-supabase-settings',
      partialize: (state) => ({
        visionatiKey: state.visionatiKey,
        straicoKey: state.straicoKey,
        defaultTemplateParams: state.defaultTemplateParams
      })
    }
  )
)