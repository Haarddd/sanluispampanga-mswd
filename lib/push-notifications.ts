import webpush from 'web-push';
import { createServiceRoleClient } from './supabase/service-role';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
}

export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
) {
  try {
    const supabase = createServiceRoleClient()

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) return

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/mswd.png',
            url: payload.url || '/',
          })
        )
      )
    )
  } catch (error) {
    console.error('Push notification error:', error)
  }
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
  } catch (error) {
    console.error('Push notification error:', error)
  }
}
