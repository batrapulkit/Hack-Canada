import React, { useState, useEffect } from 'react';
import { CountrySelect } from "@/components/common/CountrySelect";
import { ImageUpload } from "@/components/common/ImageUpload";
import api from "@/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Briefcase,
  Heart,
  Palmtree,
  Mountain,
  Gem,
  Users2,
  Wallet,
  Plane,
  X,
  Plus,
  Trash2,
  GripVertical
} from "lucide-react";
import { motion, Reorder } from "framer-motion";

const tripTypes = [
  { id: 'honeymoon', label: 'Honeymoon', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'family', label: 'Family', icon: Users2, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'adventure', label: 'Adventure', icon: Mountain, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'luxury', label: 'Luxury', icon: Gem, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'business', label: 'Business', icon: Briefcase, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'relax', label: 'Relaxation', icon: Palmtree, color: 'text-orange-500', bg: 'bg-orange-50' },
];

export default function CreateItineraryDialog({ open, onClose, itineraryToEdit = null }) {
  const queryClient = useQueryClient();
  const { branding } = useBranding();
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    country: '', // New state
    city: '',    // New state
    start_date: '',
    end_date: '',
    travelers: 2,
    trip_type: 'family',
    budget: '',
    currency: branding?.country === "Canada" ? "CAD" : "USD", // Smart Default
    client_id: '',
    include_accommodation: true,
  });

  const [dailyPlans, setDailyPlans] = useState([]);
  const [parsing, setParsing] = useState(false);

  // Update existing load logic inside useEffect
  useEffect(() => {
    if (itineraryToEdit) {
      const existingJson = itineraryToEdit.ai_generated_json || {};

      setFormData({
        title: itineraryToEdit.title || '',
        destination: itineraryToEdit.destination || '',
        country: itineraryToEdit.destination ? itineraryToEdit.destination.split(',').pop().trim() : '', // Naive parse
        city: itineraryToEdit.destination ? itineraryToEdit.destination.split(',')[0].trim() : '',
        start_date: itineraryToEdit.start_date ? new Date(itineraryToEdit.start_date).toISOString().split('T')[0] : '',
        end_date: itineraryToEdit.end_date ? new Date(itineraryToEdit.end_date).toISOString().split('T')[0] : '',
        travelers: itineraryToEdit.travelers || 2,
        trip_type: itineraryToEdit.trip_type || 'family',
        budget: itineraryToEdit.budget ? (itineraryToEdit.budget.toString().split(' ')[0]) : '',
        currency: (itineraryToEdit.budget && itineraryToEdit.budget.toString().split(' ')[1]) || itineraryToEdit.currency || 'USD',
        client_id: itineraryToEdit.client_id || itineraryToEdit.client?.id || '',
        include_accommodation: existingJson.include_accommodation !== false // Default true if undefined
      });

      if (existingJson.daily && Array.isArray(existingJson.daily)) {
        setDailyPlans(existingJson.daily);
      } else {
        setDailyPlans([]);
      }
    } else {
      // Reset Logic
      setFormData({
        title: '',
        destination: '',
        country: '',
        city: '',
        start_date: '',
        end_date: '',
        travelers: 2,
        trip_type: 'family',
        budget: '',
        currency: 'USD',
        client_id: '',
        include_accommodation: true
      });
      setDailyPlans([]);
    }
  }, [itineraryToEdit, open]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.entities.Client.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Itinerary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('Itinerary created successfully');
      onClose();
    },
    onError: (err) => {
      toast.error('Failed to create itinerary');
      console.error(err);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.entities.Itinerary.update(itineraryToEdit?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('Itinerary updated successfully');
      onClose();
    },
    onError: (err) => {
      toast.error('Failed to update itinerary');
      console.error(err);
    }
  });

  const handleAddDay = () => {
    const newDayNumber = dailyPlans.length + 1;
    setDailyPlans([
      ...dailyPlans,
      {
        day: newDayNumber,
        title: `Day ${newDayNumber}`,
        activities: [],
        morning: '',
        afternoon: '',
        evening: '',
        meals: { breakfast: '', lunch: '', dinner: '' }
      }
    ]);
  };

  const handleRemoveDay = (index) => {
    const newPlans = dailyPlans.filter((_, i) => i !== index);
    // Re-index days
    const reIndexedPlans = newPlans.map((day, i) => ({ ...day, day: i + 1 }));
    setDailyPlans(reIndexedPlans);
  };

  const handleDayChange = (index, field, value) => {
    const newPlans = [...dailyPlans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setDailyPlans(newPlans);
  };

  const handleActivityChange = (index, value) => {
    // Split by comma and trim
    const activities = value.split(',').map(a => a.trim()).filter(a => a);
    const newPlans = [...dailyPlans];
    newPlans[index] = { ...newPlans[index], activities };
    setDailyPlans(newPlans);
  };


  const handleScreenshotUpload = async (base64Image) => {
    if (!base64Image) return;

    setParsing(true);
    try {
      // Send to Backend AI endpoint
      const res = await api.post('/ai/parse-screenshot', {
        image: base64Image,
        generateItinerary: true // Request full itinerary generation
      });

      if (res.data.success && res.data.valid) {
        const extracted = res.data.data;
        const duration = res.data.duration || 1;

        // Parse destination into city and country if possible
        let city = '';
        let country = '';
        if (extracted.destination) {
          const parts = extracted.destination.split(',').map(s => s.trim());
          if (parts.length >= 2) {
            city = parts[0];
            country = parts[parts.length - 1];
          } else {
            city = extracted.destination;
          }
        }

        // Update form data with extracted information
        setFormData(prev => ({
          ...prev,
          destination: extracted.destination || prev.destination,
          city: city || prev.city,
          country: country || prev.country,
          start_date: extracted.start_date || prev.start_date,
          end_date: extracted.end_date || prev.end_date,
          budget: extracted.budget ? extracted.budget.toString() : prev.budget,
          currency: extracted.currency || prev.currency,
          // Don't override title if user already typed one
          title: prev.title || (extracted.destination ? `Trip to ${extracted.destination}` : prev.title),
        }));


        // **NEW: Use the AI-generated itinerary if available**
        if (res.data.itinerary && res.data.itinerary.detailedPlan?.dailyPlan) {
          const aiDailyPlan = res.data.itinerary.detailedPlan.dailyPlan;

          // Convert AI format to our form format
          const formattedDays = aiDailyPlan.map((day, index) => ({
            day: index + 1,
            title: day.title || `Day ${index + 1}`,
            activities: day.activities || [],
            morning: day.morning || (day.activitiesDescription?.[0] || ''),
            afternoon: day.afternoon || (day.activitiesDescription?.[1] || ''),
            evening: day.evening || (day.activitiesDescription?.[2] || ''),
            meals: day.meals || { breakfast: '', lunch: '', dinner: '' }
          }));

          setDailyPlans(formattedDays);

          toast.success(`Complete ${duration}-day itinerary generated from booking screenshot!`);
        } else if (extracted.flights && extracted.flights.length > 0 && dailyPlans.length === 0) {
          // Fallback: Create just Day 1 if itinerary generation failed
          const flight = extracted.flights[0];
          const flightText = `Flight: ${flight.airline || 'Airline'} ${flight.flight_number || ''} - Arrival in ${extracted.destination || 'destination'}`;

          setDailyPlans([{
            day: 1,
            title: `Arrival in ${extracted.destination || 'Destination'}`,
            activities: [],
            morning: flightText,
            afternoon: 'Check-in to hotel',
            evening: 'Settle in and explore nearby area',
            meals: { breakfast: '', lunch: '', dinner: '' }
          }]);

          toast.success('Booking details imported! Please add remaining days manually.');
        } else {
          toast.success('Booking details imported successfully!');
        }
      } else {
        console.warn('Extraction failed or invalid', res.data);
        toast.error('Could not read booking details. Please enter manually.');
      }
    } catch (err) {
      console.error('Screenshot upload failed', err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Construct the JSON structure compatible with ItineraryDisplay
    // Calculate duration from dates if available
    let calculatedDuration = dailyPlans.length;
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) calculatedDuration = diffDays;
    }

    const aiGeneratedJson = {
      title: formData.title,
      destination: formData.destination,
      duration: calculatedDuration,
      estimated_total_cost: formData.budget ? `${formData.budget} ${formData.currency}` : 'TBD',
      daily: dailyPlans,
      summary: `A ${calculatedDuration}-day trip to ${formData.destination}.`,
      travel_tips: [],
      local_cuisine: [],
      include_accommodation: formData.include_accommodation
    };

    const itineraryData = {
      ...formData,
      destination: ((formData.city || '') + (formData.city && formData.country ? ', ' : '') + (formData.country || '')).trim() || formData.destination, // Combine for backend if not already set
      travelers: parseInt(formData.travelers),
      budget: formData.budget ? parseFloat(formData.budget) : null,
      duration: calculatedDuration, // Update the DB column!
      ai_generated_json: aiGeneratedJson,
      ai_generated_content: JSON.stringify(aiGeneratedJson), // Keep content in sync
      ...(itineraryToEdit ? {} : { status: 'draft', ai_generated: false }),
    };

    if (itineraryToEdit) {
      updateMutation.mutate(itineraryData);
    } else {
      createMutation.mutate(itineraryData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl p-0 overflow-hidden bg-slate-50/50 gap-0 h-[90vh] flex flex-col md:flex-row">

        {/* Left Side - Visual & Info */}
        <div className="hidden md:flex w-1/4 bg-slate-900 relative flex-col justify-between p-8 text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')] opacity-20 bg-cover bg-center" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">
              {itineraryToEdit ? 'Edit Journey' : 'New Journey'}
            </h2>
            <p className="text-slate-300">
              Craft a memorable experience for your clients.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Destination</div>
              <div className="text-xl font-medium flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-400" />
                {formData.city || formData.country ? `${formData.city}${formData.city && formData.country ? ', ' : ''}${formData.country}` : "Not set"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Dates</div>
              <div className="text-xl font-medium flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                {formData.start_date ? (() => {
                  const parts = formData.start_date.split('-');
                  // Create date using UTC components to ensuring stability or just format string manually
                  // Manual format: MMM DD, YYYY
                  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
                  return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
                })() : "TBD"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Travelers</div>
              <div className="text-xl font-medium flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                {formData.travelers} People
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col h-full bg-white">
          <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Itinerary Details</DialogTitle>
              <DialogDescription>Fill in the essential trip information and daily plans</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-500" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <form id="itinerary-form" onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">

              {/* Import Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Gem className="w-4 h-4" /> Smart Import
                </h3>
                <ImageUpload
                  onImageSelected={handleScreenshotUpload}
                  isLoading={parsing}
                  label="Import Booking Screenshot (Beta)"
                />
              </div>

              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Plane className="w-4 h-4" /> Trip Basics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <Label htmlFor="title">Trip Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Summer in Tuscany"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="client">Client</Label>
                    <Select
                      value={formData.client_id}
                      onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      required
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.full_name || client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1">
                    <Label htmlFor="country">Country</Label>
                    <div className="mt-1.5">
                      <CountrySelect
                        value={formData.country}
                        onChange={(val) => setFormData({ ...formData, country: val })}
                      />
                    </div>
                  </div>

                  <div className="col-span-1">
                    <Label htmlFor="city">City / Region</Label>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Paris"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Type Selection */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Trip Style
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tripTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.trip_type === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setFormData({ ...formData, trip_type: type.id })}
                        className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition-all duration-200 ${isSelected
                          ? `border-${type.color.split('-')[1]}-500 bg-${type.color.split('-')[1]}-50 ring-1 ring-${type.color.split('-')[1]}-500`
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? type.color : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          {type.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logistics Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Logistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="travelers">Travelers</Label>
                    <div className="relative mt-1.5">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="travelers"
                        type="number"
                        min="1"
                        value={formData.travelers}
                        onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Smart Defaulting based on branding */}
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="budget">Budget</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        placeholder="Optional"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="include_accommodation"
                  checked={formData.include_accommodation}
                  onCheckedChange={(checked) => setFormData({ ...formData, include_accommodation: checked })}
                />
                <Label htmlFor="include_accommodation">Include Accommodation in Proposal</Label>
              </div>

              {/* Daily Itinerary Section */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Daily Plan
                  </h3>
                  <Button type="button" onClick={handleAddDay} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Day
                  </Button>
                </div>

                <div className="space-y-6">
                  {dailyPlans.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50 text-slate-500">
                      <p>No days added yet. Click "Add Day" to start building the itinerary.</p>
                    </div>
                  )}

                  {dailyPlans.map((day, index) => (
                    <Card key={index} className="p-6 relative group border-slate-200 hover:border-purple-200 transition-colors">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDay(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xl shrink-0">
                            {day.day}
                          </div>
                          <div className="flex-1">
                            <Label>Day Title</Label>
                            <Input
                              value={day.title}
                              onChange={(e) => handleDayChange(index, 'title', e.target.value)}
                              placeholder="e.g. Arrival in Paris"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Morning Activities</Label>
                            <Textarea
                              value={day.morning}
                              onChange={(e) => handleDayChange(index, 'morning', e.target.value)}
                              placeholder="Describe morning plans..."
                              className="mt-1 h-24 resize-none"
                            />
                          </div>
                          <div>
                            <Label>Afternoon Activities</Label>
                            <Textarea
                              value={day.afternoon}
                              onChange={(e) => handleDayChange(index, 'afternoon', e.target.value)}
                              placeholder="Describe afternoon plans..."
                              className="mt-1 h-24 resize-none"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Evening Activities</Label>
                          <Textarea
                            value={day.evening}
                            onChange={(e) => handleDayChange(index, 'evening', e.target.value)}
                            placeholder="Describe evening plans..."
                            className="mt-1 h-20 resize-none"
                          />
                        </div>

                        <div>
                          <Label>Highlights (comma separated)</Label>
                          <Input
                            value={Array.isArray(day.activities) ? day.activities.join(', ') : day.activities}
                            onChange={(e) => handleActivityChange(index, e.target.value)}
                            placeholder="e.g. Eiffel Tower, Louvre Museum, Seine Cruise"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

            </form>
          </div>

          <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="px-6">
              Cancel
            </Button>
            <Button
              type="submit"
              form="itinerary-form"
              className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (itineraryToEdit ? 'Update Journey' : 'Create Journey')}
            </Button>
          </div>
        </div>
      </DialogContent >
    </Dialog >
  );
}