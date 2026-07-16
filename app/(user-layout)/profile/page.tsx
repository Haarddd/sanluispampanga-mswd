"use client";

import { useEffect, useState } from "react";
import { fetchUserProfile } from "@/app/actions/profile";
import { clientCache } from "@/lib/client-cache";
import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchUserProfile>>>(
    clientCache.getProfile() ?? null
  );
  const [loading, setLoading] = useState(!clientCache.getProfile());

  useEffect(() => {
    const cached = clientCache.getProfile();
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(cached);
      setLoading(false);
    }

    fetchUserProfile().then((fresh) => {
      if (fresh) {
        clientCache.setProfile(fresh);
        setData(fresh);
      }
      setLoading(false);
    });
  }, []);

  return (
    <ProfileClient
      profile={data?.profile}
      address={data?.address}
      digitalId={data?.digitalId}
      isLoading={loading}
    />
  );
}
