import React, { useState, useEffect } from "react";
import { CountrySelect } from "@/components/common/CountrySelect";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Building2, Bell, Shield, Palette, Code, Link2, Crown, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "@/api/client";
import { useBranding } from "@/contexts/BrandingContext";
import { useAuth } from "@/contexts/AuthContext";
import IntegrationsSettings from "@/components/settings/IntegrationsSettings";
import DeveloperSettings from "@/components/settings/DeveloperSettings";

export default function Settings() {
  const { updateBranding } = useBranding();
  const { user } = useAuth(); // Needed for widget code

  // Notification toggles
  const [notifications, setNotifications] = useState({
    email: true,
    usage: true,
    billing: true,
    updates: false,
  });

  // Organization branding settings
  const [settings, setSettings] = useState({
    company_name: "",
    domain: "",
    industry: "",
    contact_email: "",
    logo_url: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    tico_registration_number: "",
    invoice_settings: {
      templateStyle: "standard",
      primaryColor: "", // Override global brand color for invoice
      secondaryColor: "",
      backgroundImageUrl: "", // Letterhead/Watermark
      customFooter: "",
      paymentInstructions: ""
    }
  });

  // Agency subscription info
  const [agency, setAgency] = useState(null);

  // Password change state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success("Password changed successfully");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    // Load agency settings
    api
      .get("/settings")
      .then((res) => {
        const data = res.data?.settings || {};
        const agencyData = res.data?.agency || {};

        setSettings({
          company_name: data.company_name || "",
          domain: data.domain || "",
          industry: data.industry || "",
          country: data.country || "",
          contact_email: data.contact_email || "",
          logo_url: data.logo_url || "",
          phone: data.phone || data.contact_phone || "",
          address_line1: data.address_line1 || "",
          address_line2: data.address_line2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          tico_registration_number: data.tico_registration_number || "",
          invoice_settings: data.invoice_settings || {
            templateStyle: "standard",
            primaryColor: "",
            secondaryColor: "",
            backgroundImageUrl: "",
            customFooter: "",
            paymentInstructions: "",
            defaultTaxRate: 0
          },
          smtp_host: data.smtp_host || "",
          smtp_port: data.smtp_port || "",
          smtp_user: data.smtp_user || "",
          // Password not returned for security usually, but if we do return it (bad practice but MVP):
          smtp_pass: "",
        });

        // Set agency subscription data from the same response
        setAgency(agencyData);
      })
      .catch(() => toast.error("Failed to load settings"));
  }, []);

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const toastId = toast.loading(`Uploading ${type}...`);

    try {
      const res = await api.post('/agencies/upload-asset', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success(`${type} uploaded!`, { id: toastId });

        // Update local state immediately
        if (type === 'logo') {
          setSettings(prev => ({ ...prev, logo_url: res.data.url }));
        } else if (type === 'letterhead') {
          setSettings(prev => ({
            ...prev,
            invoice_settings: {
              ...prev.invoice_settings,
              backgroundImageUrl: res.data.url
            }
          }));
        }
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed", { id: toastId });
    }
  };

  const handleSave = async () => {
    try {
      await api.put("/settings", { organization: settings });

      // Update branding context
      updateBranding({
        company_name: settings.company_name,
        logo_url: settings.logo_url,
        phone: settings.phone,
        addressLine1: settings.address_line1,
        addressLine2: settings.address_line2,
        city: settings.city,
        state: settings.state,
        zip: settings.zip,
        country: settings.country,
        ticoRegistrationNumber: settings.tico_registration_number,
        invoiceSettings: settings.invoice_settings
      });

      toast.success("Settings saved successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            Settings
          </h1>
          <p className="text-slate-600">Manage your organization preferences and configurations</p>
        </div>
      </motion.div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="organization">
            <Building2 className="w-4 h-4 mr-2" /> Organization
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <SettingsIcon className="w-4 h-4 mr-2" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Link2 className="w-4 h-4 mr-2" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="widgets">
            <Code className="w-4 h-4 mr-2" /> Widgets
          </TabsTrigger>
          <TabsTrigger value="email">
            <SettingsIcon className="w-4 h-4 mr-2" /> Email
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <Crown className="w-4 h-4 mr-2" /> Subscription
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Update your company information</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label>Organization Profile</Label>
                    <div className="h-px bg-slate-100 mt-2 mb-4"></div>
                  </div>

                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={settings.company_name}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Main Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website / Domain</Label>
                    <Input
                      id="domain"
                      value={settings.domain}
                      onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center space-x-4">
                    <Label htmlFor="logo_url" className="flex-shrink-0">Logo URL</Label>
                    <Input
                      id="logo_url"
                      placeholder="https://example.com/logo.png"
                      value={settings.logo_url}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    />
                    {settings.logo_url && (
                      <img src={settings.logo_url} alt="Logo preview" className="h-10 w-auto rounded border" />
                    )}
                  </div>
                </div>

                {/* Local Compliance (Address & TICO) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label>Location & Compliance (Required for Invoices)</Label>
                    <div className="h-px bg-slate-100 mt-2 mb-4"></div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={settings.address_line1}
                      onChange={(e) => setSettings({ ...settings, address_line1: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address_line2">Address Line 2 (Suite, etc)</Label>
                    <Input
                      id="address_line2"
                      value={settings.address_line2}
                      onChange={(e) => setSettings({ ...settings, address_line2: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      value={settings.state}
                      onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">Zip / Postal Code</Label>
                    <Input
                      id="zip"
                      value={settings.zip}
                      onChange={(e) => setSettings({ ...settings, zip: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <div className="relative">
                      <CountrySelect
                        value={settings.country}
                        onChange={(val) => {
                          const newCountry = val;
                          let newTaxRate = settings.invoice_settings?.defaultTaxRate || 0;

                          // Smart Tax Defaulting
                          if (newCountry === 'Canada') newTaxRate = 13;
                          if (newCountry === 'United Kingdom') newTaxRate = 20;
                          if (newCountry === 'Australia') newTaxRate = 10;
                          if (newCountry === 'United States') newTaxRate = 0; // Fixed USA name to match list

                          setSettings({
                            ...settings,
                            country: newCountry,
                            invoice_settings: {
                              ...settings.invoice_settings,
                              defaultTaxRate: newTaxRate
                            }
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="tico" className="text-red-700 font-bold">TICO Registration Number</Label>
                    <Input
                      id="tico"
                      value={settings.tico_registration_number}
                      onChange={(e) => setSettings({ ...settings, tico_registration_number: e.target.value })}
                      placeholder="e.g. 50012345"
                    />
                    <p className="text-xs text-slate-500 mt-1">Required by Ontario Law. Will be displayed on all invoices.</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-cyan-500">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle>Invoice Configuration</CardTitle>
              <CardDescription>Customize the look and feel of your client invoices</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Invoice Design */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label>Invoice Design System</Label>
                  <div className="h-px bg-slate-100 mt-2 mb-4"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="template_style">Template Style</Label>
                    <select
                      id="template_style"
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      value={settings.invoice_settings?.templateStyle || "standard"}
                      onChange={(e) => setSettings({
                        ...settings,
                        invoice_settings: { ...settings.invoice_settings, templateStyle: e.target.value }
                      })}
                    >
                      <option value="standard">Standard (Bold)</option>
                      <option value="minimal">Minimal (Clean)</option>
                      <option value="classic">Classic (Formal)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Choose the layout for your invoices. "Standard" uses your brand colors heavily.</p>
                  </div>

                  <div>
                    <Label htmlFor="bg_url">Letterhead / Background Image URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="bg_url"
                        value={settings.invoice_settings?.backgroundImageUrl || ""}
                        onChange={(e) => setSettings({
                          ...settings,
                          invoice_settings: { ...settings.invoice_settings, backgroundImageUrl: e.target.value }
                        })}
                        placeholder="https://example.com/letterhead.png"
                        className="flex-grow"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          id="upload-template"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files[0], 'letterhead')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('upload-template').click()}
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
                    {settings.invoice_settings?.backgroundImageUrl && (
                      <div className="mt-2 border rounded-md p-2 w-32 bg-slate-50">
                        <img src={settings.invoice_settings.backgroundImageUrl} alt="Template Preview" className="w-full h-auto opacity-50" />
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Upload a full-page image (A4/Letter) to be used as the background/watermark for your Invoices and Quotes.</p>
                  </div>

                  <div>
                    <Label htmlFor="inv_primary_color">Invoice Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0">
                        <input
                          type="color"
                          className="w-[150%] h-[150%] -m-[25%] cursor-pointer p-0 border-0"
                          value={settings.invoice_settings?.primaryColor || "#0f172a"}
                          onChange={(e) => setSettings({
                            ...settings,
                            invoice_settings: { ...settings.invoice_settings, primaryColor: e.target.value }
                          })}
                        />
                      </div>
                      <Input
                        value={settings.invoice_settings?.primaryColor || ""}
                        onChange={(e) => setSettings({
                          ...settings,
                          invoice_settings: { ...settings.invoice_settings, primaryColor: e.target.value }
                        })}
                        placeholder="#0f172a"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Overrides global brand color for invoices only.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label>Invoice Content Defaults</Label>
                  <div className="h-px bg-slate-100 mt-2 mb-4"></div>
                </div>

                <div>
                  <Label htmlFor="default_payment_instructions">Default Payment Instructions</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    id="default_payment_instructions"
                    value={settings.invoice_settings?.paymentInstructions || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      invoice_settings: { ...settings.invoice_settings, paymentInstructions: e.target.value }
                    })}
                    placeholder="Enter bank details, e-transfer email, etc."
                  />
                  <p className="text-xs text-slate-500 mt-1">These will automatically appear on new invoices.</p>
                </div>

                <div>
                  <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    id="default_tax_rate"
                    value={settings.invoice_settings?.defaultTaxRate || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      invoice_settings: { ...settings.invoice_settings, defaultTaxRate: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="e.g. 13"
                  />
                  <p className="text-xs text-slate-500 mt-1">Automatically applied to new invoices (Domestic).</p>
                </div>

                <div>
                  <Label htmlFor="default_footer">Default Footer Text</Label>
                  <Input
                    id="default_footer"
                    value={settings.invoice_settings?.customFooter || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      invoice_settings: { ...settings.invoice_settings, customFooter: e.target.value }
                    })}
                    placeholder="e.g. Thank you for your business!"
                  />
                </div>
              </div>
              <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-cyan-500">
                Save Invoice Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure your custom SMTP settings for sending emails</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    placeholder="smtp.example.com"
                    value={settings.smtp_host || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    placeholder="465"
                    value={settings.smtp_port || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_user">SMTP Username</Label>
                  <Input
                    id="smtp_user"
                    placeholder="email@example.com"
                    value={settings.smtp_user || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_pass">SMTP Password</Label>
                  <Input
                    id="smtp_pass"
                    type="password"
                    placeholder="••••••••"
                    value={settings.smtp_pass || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <Shield className="w-4 h-4" />
                <span>Your SMTP credentials are stored securely and used only for sending emails to your clients.</span>
              </div>
              <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-cyan-500">
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Email Notifications</p>
                    <p className="text-sm text-slate-500">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Usage Alerts</p>
                    <p className="text-sm text-slate-500">Get notified when reaching credit limits</p>
                  </div>
                  <Switch
                    checked={notifications.usage}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, usage: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Billing Notifications</p>
                    <p className="text-sm text-slate-500">Payment and invoice updates</p>
                  </div>
                  <Switch
                    checked={notifications.billing}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, billing: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Product Updates</p>
                    <p className="text-sm text-slate-500">News about new features and improvements</p>
                  </div>
                  <Switch
                    checked={notifications.updates}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
                  />
                </div>
              </div>
              <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-cyan-500">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card className="border-slate-200/60 shadow-lg">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <CardTitle>API Integrations</CardTitle>
                <CardDescription>Connect external travel providers to sync data</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <IntegrationsSettings />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-medium text-slate-900">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-cyan-500 w-full"
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="font-medium text-slate-900">Two-Factor Authentication (2FA)</p>
                    <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" disabled>Coming Soon</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize your dashboard experience</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-4 rounded-lg border-2 border-indigo-600 bg-white cursor-pointer">
                    <p className="font-medium">Light Mode</p>
                    <p className="text-sm text-slate-500">Current theme</p>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-900 cursor-pointer">
                    <p className="font-medium text-white">Dark Mode</p>
                    <p className="text-sm text-slate-400">Coming soon</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle>Lead Capture Widget</CardTitle>
              <CardDescription>Embed this form on your website to capture leads automatically</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-medium text-slate-900 mb-2">Embed Code</h3>
                <p className="text-sm text-slate-500 mb-4">Copy and paste this code into your website's HTML where you want the form to appear.</p>

                <div className="relative group">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {`<iframe 
  src="${window.location.origin}/widget/${user?.agency?.id || '...'}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border:none; max-width: 500px; margin: 0 auto; display: block;"
></iframe>`}
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const code = `<iframe src="${window.location.origin}/widget/${user?.agency?.id}" width="100%" height="600" frameborder="0" style="border:none; max-width: 500px; margin: 0 auto; display: block;"></iframe>`;
                      navigator.clipboard.writeText(code);
                      toast.success("Copied to clipboard!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-medium text-slate-900 mb-4">Preview</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <iframe
                    src={`${window.location.origin}/widget/${user?.agency?.id}`}
                    width="100%"
                    height="600"
                    frameBorder="0"
                    title="Widget Preview"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <DeveloperSettings />
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card className="border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle>Subscription & Plan</CardTitle>
              <CardDescription>View your current subscription tier and features</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {agency ? (
                <>
                  {/* Current Plan Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-md">
                          <Crown className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 capitalize">
                            {agency.subscription_plan?.replace('agency_', '') || 'Starter'} Plan
                          </h3>
                          <p className="text-slate-600 mt-1">
                            {agency.subscription_plan === 'agency_pro' ? "You're a Pro User! 🎉" :
                              agency.subscription_plan === 'agency_plus' ? "Plus features enabled" :
                                "Basic plan active"}
                          </p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${agency.subscription_status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : agency.subscription_status === 'suspended'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                        Status: {agency.subscription_status || 'Active'}
                      </div>
                    </div>

                    {/* Usage Stats (if applicable) */}
                    {agency.usage_limit && (
                      <div className="mt-4 pt-4 border-t border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Monthly Usage</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {agency.usage_count || 0} / {agency.usage_limit}
                          </span>
                        </div>
                        <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(((agency.usage_count || 0) / (agency.usage_limit || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plan Features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {/* Starter Features */}
                    <div className={`p-5 rounded-xl border-2 ${agency.subscription_plan === 'agency_starter' || !agency.subscription_plan
                      ? 'border-indigo-200 bg-indigo-50/50'
                      : 'border-slate-200 bg-white'
                      }`}>
                      <h4 className="font-bold text-lg text-slate-900 mb-3">Starter</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Core CRM features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Basic itinerary creation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Invoicing tools</span>
                        </li>
                      </ul>
                    </div>

                    {/* Plus Features */}
                    <div className={`p-5 rounded-xl border-2 ${agency.subscription_plan === 'agency_plus'
                      ? 'border-sky-200 bg-sky-50/50'
                      : 'border-slate-200 bg-white'
                      }`}>
                      <h4 className="font-bold text-lg text-slate-900 mb-3">Plus</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Everything in Starter</span>
                        </li>
                        <li className="flex items-center gap-2">
                          {agency.subscription_plan === 'agency_plus' || agency.subscription_plan === 'agency_pro' ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                          <span>Advanced AI features</span>
                        </li>
                        <li className="flex items-center gap-2">
                          {agency.subscription_plan === 'agency_plus' || agency.subscription_plan === 'agency_pro' ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                          <span>GDS integrations</span>
                        </li>
                      </ul>
                    </div>

                    {/* Pro Features */}
                    <div className={`p-5 rounded-xl border-2 ${agency.subscription_plan === 'agency_pro'
                      ? 'border-indigo-200 bg-indigo-50/50'
                      : 'border-slate-200 bg-white'
                      }`}>
                      <h4 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                        Pro
                        {agency.subscription_plan === 'agency_pro' && (
                          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Everything in Plus</span>
                        </li>
                        <li className="flex items-center gap-2">
                          {agency.subscription_plan === 'agency_pro' ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-center gap-2">
                          {agency.subscription_plan === 'agency_pro' ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                          <span>Unlimited usage</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Contact Admin Note */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">
                      💡 To upgrade your plan or modify your subscription, please contact your system administrator.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>Loading subscription information...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >
    </div >
  );
}