import { useState } from 'react'
import supabase from '../lib/supabase'
import toast from 'react-hot-toast'

export const useDatabase = () => {
  const [loading, setLoading] = useState(false)

  // Analysis History Functions
  const saveAnalysisHistory = async (historyData) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('analysis_history_rp2025')
        .insert([{
          user_id: user.id,
          image_name: historyData.imageName,
          image_url: historyData.imageUrl,
          image_size: historyData.imageSize,
          description: historyData.description,
          tags: historyData.tags || [],
          colors: historyData.colors || [],
          analysis_data: historyData.analysisData || {},
          prompts: historyData.prompts || [],
          template_params: historyData.templateParams || {},
          analysis_provider: historyData.analysisProvider || 'visionati',
          prompt_provider: historyData.promptProvider || 'straico',
          processing_time: historyData.processingTime,
          credits_used: historyData.creditsUsed || 0
        }])
        .select()

      if (error) throw error

      // Update user stats
      await supabase
        .from('users_rp2025')
        .update({
          total_analyses: supabase.sql`total_analyses + 1`,
          total_prompts: supabase.sql`total_prompts + ${historyData.prompts?.length || 0}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error saving analysis history:', error)
      toast.error('保存历史记录失败')
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const getAnalysisHistory = async (limit = 50, offset = 0) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('analysis_history_rp2025')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching analysis history:', error)
      return { data: [], error }
    } finally {
      setLoading(false)
    }
  }

  const deleteAnalysisHistory = async (id) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('analysis_history_rp2025')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('历史记录已删除')
      return { error: null }
    } catch (error) {
      console.error('Error deleting analysis history:', error)
      toast.error('删除历史记录失败')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const clearAnalysisHistory = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('analysis_history_rp2025')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('所有历史记录已清除')
      return { error: null }
    } catch (error) {
      console.error('Error clearing analysis history:', error)
      toast.error('清除历史记录失败')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // API Usage Tracking
  const logApiUsage = async (usageData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('api_usage_rp2025')
        .insert([{
          user_id: user.id,
          provider: usageData.provider,
          endpoint: usageData.endpoint,
          method: usageData.method,
          credits_used: usageData.creditsUsed || 0,
          response_time: usageData.responseTime,
          success: usageData.success,
          error_message: usageData.errorMessage,
          request_data: usageData.requestData || {},
          response_data: usageData.responseData || {}
        }])

      if (error) throw error
    } catch (error) {
      console.error('Error logging API usage:', error)
    }
  }

  // User Settings Functions
  const saveUserSetting = async (category, key, value) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_settings_rp2025')
        .upsert({
          user_id: user.id,
          category,
          key,
          value,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error saving user setting:', error)
      return { error }
    }
  }

  const getUserSettings = async (category = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('user_settings_rp2025')
        .select('*')
        .eq('user_id', user.id)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user settings:', error)
      return { data: [], error }
    }
  }

  return {
    loading,
    saveAnalysisHistory,
    getAnalysisHistory,
    deleteAnalysisHistory,
    clearAnalysisHistory,
    logApiUsage,
    saveUserSetting,
    getUserSettings
  }
}