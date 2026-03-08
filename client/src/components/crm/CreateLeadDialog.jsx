import React, { useState } from 'react';
import api from "@/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CreateLeadDialog({ open, onClose, leadToEdit }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    destination: '',
    budget: '',
    currency: 'USD',
    travelers: 1,
    travel_dates: '',
    trip_type: 'family',
    source: 'website',
    notes: '',
  });

  // Pre-fill data if editing
  React.useEffect(() => {
    if (leadToEdit) {
      setFormData({
        full_name: leadToEdit.full_name || '',
        email: leadToEdit.email || '',
        phone: leadToEdit.phone || '',
        destination: leadToEdit.destination || '',
        budget: leadToEdit.budget ? String(leadToEdit.budget) : '',
        currency: leadToEdit.currency || 'USD',
        travelers: leadToEdit.travelers || 1,
        travel_dates: leadToEdit.travel_dates || '',
        trip_type: leadToEdit.trip_type || 'family',
        source: leadToEdit.source || 'website',
        notes: leadToEdit.notes || '',
      });
    } else {
      // Reset if creating new
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        destination: '',
        budget: '',
        currency: 'USD',
        travelers: 1,
        travel_dates: '',
        trip_type: 'family',
        source: 'website',
        notes: '',
      });
    }
  }, [leadToEdit, open]);

  // Anti-Gravity State
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ... (handlePasteAnalysis remains same)

  const mutation = useMutation({
    mutationFn: (data) => {
      if (leadToEdit) {
        return api.entities.Lead.update(leadToEdit.id, data);
      }
      return api.entities.Lead.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(leadToEdit ? 'Lead updated successfully' : 'Lead created successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Lead save error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to save lead';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const leadData = {
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      travelers: parseInt(formData.travelers) || 1,
      // Only set status to 'new' if creating fresh; otherwise keep existing or let backend handle
      ...(leadToEdit ? {} : { status: 'new' }),
    };
    mutation.mutate(leadData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{leadToEdit ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>
            {leadToEdit ? 'Update lead details' : 'Capture a new travel inquiry and add it to your pipeline'}
          </DialogDescription>
        </DialogHeader>

        {/* Anti-Gravity: Paste to Lead Feature */}
        <div className="mb-4">
          {pasteMode ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Paste to Lead (AI Powered)
                </h3>
                <p className="text-sm text-blue-600 mb-3">
                  Paste any unstructured text (email, WhatsApp, usage notes) below.
                  Our AI will extract the details for you automatically.
                </p>
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="e.g. 'John Smith (john@test.com) wants a trip to Paris for 2 people in May. Budget is $5k.'"
                  className="min-h-[150px] bg-white"
                />
                <div className="flex gap-2 mt-3 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setPasteMode(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    onClick={handlePasteAnalysis}
                    disabled={isAnalyzing || !pasteText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isAnalyzing ? (
                      <>Analyzing...</>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        Extract Details
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or fill manually</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => setPasteMode(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Paste to Lead
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Paris, France"
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget</Label>
              <div className="flex gap-2">
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="5000"
                  className="flex-1"
                />
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="travelers">Number of Travelers</Label>
              <Input
                id="travelers"
                type="number"
                min="1"
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="travel_dates">Travel Dates</Label>
              <Input
                id="travel_dates"
                value={formData.travel_dates}
                onChange={(e) => setFormData({ ...formData, travel_dates: e.target.value })}
                placeholder="June 2024"
              />
            </div>

            <div>
              <Label htmlFor="trip_type">Trip Type</Label>
              <Select
                value={formData.trip_type}
                onValueChange={(value) => setFormData({ ...formData, trip_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="honeymoon">Honeymoon</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source">Lead Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="direct">Direct Contact</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information about this lead..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Saving...' : (leadToEdit ? 'Update Lead' : 'Create Lead')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}