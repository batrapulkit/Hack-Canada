import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Shield, UserPlus, Trash2, Key, Users, Settings, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function AdminSettings() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
                <p className="text-slate-500 mt-1">Manage your team and security preferences.</p>
            </div>

            <Tabs defaultValue="team" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="team" className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Team
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="mail" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Mail Config
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="team" className="mt-6">
                    <TeamManager />
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <SecuritySettings />
                </TabsContent>

                <TabsContent value="mail" className="mt-6">
                    <MailSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MailSettings() {
    const [config, setConfig] = useState({
        host: '',
        port: '465',
        user: '',
        pass: '',
        fromName: 'Triponic B2B'
    });
    const [loading, setLoading] = useState(true);

    const { data } = useQuery({
        queryKey: ['systemSettings', 'smtp_config'],
        queryFn: async () => {
            const res = await api.get('/admin/system-settings?keys=smtp_config');
            return res.data;
        }
    });

    React.useEffect(() => {
        if (data?.settings?.smtp_config) {
            setConfig(data.settings.smtp_config);
        }
        if (data) setLoading(false);
    }, [data]);

    const mutation = useMutation({
        mutationFn: async (newConfig) => {
            await api.post('/admin/system-settings', {
                key: 'smtp_config',
                value: newConfig
            });
        },
        onSuccess: () => {
            toast.success("SMTP Configuration saved");
        },
        onError: (err) => toast.error("Failed to save configuration")
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        mutation.mutate(config);
    };

    if (loading && !data) return <div>Loading settings...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>
                    Global email settings for mass emails and system notifications.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="host">SMTP Host</Label>
                        <Input
                            id="host"
                            name="host"
                            placeholder="smtp.example.com"
                            value={config.host}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input
                            id="port"
                            name="port"
                            placeholder="465"
                            value={config.port}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">Username</Label>
                        <Input
                            id="user"
                            name="user"
                            placeholder="user@example.com"
                            value={config.user}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pass">Password</Label>
                        <Input
                            id="pass"
                            name="pass"
                            type="password"
                            placeholder="••••••••"
                            value={config.pass}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fromName">Sender Name</Label>
                    <Input
                        id="fromName"
                        name="fromName"
                        placeholder="Triponic Team"
                        value={config.fromName}
                        onChange={handleChange}
                    />
                </div>
                <div className="pt-2">
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                        {mutation.isPending ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function TeamManager() {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const { data, isLoading } = useQuery({
        queryKey: ['adminTeam'],
        queryFn: async () => {
            const res = await api.get('/admin/team');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (newAdmin) => {
            await api.post('/admin/team', newAdmin);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminTeam']);
            setIsAddOpen(false);
            setFormData({ name: '', email: '', password: '' });
            toast.success("Super Admin added successfully");
        },
        onError: (err) => toast.error(err.response?.data?.error || "Failed to add admin")
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/team/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminTeam']);
            toast.success("Admin removed");
        },
        onError: (err) => toast.error(err.response?.data?.error || "Failed to remove admin")
    });

    const handleSubmit = () => {
        if (!formData.name || !formData.email || !formData.password) {
            return toast.error("All fields are required");
        }
        createMutation.mutate(formData);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Super Admin Team</CardTitle>
                    <CardDescription>
                        Manage users with full access to the platform.
                    </CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="w-4 h-4 mr-2" /> Add Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Super Admin</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="jane@triponic.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Adding...' : 'Create Admin Account'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Loading team...</TableCell>
                            </TableRow>
                        ) : data?.admins?.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell className="font-medium">{admin.name}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>{format(new Date(admin.created_at), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                    {admin.id === currentUser?.id ? (
                                        <span className="text-xs text-slate-400 italic mr-2">It's You</span>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                if (confirm("Remove this admin? They will lose all access immediately.")) {
                                                    deleteMutation.mutate(admin.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SecuritySettings() {
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    const updatePassMutation = useMutation({
        mutationFn: async (data) => {
            await api.put('/admin/password', {
                currentPassword: data.current,
                newPassword: data.new
            });
        },
        onSuccess: () => {
            setPassData({ current: '', new: '', confirm: '' });
            toast.success("Password updated successfully");
        },
        onError: (err) => toast.error(err.response?.data?.error || "Failed to update password")
    });

    const handleUpdate = () => {
        if (!passData.current || !passData.new || !passData.confirm) {
            return toast.error("All fields are required");
        }
        if (passData.new !== passData.confirm) {
            return toast.error("New passwords do not match");
        }
        if (passData.new.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }
        updatePassMutation.mutate(passData);
    };

    return (
        <Card className="max-w-xl">
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                    Update your password to keep your account secure.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                        type="password"
                        value={passData.current}
                        onChange={e => setPassData({ ...passData, current: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                        type="password"
                        value={passData.new}
                        onChange={e => setPassData({ ...passData, new: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                        type="password"
                        value={passData.confirm}
                        onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                    />
                </div>
                <div className="pt-2">
                    <Button onClick={handleUpdate} disabled={updatePassMutation.isPending}>
                        {updatePassMutation.isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
