'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sendOTP(formData: FormData) {
  const phone = formData.get('phone') as string

  if (!phone) {
    return { error: 'Phone number is required' }
  }

  // Ensure format +63...
  const formattedPhone = phone.startsWith('+63') ? phone : `+63${phone.replace(/^0+/, '')}`

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, phone: formattedPhone }
}

export async function verifyOTP(phone: string, token: string) {
  if (!phone || !token) {
    return { error: 'Phone number and code are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) {
    return { error: error.message }
  }

  // Check if user has a profile (onboarding check)
  if (data.user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('verification_status, full_name')
      .eq('id', data.user.id)
      .single()

    const needsOnboarding = !profile?.full_name

    if (needsOnboarding) {
      redirect('/onboarding')
    } else if (profile.verification_status !== 'APPROVED') {
      redirect('/verification-pending')
    } else {
      redirect('/')
    }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/authentication')
}

export async function checkUserStatus(phone: string) {
  if (!phone) {
    return { error: 'Phone number is required' }
  }

  const formattedPhone = phone.startsWith('+63') ? phone : `+63${phone.replace(/^0+/, '')}`

  const supabase = await createClient()

  // Use the database function to check if user exists and is verified
  const { data: exists, error } = await supabase.rpc('check_user_exists_by_phone', {
    phone_number: formattedPhone,
  })

  if (error) {
    console.error('Error checking user status:', error)
    return { error: error.message }
  }

  return { exists, phone: formattedPhone }
}

export async function loginWithPIN(phone: string, pin: string) {
  if (!phone || !pin) {
    return { error: 'Phone number and PIN are required' }
  }

  const formattedPhone = phone.startsWith('+63') ? phone : `+63${phone.replace(/^0+/, '')}`

  const supabase = await createClient()

  // 1. Verify PIN against user_profiles via RPC (bypasses RLS)
  const { data: profiles, error: profileError } = await supabase
    .rpc('get_user_pin_by_phone', {
      phone_number: formattedPhone,
    })

  const profile = profiles && profiles[0]

  if (profileError || !profile) {
    return { error: 'User profile not found' }
  }

  if (profile.login_pin !== pin) {
    return { error: 'Invalid PIN code' }
  }

  // 2. Sign in using native phone and password (PIN)
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: formattedPhone,
    password: pin,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const { data: activeProfile } = await supabase
      .from('user_profiles')
      .select('verification_status, full_name')
      .eq('id', data.user.id)
      .single()

    const needsOnboarding = !activeProfile?.full_name

    if (needsOnboarding) {
      redirect('/onboarding')
    } else if (activeProfile?.verification_status !== 'APPROVED') {
      redirect('/verification-pending')
    } else {
      redirect('/')
    }
  }

  redirect('/')
}
