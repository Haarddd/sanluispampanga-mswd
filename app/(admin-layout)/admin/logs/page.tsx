"use client";

import React, { useState, useMemo } from "react";
import { useAdminStore, AdminLog } from "@/components/admin/admin-store-provider";
import { Search, Eye, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const { logs } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  
  // Expanded log rows IDs for JSON inspector
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // View log payload dialog state
  const [inspectingLog, setInspectingLog] = useState<AdminLog | null>(null);

  // Extract all unique action types for filter options
  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return ["ALL", ...Array.from(set)];
  }, [logs]);

  // Filter logs logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // JSON details search target string
      const detailsStr = JSON.stringify(log.details).toLowerCase();
      const matchSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.senior_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        detailsStr.includes(searchQuery.toLowerCase());

      const matchAction =
        selectedActionFilter === "ALL" || log.action === selectedActionFilter;

      const matchStatus =
        selectedStatusFilter === "ALL" || log.status === selectedStatusFilter;

      return matchSearch && matchAction && matchStatus;
    });
  }, [logs, searchQuery, selectedActionFilter, selectedStatusFilter]);

  const toggleExpandRow = (id: string) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title Header */}
      <div>
        <h1 className="text-xl font-semibold">Administrative Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Read-only history tracking security logs, state transitions, API transactions, and staff access records.
        </p>
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch mb-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by action, client name, parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-10 mb-0.5"
          />
        </div>

        {/* Action & Status selectors */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch shrink-0">
          {/* Action Filter */}
          <Select
            value={selectedActionFilter}
            onValueChange={setSelectedActionFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === "ALL" ? "All Actions" : opt.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={selectedStatusFilter}
            onValueChange={setSelectedStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[130px] h-10">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All States</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="ERROR">Errors</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Registry Table */}
      <div className="border bg-card rounded-t-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-muted-foreground text-xs bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium w-px">State</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Administrator</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Action Trigger</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Target Record</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      className={cn(
                        "hover:bg-muted/40 transition-colors cursor-pointer select-none",
                        isExpanded && "bg-muted/20"
                      )}
                      onClick={() => toggleExpandRow(log.id)}
                    >
                      <td className="px-4 py-3 align-middle">
                        {log.status === "SUCCESS" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-muted-foreground text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium align-middle whitespace-nowrap">
                        {log.admin_name} <span className="text-xs text-muted-foreground">({log.admin_id})</span>
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <span className="font-semibold text-foreground uppercase tracking-wide text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs align-middle whitespace-nowrap">
                        {log.target_type}: {log.target_id}
                      </td>
                      <td className="px-4 py-3 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingLog(log);
                            }}
                          >
                            <FileCode className="h-3.5 w-3.5 mr-1" /> Inspect
                          </Button>
                          <span className="text-muted-foreground">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expandable row content */}
                    {isExpanded && (
                      <tr className="bg-muted/10">
                        <td colSpan={6} className="px-6 py-4 border-b">
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                              Detailed Payload JSON parameters
                            </span>
                            <pre className="p-3 border bg-card text-xs font-mono text-foreground rounded-md overflow-x-auto leading-relaxed max-w-2xl shadow-sm">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-xs">
                    No administrative audit trails found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- INSPECT LOG MODAL DIAG --- */}
      {inspectingLog && (
        <Dialog open onOpenChange={(open) => !open && setInspectingLog(null)}>
          <DialogContent className="!max-w-xl w-full p-0 rounded-sm overflow-hidden flex flex-col">
            <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
                <h2 className="font-semibold text-sm">Metadata Reference: {inspectingLog.id}</h2>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-sm flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">Action Trigger</span>
                    <span className="font-bold text-foreground uppercase text-xs">
                      {inspectingLog.action}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Triggered Date</span>
                    <span className="font-semibold text-foreground">
                      {new Date(inspectingLog.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Triggering Admin</span>
                    <span className="font-semibold text-foreground">
                      {inspectingLog.admin_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Target Reference</span>
                    <span className="font-semibold text-foreground">
                      {inspectingLog.target_type}: {inspectingLog.target_id}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Database Payload Input
                  </span>
                  <pre className="p-3 border bg-muted/20 text-xs font-mono text-foreground rounded-md overflow-x-auto leading-relaxed max-h-[180px] shadow-inner">
                    {JSON.stringify(inspectingLog.details, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t bg-muted/20 flex justify-end shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold rounded-md"
                  onClick={() => setInspectingLog(null)}
                >
                  Close Inspector
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
