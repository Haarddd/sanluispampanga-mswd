"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const TrackingMapClient = dynamic(
  () => import("./tracking-map-client"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

export default function TrackingPage() {
  return <TrackingMapClient />;
}
