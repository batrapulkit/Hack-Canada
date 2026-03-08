import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Download, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import CreateInvoiceDialog from "./CreateInvoiceDialog";
import ViewInvoiceDialog from "./ViewInvoiceDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function InvoiceList({ itineraryId }) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: invoices = [], isLoading, refetch } = useQuery({
        queryKey: ['invoices', itineraryId],
        queryFn: () => api.entities.Invoice.list(itineraryId ? { itineraryId } : {}),
        initialData: []
    });

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const handleMarkPaid = async (id) => {
        try {
            await api.entities.Invoice.update(id, { status: 'paid', amount_paid: 999999 }); // Ideally fetch total and set it
            toast.success("Invoice marked as paid");
            refetch();
        } catch (error) {
            toast.error("Failed to update invoice");
        }
    };

    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const handleView = (invoice) => {
        setSelectedInvoice(invoice);
        setShowViewDialog(true);
    };

    const [invoiceToEdit, setInvoiceToEdit] = useState(null);

    const handleEdit = (invoice) => {
        setInvoiceToEdit(invoice);
        setShowCreateDialog(true);
    };

    const handleCreateOpen = () => {
        setInvoiceToEdit(null);
        setShowCreateDialog(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this invoice?")) {
            try {
                await api.entities.Invoice.delete(id);
                toast.success("Invoice deleted");
                refetch();
            } catch (error) {
                toast.error("Failed to delete invoice");
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search invoices..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-10 px-3 py-2 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <Button onClick={handleCreateOpen}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                        No invoices found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <TableRow
                                        key={invoice.id}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => handleView(invoice)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                {invoice.invoice_number}
                                            </div>
                                        </TableCell>
                                        <TableCell>{invoice.client?.full_name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            {invoice.issue_date ? format(new Date(invoice.issue_date + 'T12:00:00'), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {invoice.due_date ? format(new Date(invoice.due_date + 'T12:00:00'), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            ${(invoice.total || 0).toLocaleString()}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-white shadow-xl border border-slate-200 z-50 min-w-[8rem]">
                                                    <DropdownMenuItem onClick={() => handleView(invoice)}>
                                                        View & Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleMarkPaid(invoice.id)}>
                                                        Mark as Paid
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(invoice.id)}>
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CreateInvoiceDialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                invoiceToEdit={invoiceToEdit}
            />

            <ViewInvoiceDialog
                open={showViewDialog}
                onClose={() => setShowViewDialog(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
}
