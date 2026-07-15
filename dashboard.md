import React, { useState } from "react";
import {
  ArrowRightLeft,
  TrendingUp,
  Users,
  Coins,
} from "lucide-react";
import useSWR from "swr";
import DashboardSkeleton from "@/components/admin-compo/dashboard-skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const deliveryStatusStyles: Record<string, string> = {
  Preparing:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Out for Delivery":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Delivered:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Rescheduled:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Failed Delivery":
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

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
        <h1 className="text-muted-foreground text-base font-medium">{label}</h1>
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

export default function DashboardClient() {
  const [revenueTimeframe, setRevenueTimeframe] = useState<
    "week" | "month" | "year"
  >("week");
  const [insightsTimeframe, setInsightsTimeframe] = useState<
    "week" | "month" | "year"
  >("week");

  const { data, isLoading } = useSWR(
    `/api/admin/dashboard?revenueTimeframe=${revenueTimeframe}&insightsTimeframe=${insightsTimeframe}`,
    fetcher,
    {
      refreshInterval: 30000,
    },
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const {
    stats,
    revenueChart,
    bestSellers,
    recentOrders,
    customizeChart,
    customerInsightChart,
    materialChart,
  } = data ?? {};

  return (
    <div className="space-y-5">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₱${Number(stats?.totalRevenue ?? 0).toLocaleString("en-PH")}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Average Order Value"
          value={`₱${Number(stats?.averageOrderValue ?? 0).toLocaleString("en-PH")}`}
          icon={Coins}
        />
        <StatCard
          label="Total Orders"
          value={(stats?.totalOrders ?? 0).toLocaleString()}
          icon={ArrowRightLeft}
        />
        <StatCard
          label="Active Customers"
          value={(stats?.activeCustomers ?? 0).toLocaleString()}
          icon={Users}
        />
      </div>

      {/* ── Revenue + Customize Requests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title={
            revenueTimeframe === "week"
              ? "Revenue This Week"
              : revenueTimeframe === "month"
                ? "Revenue This Month"
                : "Revenue This Year"
          }
          subtitle={
            revenueTimeframe === "week"
              ? "Daily revenue from paid orders"
              : revenueTimeframe === "month"
                ? "Daily revenue this month"
                : "Monthly revenue this year"
          }
          headerAction={
            <div className="flex border rounded-md p-0.5 bg-muted/30">
              {(["week", "month", "year"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRevenueTimeframe(t)}
                  className={`text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm transition-all ${
                    revenueTimeframe === t
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
            <BarChart
              data={revenueChart ?? []}
              barSize={30}
              margin={{ left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [
                  `₱${Number(value).toLocaleString("en-PH")}`,
                  "Revenue",
                ]}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Bar
                dataKey="revenue"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Customize Requests"
          subtitle="Breakdown by current status"
        >
          {(customizeChart ?? []).length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              No requests yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={customizeChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(customizeChart ?? []).map(
                    (entry: { color: string }, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ),
                  )}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}`]}
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

      {/* ── Recent Orders + Best Sellers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Recent Orders" subtitle="Latest 5 paid orders">
          <div className="border rounded-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Order #
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Customer
                    </th>
                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                      Total
                    </th>
                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(recentOrders ?? []).length > 0 ? (
                    (recentOrders ?? []).map(
                      (order: {
                        order_number: string;
                        customer_name: string;
                        total: number;
                        delivery_status: string;
                      }) => (
                        <tr
                          key={order.order_number}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-xs whitespace-nowrap">
                            {order.order_number}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px] whitespace-nowrap">
                            {order.customer_name}
                          </td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                            ₱{order.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-sm font-medium ${
                                deliveryStatusStyles[order.delivery_status] ??
                                "bg-muted text-muted-foreground"
                              }`}
                            >
                              {order.delivery_status}
                            </span>
                          </td>
                        </tr>
                      ),
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-muted-foreground text-xs"
                      >
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Best Selling Products" subtitle="Top 5 by units sold">
          <div className="border rounded-lg overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Product
                    </th>
                    <th className="px-4 py-3 font-medium text-right whitespace-nowrap">
                      Units Sold
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(bestSellers ?? []).length > 0 ? (
                    (bestSellers ?? []).map(
                      (item: { name: string; quantity: number }, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                            {item.quantity}
                          </td>
                        </tr>
                      ),
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-6 text-center text-muted-foreground text-xs"
                      >
                        No sales yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Customer Insights + Material Consumption ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Customer Insights"
          subtitle={
            insightsTimeframe === "week"
              ? "New vs returning customers this week"
              : insightsTimeframe === "month"
                ? "New vs returning customers this month"
                : "New vs returning customers this year"
          }
          headerAction={
            <div className="flex border rounded-md p-0.5 bg-muted/30">
              {(["week", "month", "year"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setInsightsTimeframe(t)}
                  className={`text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm transition-all ${
                    insightsTimeframe === t
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
            <LineChart data={customerInsightChart ?? []} margin={{ left: -20 }}>
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
                dataKey="new"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                name="New Customers"
              />
              <Line
                type="monotone"
                dataKey="returning"
                stroke="var(--muted-foreground)"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
                name="Returning"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Raw Material Consumption"
          subtitle="Consumed vs remaining stock (all)"
        >
          {/* ── Centered legend, sits above the scroll area and never scrolls with it ── */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: "var(--primary)" }}
              />
              <span className="text-muted-foreground">Consumed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm opacity-40"
                style={{ backgroundColor: "var(--muted-foreground)" }}
              />
              <span className="text-muted-foreground">Remaining</span>
            </div>
          </div>

          <ScrollArea className="w-full mt-2" type="always">
            <div
              style={{
                minWidth: `${Math.max(500, (materialChart ?? []).length * 110)}px`,
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={materialChart ?? []}
                  barSize={14}
                  margin={{ left: -20 }}
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
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value}`,
                      name === "consumed" ? "Consumed" : "Remaining",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="consumed"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="remaining"
                    fill="var(--muted-foreground)"
                    opacity={0.4}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </ChartCard>
      </div>
    </div>
  );
}
