import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Code2, Zap, MapPin, Users, MessageSquare } from "lucide-react";

const endpoints = [
  {
    name: "Trip Recommendations",
    method: "POST",
    endpoint: "/api/v1/recommendations",
    description: "Get personalized trip recommendations based on user preferences",
    icon: Zap,
    example: `{
  "user_preferences": {
    "budget": "medium",
    "interests": ["culture", "food"],
    "travel_style": "adventure"
  },
  "constraints": {
    "duration": "7-10 days",
    "season": "summer"
  }
}`
  },
  {
    name: "Destination Insights",
    method: "GET",
    endpoint: "/api/v1/destinations/{id}/insights",
    description: "Retrieve AI-powered insights and analytics for specific destinations",
    icon: MapPin,
    example: `// GET request
// Returns comprehensive destination data including
// trends, seasonal patterns, and traveler sentiment`
  },
  {
    name: "Traveler Personas",
    method: "POST",
    endpoint: "/api/v1/personas/analyze",
    description: "Analyze traveler data to build detailed persona profiles",
    icon: Users,
    example: `{
  "traveler_data": {
    "age_range": "25-34",
    "booking_history": [...],
    "preferences": {...}
  }
}`
  },
  {
    name: "Chatbot Integration",
    method: "POST",
    endpoint: "/api/v1/chat",
    description: "Embed conversational AI for travel planning assistance",
    icon: MessageSquare,
    example: `{
  "message": "I want to plan a trip to Japan",
  "context": {
    "user_id": "user_123",
    "conversation_id": "conv_456"
  }
}`
  }
];

export default function APIDocumentation() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-xl font-bold text-slate-900">API Endpoints</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Comprehensive API reference for Triponic AI services</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => {
              const Icon = endpoint.icon;
              return (
                <div
                  key={index}
                  className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-xl">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{endpoint.name}</h3>
                        <Badge className={
                          endpoint.method === 'POST' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }>
                          {endpoint.method}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{endpoint.description}</p>
                      <code className="text-sm bg-slate-900 text-cyan-400 px-4 py-2 rounded-lg block font-mono">
                        {endpoint.endpoint}
                      </code>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Example Request:</p>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{endpoint.example}</code>
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-xl font-bold text-slate-900">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-600 mb-4">
            All API requests require authentication using your API key in the request header:
          </p>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
            <code>{`curl -X POST https://api.triponic.ai/v1/recommendations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"user_preferences": {...}}'`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}