import React, { useState } from "react";
import api from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Mail,
  MapPin,
  Star,
  Building2,
  Trash2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateSupplierDialog from "../components/suppliers/CreateSupplierDialog";
import PartnerDirectory from "../components/suppliers/PartnerDirectory";

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: suppliers = [], isLoading, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.Supplier.list('-created_date'),
    initialData: [],
  });

  const handleToggleActive = async (supplier) => {
    try {
      await api.entities.Supplier.update(supplier.id, { is_active: !supplier.is_active });
      toast.success(`${supplier.name} is now ${!supplier.is_active ? 'active' : 'inactive'}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update supplier status");
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Supplier Network
            </h1>
            <p className="text-slate-600">
              Manage relationships with hotels, DMCs, guides, and vendors
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name or region..."
            className="pl-10"
          />
        </div>
      </motion.div>

      <Tabs defaultValue="my-suppliers" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 w-full md:w-auto inline-flex">
          <TabsTrigger
            value="my-suppliers"
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            My Suppliers
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
              {suppliers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="directory"
            className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            Partner Directory
            <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 hover:bg-purple-100">
              New
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-suppliers" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <Card className="border-slate-200/60">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No suppliers yet</h3>
                <p className="text-slate-600">Start building your supplier network or browse our Partner Directory</p>
                <Button
                  variant="link"
                  className="mt-2 text-blue-600"
                  onClick={() => document.querySelector('[value="directory"]').click()}
                >
                  Browse Directory
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier, index) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-slate-200/60 shadow-md hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {supplier.logo_url ? (
                            <img src={supplier.logo_url} alt={supplier.name} className="w-10 h-10 rounded object-contain bg-slate-50 border border-slate-100 p-1" />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-lg">
                              {supplier.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 mb-1">
                              {supplier.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {supplier.type}
                            </Badge>
                          </div>
                        </div>
                        {supplier.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">{supplier.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pl-13">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={supplier.is_active}
                            onCheckedChange={() => handleToggleActive(supplier)}
                          />
                          <span className="text-sm text-slate-600">
                            {supplier.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this supplier?')) {
                              api.entities.Supplier.delete(supplier.id)
                                .then(() => {
                                  toast.success('Supplier deleted');
                                  refetch();
                                })
                                .catch(() => toast.error('Failed to delete supplier'));
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        {supplier.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.region && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{supplier.region}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Bookings</p>
                          <p className="text-lg font-bold">{supplier.total_bookings || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500">Revenue</p>
                          <p className="text-lg font-bold text-green-600">
                            ${(supplier.total_revenue || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="directory">
          <PartnerDirectory existingSuppliers={suppliers} />
        </TabsContent>
      </Tabs>

      {showCreateDialog && (
        <CreateSupplierDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}