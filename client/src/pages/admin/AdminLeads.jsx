import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Phone, Mail, Plus, Search, MoreHorizontal, Calendar, Building, Trash2, Pencil, CheckCircle2, FileUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminLeads() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentLead, setCurrentLead] = useState(null);
    const [deleteId, setDeleteId] = useState(null); // State for delete dialog
    const [formData, setFormData] = useState({
        company_name: '', contact_name: '', email: '', phone: '', status: 'new', notes: ''
    });
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [csvContent, setCsvContent] = useState('');
    const [parsedLeads, setParsedLeads] = useState([]);

    const { data, isLoading } = useQuery({
        queryKey: ['adminLeads'],
        queryFn: async () => {
            const res = await api.get('/admin/leads');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (newLead) => {
            await api.post('/admin/leads', newLead);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminLeads']);
            setIsAddOpen(false);
            setFormData({ company_name: '', contact_name: '', email: '', phone: '', status: 'new', notes: '' });
            toast.success("Designated prospect added successfully");
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }) => {
            await api.put(`/admin/leads/${id}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminLeads']);
            setIsEditOpen(false);
            toast.success("Lead updated successfully");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/admin/leads/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminLeads']);
            toast.success("Lead deleted");
            setDeleteId(null);
        },
        onError: (err) => {
            console.error("Delete error:", err);
            toast.error("Failed to delete lead. Please try again.");
            setDeleteId(null);
        }
    });

    // Helper: Map a row of values to a Lead object based on headers
    const mapValuesToLead = (headers, values) => {
        const entry = {};

        headers.forEach((h, i) => {
            const val = values[i] ? String(values[i]).trim() : '';
            if (h.includes('company') || h.includes('agency')) entry.company_name = val;
            else if (h.includes('contact') || h.includes('person')) entry.contact_name = val;
            else if (h.includes('email')) entry.email = val;
            else if (h.includes('phone')) entry.phone = val;
            else if (h.includes('note') || h.includes('response')) entry.notes = val;
        });

        // Fallback mapping matching user's specific format
        if (!entry.company_name && values[0]) entry.company_name = String(values[0]).trim();
        if (!entry.phone && values[1]) entry.phone = String(values[1]).trim();
        if (!entry.contact_name && values[2]) entry.contact_name = String(values[2]).trim();
        if (!entry.notes && values[3]) entry.notes = String(values[3]).trim();
        if (!entry.email && values[4]) entry.email = String(values[4]).trim();

        return entry;
    };

    const processRawData = (rows) => {
        if (rows.length < 2) return;

        // Clean and normalize headers
        const headers = rows[0].map(h => String(h).toLowerCase().trim());

        const data = rows.slice(1).map(row => {
            // Ensure row has enough cells matching header length (fill with empty)
            const values = Array.isArray(row) ? row : [];
            return mapValuesToLead(headers, values);
        }).filter(item => item && item.company_name);

        setParsedLeads(data);
    };

    const parseCSV = (content) => {
        // Detect delimiter: Check first line for Tab vs Comma
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return;

        const firstLine = lines[0];
        const isTab = firstLine.includes('\t');
        const delimiter = isTab ? '\t' : ',';

        // Convert text to array of arrays for uniform processing
        const rows = lines.map(line => line.split(delimiter).map(v => v.trim()));
        processRawData(rows);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            // Convert sheet to array of arrays (header: 1)
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            processRawData(data);
        };
        reader.readAsBinaryString(file);
    };

    const importMutation = useMutation({
        mutationFn: async (leads) => {
            const res = await api.post('/admin/leads/bulk', { leads });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['adminLeads']);
            setIsImportOpen(false);
            setCsvContent('');
            setParsedLeads([]);
            toast.success(data.message);
        },
        onError: () => toast.error("Failed to import leads")
    });

    const getStatusBadge = (status) => {
        const styles = {
            new: "bg-blue-50 text-blue-700 border-blue-200",
            contacted: "bg-amber-50 text-amber-700 border-amber-200",
            interested: "bg-purple-50 text-purple-700 border-purple-200",
            demo_scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
            closed_won: "bg-emerald-50 text-emerald-700 border-emerald-200",
            closed_lost: "bg-red-50 text-red-700 border-red-200"
        };
        return (
            <Badge variant="outline" className={`capitalize font-medium ${styles[status] || styles.new}`}>
                {status?.replace('_', ' ')}
            </Badge>
        );
    };

    const [promotedCreds, setPromotedCreds] = useState(null);

    const promoteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.post(`/admin/leads/${id}/promote`);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['adminLeads']);
            setPromotedCreds(data); // Show success dialog
            toast.success("Lead promoted to Agency!");
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Failed to promote lead");
        }
    });

    const handleEdit = (lead) => {
        setCurrentLead(lead);
        setFormData({
            company_name: lead.company_name,
            contact_name: lead.contact_name,
            email: lead.email,
            phone: lead.phone,
            status: lead.status,
            notes: lead.notes || ''
        });
        setIsEditOpen(true);
    };

    const handleSave = () => {
        if (!formData.company_name) return toast.error("Company name is required");
        if (currentLead) {
            updateMutation.mutate({ id: currentLead.id, updates: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const leads = data?.leads || [];
    const filteredLeads = leads.filter(l =>
        l.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Outreach CRM</h2>
                    <p className="text-slate-500 mt-1">Manage cold calls, emails, and prospective agencies.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-slate-300">
                                <FileUp className="w-4 h-4 mr-2" />
                                Import CSV
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Import Leads (CSV)</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="upload">Upload Excel/CSV File</Label>
                                    <Input id="upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                                </div>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-slate-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">OR PASTE TEXT</span>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 border border-slate-200">
                                    <p className="font-medium mb-1">Expected Format (Headers Optional):</p>
                                    <code className="bg-white px-2 py-1 rounded border">Company Name, Contact Name, Email, Phone, Notes</code>
                                </div>

                                <Textarea
                                    placeholder="Paste your CSV data here..."
                                    className="h-32 font-mono text-xs"
                                    value={csvContent}
                                    onChange={(e) => {
                                        setCsvContent(e.target.value);
                                        parseCSV(e.target.value);
                                    }}
                                />

                                <div className="flex justify-between items-center text-sm text-slate-500">
                                    <span>Parsed: {parsedLeads.length} valid rows</span>
                                    {parsedLeads.length > 0 && (
                                        <div className="flex gap-2">
                                            <span className="text-emerald-600 font-medium">Ready to Import</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsImportOpen(false)}>Cancel</Button>
                                <Button
                                    disabled={parsedLeads.length === 0 || importMutation.isPending}
                                    onClick={() => importMutation.mutate(parsedLeads)}
                                >
                                    {importMutation.isPending ? 'Importing...' : `Import ${parsedLeads.length} Leads`}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Prospect
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Prospect</DialogTitle>
                            </DialogHeader>
                            <LeadForm formData={formData} setFormData={setFormData} onSubmit={handleSave} loading={createMutation.isPending} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search prospects..."
                        className="pl-10 border-slate-200 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-slate-500 ml-auto">
                    Total Prospects: <span className="font-bold text-slate-900">{filteredLeads.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow>
                            <TableHead className="pl-6 w-[250px]">Company</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Latest Notes</TableHead>
                            <TableHead>Last Contact</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">Loading prospects...</TableCell>
                            </TableRow>
                        ) : filteredLeads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">No prospects found.</TableCell>
                            </TableRow>
                        ) : filteredLeads.map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-slate-50 group">
                                <TableCell className="pl-6 font-medium text-slate-900">
                                    <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-slate-400" />
                                        {lead.company_name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span className="font-medium text-slate-700">{lead.contact_name || 'N/A'}</span>
                                        <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5">
                                            {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>}
                                            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                <TableCell className="max-w-[200px] truncate text-slate-500 text-sm" title={lead.notes}>
                                    {lead.notes || '-'}
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                                    {lead.updated_at ? formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true }) : '-'}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(lead)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>

                                            {lead.status !== 'closed_won' && (
                                                <DropdownMenuItem
                                                    className="text-indigo-600 font-medium"
                                                    onClick={() => {
                                                        if (confirm(`Convert "${lead.company_name}" to a real Agency account? This will create an admin user for them.`)) {
                                                            promoteMutation.mutate(lead.id);
                                                        }
                                                    }}
                                                >
                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Convert to Agency
                                                </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                onClick={() => setDeleteId(lead.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Prospect</DialogTitle>
                    </DialogHeader>
                    {currentLead && (
                        <LeadForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSave}
                            loading={updateMutation.isPending}
                            isEdit
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Success Creds Dialog */}
            <Dialog open={!!promotedCreds} onOpenChange={(open) => !open && setPromotedCreds(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-emerald-600 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Agency Created Successfully!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-slate-600">
                            The agency <strong>{promotedCreds?.agency?.agency_name}</strong> has been created.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                            <p className="text-sm text-slate-500 font-medium uppercase">Admin Credentials</p>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Email:</span>
                                <span className="font-mono text-slate-900 select-all">{promotedCreds?.user?.email}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Temp Password:</span>
                                <span className="font-mono text-indigo-600 font-bold select-all">{promotedCreds?.user?.tempPassword}</span>
                            </div>
                        </div>
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                            Please copy these credentials immediately. The password cannot be viewed again.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setPromotedCreds(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the prospect from your database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteMutation.mutate(deleteId)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

function LeadForm({ formData, setFormData, onSubmit, loading, isEdit }) {
    const [newNote, setNewNote] = useState('');

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const timestamp = format(new Date(), 'MMM d, h:mm a');
        const entry = `[${timestamp}] ${newNote}\n`;
        setFormData({
            ...formData,
            notes: entry + (formData.notes || '')
        });
        setNewNote('');
    };

    return (
        <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                        value={formData.company_name}
                        onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Acme Corp"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                        value={formData.contact_name}
                        onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                        placeholder="John Doe"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 555-0100"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Add Comment / Note</Label>
                <div className="flex gap-2">
                    <Textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="Type a new note here..."
                        className="h-20 flex-1"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-20 w-20 flex flex-col gap-1"
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label>History & Logs</Label>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3 h-32 overflow-y-auto text-sm text-slate-600 whitespace-pre-wrap font-mono">
                    {formData.notes || <span className="text-slate-400 italic">No notes yet...</span>}
                </div>
            </div>

            <DialogFooter className="mt-4">
                <Button onClick={onSubmit} disabled={loading} className="w-full">
                    {loading ? 'Saving...' : (isEdit ? 'Update Prospect' : 'Add Prospect')}
                </Button>
            </DialogFooter>
        </div>
    );
}
