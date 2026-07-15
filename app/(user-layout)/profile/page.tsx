import { fetchUserProfile } from "@/app/actions/profile";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const data = await fetchUserProfile();

  return (
    <ProfileClient
      profile={data?.profile}
      address={data?.address}
      digitalId={data?.digitalId}
    />
  );
}
