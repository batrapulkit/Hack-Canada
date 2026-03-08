import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  MessageSquare,
  FileText,
  Edit
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import WorkflowTimeline from "../workflow/WorkflowTimeline.jsx";

export default function LeadDetailsPanel({ lead, onClose, onEdit }) {
  const navigate = useNavigate();

  const handleMessage = () => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
    } else if (lead.phone) {
      // Fallback to WhatsApp/SMS if no email but phone exists
      const cleanPhone = lead.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else {
      toast.error("No email or phone number found for this lead.");
    }
  };

  const handleCreateQuote = () => {
    navigate('/quotes');
    toast.success(`Starting new quote for ${lead.full_name}`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(lead);
    } else {
      toast.info("Edit functionality coming soon!");
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto"
    >
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Lead Details</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {lead.full_name?.charAt(0) || 'L'}
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{lead.full_name}</h3>
            <Badge className="mt-1 bg-white/20 text-white border-white/30">
              {lead.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-4 space-y-3">
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <a href={`mailto:${lead.email}`} className="text-sm text-slate-900 hover:text-purple-600">
                  {lead.email}
                </a>
              </div>
            )}

            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <a href={`tel:${lead.phone}`} className="text-sm text-slate-900 hover:text-purple-600">
                  {lead.phone}
                </a>
              </div>
            )}

            {lead.destination && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-900">{lead.destination}</span>
              </div>
            )}

            {lead.budget && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-900">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: lead.currency || 'USD' }).format(lead.budget)}
                </span>
              </div>
            )}

            {lead.travelers && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-900">{lead.travelers} travelers</span>
              </div>
            )}

            {lead.travel_dates && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-900">{lead.travel_dates}</span>
              </div>
            )}

            {lead.trip_type && (
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-slate-400">✈️</span>
                <span className="text-sm text-slate-900 capitalize">{lead.trip_type} Trip</span>
              </div>
            )}

            {lead.source && (
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-slate-400">🔍</span>
                <span className="text-sm text-slate-900 capitalize">Source: {lead.source}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AUTOMATION TIMELINE */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900">Activity & Workflow</h4>
          <WorkflowTimeline leadId={lead.id} />
        </div>

        {lead.notes && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Notes</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{lead.notes}</p>
            </CardContent>
          </Card>
        )}

        {lead.interests && lead.interests.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {lead.interests.map((interest, i) => (
                  <Badge key={i} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600" onClick={handleMessage}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" onClick={handleCreateQuote}>
            <FileText className="w-4 h-4 mr-2" />
            Create Quote
          </Button>
        </div>

        <Button variant="outline" className="w-full" onClick={handleEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Lead
        </Button>
      </div>
    </motion.div>
  );
}