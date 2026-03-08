import React, { useState } from 'react';
import api from "@/api/client";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Share2,
  FileText,
  Edit,
  Sparkles,
  Eye,
  Trash2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import ItineraryDetailsDialog from "./ItineraryDetailsDialog";
import CreateItineraryDialog from "./CreateItineraryDialog";

const statusColors = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  booked: 'bg-purple-100 text-purple-700 border-purple-200',
  in_progress: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function ItineraryList({ itineraries, isLoading }) {
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [editingItinerary, setEditingItinerary] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/itineraries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('Itinerary deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete itinerary');
    }
  });

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="border-slate-200/60">
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <Card className="border-slate-200/60">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No itineraries yet</h3>
          <p className="text-slate-600 mb-4">Create your first AI-powered itinerary to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itineraries.map((itinerary, index) => (
          <motion.div
            key={itinerary.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-slate-200/60 shadow-md hover:shadow-xl transition-all group overflow-hidden flex flex-col h-full">
              <div className="h-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"></div>

              <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                      {itinerary.title || `${itinerary.duration}-Day Trip`}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {itinerary.destination}
                    </div>
                  </div>
                  {itinerary.ai_generated_json?.daily?.length > 0 && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shrink-0 ml-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  {itinerary.start_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(itinerary.start_date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                        {itinerary.end_date && ` - ${new Date(itinerary.end_date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}`}
                      </span>
                    </div>
                  )}

                  {itinerary.travelers && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      <span>{itinerary.travelers} traveler{itinerary.travelers !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {itinerary.budget && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="capitalize">{itinerary.budget}</span>
                    </div>
                  )}

                  {itinerary.client && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="font-medium text-purple-600">{itinerary.client.full_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <Badge variant="outline" className={statusColors[itinerary.status] || statusColors.draft}>
                    {itinerary.status || 'draft'}
                  </Badge>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingItinerary(itinerary)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDelete(itinerary.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedItinerary(itinerary)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <ItineraryDetailsDialog
        itinerary={selectedItinerary}
        open={!!selectedItinerary}
        onClose={() => setSelectedItinerary(null)}
        onEdit={() => {
          setEditingItinerary(selectedItinerary);
          setSelectedItinerary(null);
        }}
      />

      {editingItinerary && (
        <CreateItineraryDialog
          open={!!editingItinerary}
          onClose={() => setEditingItinerary(null)}
          itineraryToEdit={editingItinerary}
        />
      )}
    </>
  );
}