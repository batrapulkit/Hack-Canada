import React, { useState } from "react";
import api from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Key, Book, Sparkles, Plus } from "lucide-react";
import { motion } from "framer-motion";

import APIKeyManager from "../components/api/APIKeyManager.jsx";
import APIDocumentation from "../components/api/APIDocumentation.jsx";
import SDKSection from "../components/api/SDKSection.jsx";

export default function APIPortal() {
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => api.entities.APIKey.list('-created_date'),
    initialData: [],
  });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-xl">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              API Portal
            </h1>
            <p className="text-slate-600">
              Manage API keys, access documentation, and integrate Triponic AI
            </p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="keys" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            <Book className="w-4 h-4 mr-2" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="sdk" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            SDKs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <APIKeyManager apiKeys={apiKeys} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="docs">
          <APIDocumentation />
        </TabsContent>

        <TabsContent value="sdk">
          <SDKSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}