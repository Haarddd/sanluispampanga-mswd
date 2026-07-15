"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  useAdminStore,
  SeniorProfile,
} from "@/components/admin/admin-store-provider";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SAN_LUIS_BARANGAYS = [
  "Baculas",
  "Cabagsan",
  "Cabensaan",
  "Calantipay",
  "San Agustin",
  "San Carlos",
  "San Isidro",
  "San Jose",
  "San Juan",
  "San Nicolas",
  "San Roque",
  "San Sebastian",
  "Santa Cruz",
  "Santa Cruz Pambilog",
  "Santa Lucia",
  "Santa Monica",
  "Santa Rita",
  "Santo Rosario",
  "Santo Tomas",
  "Talang",
];

const statusStyles: Record<string, string> = {
  APPROVED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING_ADMIN_REVIEW:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  NEEDS_CLARIFICATION:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusLabels: Record<string, string> = {
  APPROVED: "Approved",
  PENDING_ADMIN_REVIEW: "Pending Review",
  REJECTED: "Rejected",
  NEEDS_CLARIFICATION: "Needs Clarification",
};

export default function TrackingMapClient() {
  const { seniors, medicineRequests, assistanceRequests } = useAdminStore();
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("ALL");
  const [selectedRequestType, setSelectedRequestType] = useState<string>("ALL");

  // Selected Senior on Map (to pan to)
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);

  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerMapRef = useRef<Map<string, any>>(new Map());

  // 1. Load Leaflet CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load Leaflet CSS
    const cssId = "leaflet-cdn-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const jsId = "leaflet-cdn-js";
    const existingScript = document.getElementById(
      jsId,
    ) as HTMLScriptElement | null;
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      if ((window as any).L) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLeafletLoaded(true);
      } else {
        existingScript.addEventListener("load", () => setLeafletLoaded(true));
      }
    }
  }, []);

  // 2. Filter Seniors based on selection
  const filteredSeniors = useMemo(() => {
    return seniors.filter((senior) => {
      // Name or phone matching
      const matchesSearch =
        senior.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        senior.phone.includes(searchQuery);

      // Status matching
      const matchesStatus =
        selectedStatus === "ALL" ||
        senior.verification_status === selectedStatus;

      // Barangay matching
      const matchesBarangay =
        selectedBarangay === "ALL" ||
        senior.address.barangay.toLowerCase() ===
          selectedBarangay.toLowerCase();

      // Request type matching
      let matchesRequest = true;
      if (selectedRequestType === "MEDICINE") {
        matchesRequest = medicineRequests.some(
          (req) =>
            req.user_id === senior.id &&
            ["PENDING", "APPROVED"].includes(req.status),
        );
      } else if (selectedRequestType === "ASSISTANCE") {
        matchesRequest = assistanceRequests.some(
          (req) =>
            req.user_id === senior.id &&
            ["PENDING", "IN_PROGRESS"].includes(req.status),
        );
      } else if (selectedRequestType === "ANY") {
        const hasMed = medicineRequests.some(
          (req) =>
            req.user_id === senior.id &&
            ["PENDING", "APPROVED"].includes(req.status),
        );
        const hasAst = assistanceRequests.some(
          (req) =>
            req.user_id === senior.id &&
            ["PENDING", "IN_PROGRESS"].includes(req.status),
        );
        matchesRequest = hasMed || hasAst;
      }

      return (
        matchesSearch && matchesStatus && matchesBarangay && matchesRequest
      );
    });
  }, [
    seniors,
    searchQuery,
    selectedStatus,
    selectedBarangay,
    selectedRequestType,
    medicineRequests,
    assistanceRequests,
  ]);

  // 4. Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      // Centered at San Luis, Pampanga (approximate)
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        maxZoom: 20,
      }).setView([15.0253, 120.7854], 13);

      const standardLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        },
      );

      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        },
      );

      // Default to satellite map
      satelliteLayer.addTo(map);

      // Add Layer Control at top-right
      const baseMaps = {
        "Standard Map": standardLayer,
        "Satellite View": satelliteLayer,
      };
      L.control.layers(baseMaps, null, { position: "topright" }).addTo(map);

      // Add Zoom Control at bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }
  }, [leafletLoaded]);

  // Listen for custom close event from popup buttons
  useEffect(() => {
    const handleClosePopups = () => {
      if (mapRef.current) {
        mapRef.current.closePopup();
      }
    };
    window.addEventListener("close-leaflet-popups", handleClosePopups);
    return () => {
      window.removeEventListener("close-leaflet-popups", handleClosePopups);
    };
  }, []);

  // 5. Update Map Markers when data or filters change
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !markersGroupRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    markersGroupRef.current.clearLayers();
    markerMapRef.current.clear();

    // Create marker icons based on status
    const getMarkerIcon = (status: string) => {
      let color = "#10b981"; // APPROVED: Green
      if (status === "PENDING_ADMIN_REVIEW") color = "#eab308"; // PENDING: Yellow
      if (status === "NEEDS_CLARIFICATION") color = "#3b82f6"; // BLUE
      if (status === "REJECTED") color = "#ef4444"; // RED

      return L.divIcon({
        html: `<div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
        </div>`,
        className: "custom-map-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10],
      });
    };

    filteredSeniors.forEach((senior) => {
      // Use coordinates from address, fallback to San Luis center if missing
      const lat = senior.address.latitude || 15.0253;
      const lng = senior.address.longitude || 120.7854;

      // Add slight jitter if markers are exactly at same coords (e.g. fallback center)
      const jitterLat = lat + (Math.random() - 0.5) * 0.0008;
      const jitterLng = lng + (Math.random() - 0.5) * 0.0008;

      const marker = L.marker([jitterLat, jitterLng], {
        icon: getMarkerIcon(senior.verification_status),
      });

      // Prepare popup content
      const statusBadge = `<span class="px-1.5 py-1 text-xs font-semibold rounded ${
        senior.verification_status === "APPROVED"
          ? "bg-emerald-100 text-emerald-800"
          : senior.verification_status === "PENDING_ADMIN_REVIEW"
            ? "bg-yellow-100 text-yellow-800"
            : senior.verification_status === "NEEDS_CLARIFICATION"
              ? "bg-blue-100 text-blue-800"
              : "bg-red-100 text-red-800"
      }">${statusLabels[senior.verification_status] || senior.verification_status}</span>`;

      const popupContent = `
        <div style="font-family: inherit; min-width: 240px; padding: 4px;">
          <!-- Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 10px;">
            <span style="font-weight: 700; font-size: 14px; color: #111827;">${senior.full_name}</span>
            ${statusBadge}
          </div>
          <!-- Body -->
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #4b5563; margin-bottom: 14px;">
            <p style="margin: 0;"><strong>Phone:</strong> ${senior.phone}</p>
            <p style="margin: 0; line-height: 1.4;"><strong>Address:</strong> ${senior.address.street}, Brgy. ${senior.address.barangay}</p>
          </div>
          <!-- Footer Buttons -->
          <div style="display: flex; gap: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; padding: 6px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; border: 1px solid #d1d5db; color: #374151; background-color: #ffffff; text-decoration: none; display: inline-block; cursor: pointer; transition: background-color 0.2s;">
              Google Maps
            </a>
            <a href="/admin/seniors?id=${senior.id}" style="flex: 1; text-align: center; padding: 6px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; background-color: #3b82f6; color: #ffffff; text-decoration: none; display: inline-block; cursor: pointer; transition: background-color 0.2s;">
              View Profile
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false });
      marker.addTo(markersGroupRef.current);

      markerMapRef.current.set(senior.id, marker);
    });

    // Auto-fit bounds if we have markers
    if (filteredSeniors.length > 0 && mapRef.current) {
      const group = L.featureGroup(Array.from(markerMapRef.current.values()));
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [leafletLoaded, filteredSeniors]);

  // Center/Pan map to a selected senior's marker
  const handleSelectSenior = (senior: SeniorProfile) => {
    setSelectedSeniorId(senior.id);
    const marker = markerMapRef.current.get(senior.id);
    if (marker && mapRef.current) {
      mapRef.current.setView(marker.getLatLng(), 18);
      marker.openPopup();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            Senior Citizen Geolocation Map
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Visual tracking and service allocation map for San Luis, Pampanga
          </p>
        </div>

        {/* Quick Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-md border text-xs">
          <span className="font-semibold text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-sm inline-block"></span>
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-white shadow-sm inline-block"></span>
            <span>Pending Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white shadow-sm inline-block"></span>
            <span>Needs Clarification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm inline-block"></span>
            <span>Rejected</span>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-10 mb-0.5"
          />
        </div>

        {/* Verification Status */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PENDING_ADMIN_REVIEW">Pending Review</SelectItem>
            <SelectItem value="NEEDS_CLARIFICATION">
              Needs Clarification
            </SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Barangay Filter */}
        <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue placeholder="Filter by Barangay" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Barangays</SelectItem>
            {SAN_LUIS_BARANGAYS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active Request Filter */}
        <Select
          value={selectedRequestType}
          onValueChange={setSelectedRequestType}
        >
          <SelectTrigger className="w-full sm:w-[190px] h-10">
            <SelectValue placeholder="Filter by Requests" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Citizens</SelectItem>
            <SelectItem value="MEDICINE">Active Medicine Requests</SelectItem>
            <SelectItem value="ASSISTANCE">Active Welfare Requests</SelectItem>
            <SelectItem value="ANY">Any Active Requests</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden min-h-0">
        {/* Side Panel: Lists and Stats */}
        <div className="lg:col-span-1 flex flex-col space-y-4 overflow-y-auto pr-1">
          {/* mapped stats */}
          <div className="border bg-card p-4 rounded-lg space-y-2 shrink-0">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mapping Summary
            </h2>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <p className="text-2xl font-bold">{filteredSeniors.length}</p>
                <p className="text-xs text-muted-foreground">Seniors Plotted</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    filteredSeniors.filter(
                      (s) => s.verification_status === "PENDING_ADMIN_REVIEW",
                    ).length
                  }
                </p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </div>

          {/* List of matching seniors */}
          <div className="border bg-card rounded-lg flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b shrink-0 flex items-center justify-between">
              <span className="font-semibold text-sm">Matching Directory</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                {filteredSeniors.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y">
              {filteredSeniors.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No seniors match this filter configuration.
                </div>
              ) : (
                filteredSeniors.map((senior) => (
                  <button
                    key={senior.id}
                    onClick={() => handleSelectSenior(senior)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-muted/40 transition-colors flex items-start justify-between gap-2 text-sm",
                      selectedSeniorId === senior.id &&
                        "bg-muted border-l-2 border-primary",
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {senior.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {senior.phone}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Brgy. {senior.address.barangay}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-4 shrink-0">
                      <span
                        className={cn(
                          "text-xs px-1.5 py-1 rounded font-semibold",
                          statusStyles[senior.verification_status],
                        )}
                      >
                        {statusLabels[senior.verification_status]}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-3 border rounded-lg overflow-hidden bg-card relative flex flex-col">
          {!leafletLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 z-10 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">
                Loading Leaflet Map Engine
              </p>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>
      </div>
    </div>
  );
}
