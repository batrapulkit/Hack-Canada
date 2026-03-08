import React, { useState } from "react";
import api from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Mail, 
  MoreVertical,
  UserPlus,
  Shield,
  Code2,
  User
} from "lucide-react";
import { motion } from "framer-motion";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleIcons = {
  admin: Shield,
  business_client: User,
  team_member: Users,
  developer: Code2
};

const roleColors = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  business_client: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  team_member: 'bg-blue-50 text-blue-700 border-blue-200',
  developer: 'bg-purple-50 text-purple-700 border-purple-200'
};

export default function Team() {
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    user_role: 'team_member',
    job_title: ''
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.entities.User.list(),
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
              <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              Team Management
            </h1>
            <p className="text-slate-600">
              Invite and manage team members with role-based access
            </p>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-cyan-500">
                <Plus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteData.user_role}
                    onValueChange={(value) => setInviteData({ ...inviteData, user_role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team_member">Team Member</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="business_client">Business Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="job_title">Job Title (Optional)</Label>
                  <Input
                    id="job_title"
                    placeholder="Product Manager"
                    value={inviteData.job_title}
                    onChange={(e) => setInviteData({ ...inviteData, job_title: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                  onClick={() => {
                    // In real implementation, send invite email
                    setShowInviteDialog(false);
                    setInviteData({ email: '', user_role: 'team_member', job_title: '' });
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Total Members</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{users.length}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Code2 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Developers</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {users.filter(u => u.user_role === 'developer').length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Admins</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {users.filter(u => u.user_role === 'admin').length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Pending Invites</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">2</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-xl font-bold text-slate-900">Team Members</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Manage roles and permissions</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {users.map((user, index) => {
              const RoleIcon = roleIcons[user.user_role] || User;
              return (
                <motion.div
                  key={user.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {user.full_name || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      {user.job_title && (
                        <p className="text-xs text-slate-400 mt-0.5">{user.job_title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={roleColors[user.user_role]}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {user.user_role?.replace('_', ' ')}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem>View Activity</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Remove Member</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}