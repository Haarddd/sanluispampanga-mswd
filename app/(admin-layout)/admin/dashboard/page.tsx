"use client";

import React, { useMemo, useState } from "react";
import { UsersRound, CreditCard, Inbox, TrendingUp } from "lucide-react";
import { useAdminStore } from "@/components/admin/admin-store-provider";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="border bg-card p-5 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-muted-foreground text-sm font-medium">{label}</h1>
        <div className="bg-muted p-1.5 rounded-md">
          <Icon size={15} strokeWidth={2} className="text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  headerAction,
  children,
}: {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border bg-card rounded-lg p-5">
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <h2 className="font-medium text-base">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboardPage() {
  const {
    seniors,
    medicines,
    medicineRequests,
    assistanceRequests,
    digitalIds,
  } = useAdminStore();

  const [trendsTimeframe, setTrendsTimeframe] = useState<
    "week" | "month" | "year"
  >("week");

  // ── Stat Calculations ──
  const totalSeniors = seniors.length;
  const activeIdsCount = digitalIds.filter(
    (id) => id.status === "ACTIVE",
  ).length;
  const totalRequests = medicineRequests.length + assistanceRequests.length;

  const fulfillmentRate = useMemo(() => {
    const completedCount =
      medicineRequests.filter((r) =>
        ["DISPENSED", "COMPLETED"].includes(r.status),
      ).length +
      assistanceRequests.filter((r) => r.status === "COMPLETED").length;
    return totalRequests > 0
      ? ((completedCount / totalRequests) * 100).toFixed(1) + "%"
      : "100%";
  }, [medicineRequests, assistanceRequests, totalRequests]);

  const stats = [
    {
      title: "Total Registered Seniors",
      value: String(totalSeniors),
      icon: UsersRound,
    },
    {
      title: "Active Digital IDs",
      value: String(activeIdsCount),
      icon: CreditCard,
    },
    {
      title: "Total Service Requests",
      value: String(totalRequests),
      icon: Inbox,
    },
    {
      title: "Request Fulfillment Rate",
      value: fulfillmentRate,
      icon: TrendingUp,
    },
  ];

  // ── Chart 1: Welfare Request Trends (Medicine vs Assistance) ──
  const requestTrendsData = useMemo(() => {
    if (trendsTimeframe === "week") {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      }).reverse();

      return last7Days.map((date) => {
        const meds = medicineRequests.filter((r) =>
          r.request_date?.startsWith(date),
        ).length;
        const asts = assistanceRequests.filter((r) =>
          r.created_at?.startsWith(date),
        ).length;
        return {
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          medicine: meds,
          assistance: asts,
        };
      });
    } else if (trendsTimeframe === "month") {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      }).reverse();

      return last30Days.map((date) => {
        const meds = medicineRequests.filter((r) =>
          r.request_date?.startsWith(date),
        ).length;
        const asts = assistanceRequests.filter((r) =>
          r.created_at?.startsWith(date),
        ).length;
        return {
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          medicine: meds,
          assistance: asts,
        };
      });
    } else {
      // "year" - last 12 months
      const last12Months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toISOString().substring(0, 7); // "YYYY-MM"
      }).reverse();

      return last12Months.map((yearMonth) => {
        const meds = medicineRequests.filter((r) =>
          r.request_date?.startsWith(yearMonth),
        ).length;
        const asts = assistanceRequests.filter((r) =>
          r.created_at?.startsWith(yearMonth),
        ).length;

        const [year, month] = yearMonth.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        const monthName = date.toLocaleDateString("en-US", { month: "short" });

        return {
          date: `${monthName} ${year.substring(2)}`,
          medicine: meds,
          assistance: asts,
        };
      });
    }
  }, [medicineRequests, assistanceRequests, trendsTimeframe]);

  // ── Chart 2: Medicine Inventory Consumption (Consumed vs Remaining) ──
  const medicineConsumptionData = useMemo(() => {
    return medicines.map((med) => {
      const consumed = medicineRequests
        .filter(
          (r) =>
            r.medicine_id === med.id &&
            ["DISPENSED", "COMPLETED"].includes(r.status),
        )
        .reduce((sum, r) => sum + r.quantity, 0);

      return {
        name: med.name.split(" ")[0], // short name
        consumed,
        remaining: med.available_quantity,
      };
    });
  }, [medicines, medicineRequests]);

  // ── Chart 3: Request Status Breakdown ──
  const requestStatusData = useMemo(() => {
    const statuses = [
      "PENDING",
      "APPROVED",
      "DISPENSED",
      "COMPLETED",
      "REJECTED",
    ];
    const colors = ["#eab308", "#3b82f6", "#a855f7", "#10b981", "#ef4444"];

    return statuses
      .map((status, index) => {
        const count =
          medicineRequests.filter((r) => r.status === status).length +
          assistanceRequests.filter((r) => r.status === status).length;
        return {
          name: status.charAt(0) + status.slice(1).toLowerCase(),
          value: count,
          color: colors[index],
        };
      })
      .filter((item) => item.value > 0);
  }, [medicineRequests, assistanceRequests]);

  // ── Chart 4: Density/Seniors by Barangay ──
  const barangayDensityData = useMemo(() => {
    const statsMap: Record<string, number> = {};
    SAN_LUIS_BARANGAYS.forEach((b) => {
      statsMap[b] = 0;
    });

    seniors.forEach((senior) => {
      const b = senior.address.barangay;
      if (b) {
        const matched = SAN_LUIS_BARANGAYS.find(
          (name) => name.toLowerCase() === b.toLowerCase(),
        );
        const key = matched || b;
        statsMap[key] = (statsMap[key] || 0) + 1;
      }
    });

    return SAN_LUIS_BARANGAYS.map((name) => ({
      name,
      count: statsMap[name] || 0,
    })).sort((a, b) => b.count - a.count);
  }, [seniors]);

  return (
    <div className="space-y-5">
      {/* Page Title Header */}
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          MSWD San Luis Senior Citizen Assistance & Registry Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            label={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Row 1: Welfare Request Trends + Request Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Welfare Request Trends (LineChart) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Service Request Trends"
            subtitle={
              trendsTimeframe === "week"
                ? "Volume of requests over the last 7 days"
                : trendsTimeframe === "month"
                  ? "Volume of requests over the last 30 days"
                  : "Monthly volume of requests this year"
            }
            headerAction={
              <div className="flex border rounded-md p-0.5 bg-muted/30">
                {(["week", "month", "year"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrendsTimeframe(t)}
                    className={`text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm transition-all cursor-pointer ${
                      trendsTimeframe === t
                        ? "bg-card text-foreground font-medium shadow-xs border"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "week" ? "Week" : t === "month" ? "Month" : "Year"}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={requestTrendsData} margin={{ left: -20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  cursor={{ stroke: "var(--border)" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line
                  type="monotone"
                  dataKey="medicine"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  name="Medicine Requests"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="assistance"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  name="General Assistance"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Request Status Distribution (PieChart) */}
        <div>
          <ChartCard
            title="Request Status Distribution"
            subtitle="Overall breakdown of requests status"
          >
            {requestStatusData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No request status data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={requestStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {requestStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} requests`]}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Row 2: Medicine Inventory Consumption + Density by Barangay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Medicine Inventory Consumption (BarChart) */}
        <ChartCard
          title="Medicine Stock Consumption"
          subtitle="Consumed (dispensed) quantity vs remaining stock in inventory"
        >
          {/* Legend sits above chart */}
          <div className="flex items-center justify-center gap-4 text-xs mb-3">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: "#3b82f6" }}
              />
              <span className="text-muted-foreground">
                Consumed (Dispensed)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm opacity-40"
                style={{ backgroundColor: "#6b7280" }}
              />
              <span className="text-muted-foreground">Remaining Stock</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div className="w-max h-[200px]">
              <BarChart
                width={Math.max(500, medicineConsumptionData.length * 80)}
                height={200}
                data={medicineConsumptionData}
                barSize={16}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  shared={true}
                  formatter={(value, name) => [
                    `${value} units`,
                    name === "Consumed" ? "Consumed" : "Remaining",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                />
                <Bar
                  dataKey="consumed"
                  fill="#3b82f6"
                  name="Consumed"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="remaining"
                  fill="#6b7280"
                  opacity={0.4}
                  name="Remaining"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </div>
          </div>
        </ChartCard>

        {/* Registered Seniors by Barangay Density (BarChart) */}
        <ChartCard
          title="Citizen Density by Barangay"
          subtitle="Number of registered senior citizens per Barangay"
        >
          {/* Legend sits above chart to match Medicine Stock section layout */}
          <div className="flex items-center justify-center gap-4 text-xs mb-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: "#10b981" }} />
              <span className="text-muted-foreground">Registered Seniors</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div className="w-max h-[200px]">
              <BarChart
                width={Math.max(1200, barangayDensityData.length * 80)}
                height={200}
                data={barangayDensityData}
                barSize={20}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} Seniors`]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
