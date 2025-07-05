import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('useAuth: Initializing...')
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('useAuth: Getting session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('useAuth: Session error:', error)
          setLoading(false)
          return
        }

        console.log('useAuth: Session data:', session?.user?.email || 'No session')
        setUser(session?.user || null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('useAuth: Error getting session:', error)
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.email || 'No user')
        setUser(session?.user || null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      console.log('useAuth: Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('users_rp2025')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('useAuth: Profile fetch error:', error)
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('useAuth: Creating new profile...')
          await createProfile(userId)
          return
        }
        throw error
      }

      console.log('useAuth: Profile fetched successfully')
      setProfile(data)

      // Update last active
      await supabase.rpc('update_user_last_active', { user_uuid: userId })
    } catch (error) {
      console.error('useAuth: Error fetching profile:', error)
    }
  }

  const createProfile = async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('users_rp2025')
        .insert([{
          id: userId,
          email: user.email,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      console.log('useAuth: Profile created successfully')
      setProfile(data)
    } catch (error) {
      console.error('useAuth: Error creating profile:', error)
    }
  }

  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true)
      console.log('useAuth: Signing up user:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      })

      if (error) throw error

      toast.success('账户创建成功！请检查邮箱验证链接。')
      return { data, error: null }
    } catch (error) {
      console.error('useAuth: Sign up error:', error)
      toast.error(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      console.log('useAuth: Signing in user:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      toast.success('登录成功！')
      return { data, error: null }
    } catch (error) {
      console.error('useAuth: Sign in error:', error)
      toast.error(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('useAuth: Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast.success('已成功退出登录')
      navigate('/')
    } catch (error) {
      console.error('useAuth: Sign out error:', error)
      toast.error(error.message)
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('users_rp2025')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await fetchProfile(user.id)
      toast.success('个人资料更新成功')
      return { error: null }
    } catch (error) {
      console.error('useAuth: Update profile error:', error)
      toast.error(error.message)
      return { error }
    }
  }

  const getUserStats = async () => {
    try {
      if (!user) return null

      const { data, error } = await supabase
        .rpc('get_user_stats', { user_uuid: user.id })

      if (error) throw error

      return data
    } catch (error) {
      console.error('useAuth: Error fetching user stats:', error)
      return null
    }
  }

  console.log('useAuth: Current state - user:', !!user, 'loading:', loading)

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    getUserStats
  }
}