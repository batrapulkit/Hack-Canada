import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Building2, Bell, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function TriponicSettings() {
  const [notifications, setNotifications] = useState({
    email: true,
    bookings: true,
    payments: true,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
          Settings
        </h1>
        <p className="text-slate-600">
          Configure your agency preferences
        </p>
      </motion.div>

      <Tabs defaultValue="agency" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="agency">
            <Building2 className="w-4 h-4 mr-2" />
            Agency
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agency">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Agency Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agency_name">Agency Name</Label>
                  <Input id="agency_name" defaultValue="Travel Co." />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="contact@travelco.com" />
                </div>
              </div>
              <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-blue-600">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-500">Receive updates via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-blue-600">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-600">Security settings coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}