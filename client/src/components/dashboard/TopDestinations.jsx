import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";


const mockDestinations = [];

export default function TopDestinations({ isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/60 shadow-lg">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" />
          Top Destinations
        </CardTitle>
        <p className="text-sm text-slate-500">Most requested this month</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {mockDestinations.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <MapPin className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>No destination data yet</p>
            </div>
          ) : (
            mockDestinations.map((destination, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                          'bg-slate-100 text-slate-600'
                    }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{destination.name}</p>
                    <p className="text-sm text-slate-500">{destination.requests.toLocaleString()} requests</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {destination.trend}
                </Badge>
              </div>
            )))}
        </div>
      </CardContent>
    </Card>
  );
}