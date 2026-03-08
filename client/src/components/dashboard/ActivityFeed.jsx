import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ActivityFeed({ usageLogs, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentLogs = usageLogs.slice(0, 10);

  return (
    <Card className="border-slate-200/60 shadow-lg">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Recent Activity
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Live API request log</p>
          </div>
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No recent activity</p>
            </div>
          ) : (
            recentLogs.map((log, index) => (
              <div 
                key={log.id || index}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors duration-200"
              >
                <div className={`mt-1 p-2 rounded-lg ${
                  log.status_code >= 200 && log.status_code < 300 
                    ? 'bg-green-50' 
                    : 'bg-red-50'
                }`}>
                  {log.status_code >= 200 && log.status_code < 300 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {log.method || 'POST'}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {log.endpoint || '/api/v1/recommendations'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.created_date ? format(new Date(log.created_date), 'HH:mm:ss') : 'Just now'}
                    </span>
                    <span>•</span>
                    <span>{log.response_time || 145}ms</span>
                    <span>•</span>
                    <span>{log.credits_used || 1} credits</span>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={
                    log.status_code >= 200 && log.status_code < 300
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {log.status_code || 200}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}