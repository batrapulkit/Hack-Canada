import React, { useState } from 'react';
import api from "@/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle2,
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function APIKeyManager({ apiKeys, isLoading }) {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [newKey, setNewKey] = useState({
    key_name: '',
    environment: 'sandbox'
  });

  const createKeyMutation = useMutation({
    mutationFn: (keyData) => {
      const generatedKey = 'trp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      return api.entities.APIKey.create({
        ...keyData,
        api_key: generatedKey,
        organization_id: 'org_demo_123'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setShowCreateDialog(false);
      setNewKey({ key_name: '', environment: 'sandbox' });
      toast.success('API key created successfully');
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id) => api.entities.APIKey.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key deleted');
    },
  });

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Your API Keys</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Manage access to Triponic AI services</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for your integration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="key_name">Key Name</Label>
                    <Input
                      id="key_name"
                      placeholder="Production API Key"
                      value={newKey.key_name}
                      onChange={(e) => setNewKey({ ...newKey, key_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={newKey.environment}
                      onValueChange={(value) => setNewKey({ ...newKey, environment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                    onClick={() => createKeyMutation.mutate(newKey)}
                    disabled={!newKey.key_name}
                  >
                    Generate API Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-4">No API keys yet</p>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create your first API key
                </Button>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{key.key_name}</h3>
                        <Badge 
                          variant="secondary"
                          className={
                            key.environment === 'production'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }
                        >
                          {key.environment}
                        </Badge>
                        <Badge 
                          variant="secondary"
                          className={
                            key.status === 'active'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }
                        >
                          {key.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-slate-100 px-3 py-1 rounded-lg font-mono">
                          {visibleKeys[key.id] 
                            ? key.api_key 
                            : key.api_key?.substring(0, 12) + '••••••••••••'}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys[key.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(key.api_key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteKeyMutation.mutate(key.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>Usage: {key.usage_count || 0} calls</span>
                    {key.last_used && (
                      <>
                        <span>•</span>
                        <span>Last used: {new Date(key.last_used).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}