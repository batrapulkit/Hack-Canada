// client/src/components/itineraries/AIItineraryBuilder.jsx
import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Sparkles, Loader2, Check, MapPin, Calendar, Users, DollarSign, FileDown, Terminal, Cpu, Zap, Search } from 'lucide-react';
import api from '../../api/client';
import ItineraryDisplay from './ItineraryDisplay';
import { useBranding } from '../../contexts/BrandingContext';
import { downloadItineraryPDF } from '../../utils/pdfGenerator';
import { toast } from 'sonner';

export default function AIItineraryBuilder({ onItineraryCreated, initialData }) {
  const [formData, setFormData] = useState({
    destination: '',
    duration: 7,
    budget: 'moderate',
    travelers: 2,
    interests: [],
    accommodation_type: 'hotels',
    client_id: null
  });

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [swarmLogs, setSwarmLogs] = useState([]);
  const [currentAgent, setCurrentAgent] = useState('system');
  const { company_name, logo_url } = useBranding();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (initialData) {
      let dur = initialData.duration || 7;

      // If we have both dates, calculate the duration INCLUDING both start and end days
      if (initialData.startDate && initialData.endDate) {
        const start = new Date(initialData.startDate);
        const end = new Date(initialData.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Add 1 to include both start and end days (e.g., June 1-2 = 2 days, not 1)
        // But only override if we don't already have a duration value from the AI
        if (!initialData.duration && diffDays > 0) {
          dur = diffDays + 1;
        } else if (initialData.duration) {
          // Trust the AI-extracted duration over date calculation
          dur = initialData.duration;
        } else {
          // Fallback: use calculated days + 1, or 1 if calculation fails
          dur = diffDays > 0 ? diffDays + 1 : 1;
        }
      }

      // Simple heuristic for budget mapping if numeric
      let bud = initialData.budget || 'moderate';
      if (!isNaN(parseFloat(bud))) {
        const val = parseFloat(bud);
        if (val < 3000) bud = 'budget';
        else if (val < 7000) bud = 'moderate';
        else if (val < 15000) bud = 'luxury';
        else bud = 'ultra-luxury';
      }

      setFormData(prev => ({
        ...prev,
        destination: initialData.destination || prev.destination,
        duration: dur,
        budget: bud,
        travelers: parseInt(initialData.travelers) || 2,
        interests: initialData.interests ? initialData.interests.split(', ').filter(Boolean) : [],
        client_id: initialData.client_id || prev.client_id,
        currency: initialData.currency || 'USD',
        notes: initialData.notes || ''
      }));
    }
  }, [initialData]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const interestOptions = [
    'Sightseeing', 'Adventure', 'Culture', 'Food', 'Beach',
    'History', 'Nature', 'Shopping', 'Nightlife', 'Relaxation'
  ];

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleGenerate = async () => {
    if (!formData.destination || !formData.duration) {
      alert('Please fill in destination and duration');
      return;
    }

    setLoading(true);
    setGeneratedItinerary(null);

    try {
      const payload = {
        ...formData,
        include_accommodation: formData.accommodation_type !== 'none',
        currency: formData.currency || 'USD'
      };

      const response = await api.post('/itineraries/generate', payload);
      setGeneratedItinerary(response.data.itinerary);

      if (onItineraryCreated) {
        onItineraryCreated(response.data.itinerary);
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      alert(error.response?.data?.error || 'Failed to generate itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleSwarmDeploy = () => {
    if (!pasteInput.trim()) return;

    setLoading(true);
    setSwarmLogs([]);
    setGeneratedItinerary(null);
    setCurrentAgent('structurer');

    const addLog = (agent, msg, isComplete = false) => {
      setSwarmLogs(prev => [...prev, { id: Date.now() + Math.random(), agent, text: msg, isComplete }]);
    };

    addLog('system', 'Initializing Multi-Agent Deployment Swarm...');

    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/public/agentic-planning?q=${encodeURIComponent(pasteInput)}`);

    eventSource.addEventListener('agent_start', (e) => {
      const data = JSON.parse(e.data);
      setCurrentAgent(data.agent);
      addLog(data.agent, `[SPAWNED] ${data.message}`);
    });

    eventSource.addEventListener('agent_thought', (e) => {
      const data = JSON.parse(e.data);
      setCurrentAgent(data.agent);
      addLog(data.agent, `> ${data.message}`);
    });

    eventSource.addEventListener('agent_complete', (e) => {
      const data = JSON.parse(e.data);
      addLog(data.agent, `[SUCCESS] Task completed. Handing over context to next agent.`, true);
    });

    eventSource.addEventListener('done', (e) => {
      const data = JSON.parse(e.data);
      // Ensure compatibility with both ItineraryDisplay and pdfGenerator
      setGeneratedItinerary({
        ...data.itinerary,
        ai_generated_content: data.itinerary,
        ai_generated_json: data.itinerary
      });
      // Sync formData so the header display is correct
      setFormData(prev => ({
        ...prev,
        destination: data.itinerary.destination || prev.destination,
        duration: data.itinerary.duration || prev.duration
      }));
      setLoading(false);
      setCurrentAgent('system');
      addLog('system', 'Swarm execution finished. Final payload verified.', true);
      eventSource.close();
      toast.success("Itinerary generated by the Swarm!");
    });

    eventSource.addEventListener('error', (e) => {
      const data = JSON.parse(e.data);
      addLog('system', `[FATAL] ${data.message}`);
      setLoading(false);
      eventSource.close();
      toast.error("Swarm failed to generate plan. Please try the structured form.");
    });
  };

  const handleSave = async () => {
    if (!generatedItinerary) return;

    setLoading(true);
    try {
      const payload = {
        destination: formData.destination,
        duration: formData.duration,
        budget: formData.budget,
        currency: formData.currency || 'USD',
        interests: formData.interests,
        travelers: formData.travelers,
        accommodation_type: formData.accommodation_type,
        client_id: formData.client_id,
        ai_generated_content: JSON.stringify(generatedItinerary.ai_generated_content),
        ai_generated_json: generatedItinerary.ai_generated_json,
        status: 'draft'
      };

      const response = await api.post('/itineraries', payload);

      toast.success('Itinerary saved successfully!');

      if (onItineraryCreated) {
        onItineraryCreated(response.data.itinerary);
      }

      // Reset form
      setFormData({
        destination: '',
        duration: 7,
        budget: 'moderate',
        travelers: 2,
        interests: [],
        accommodation_type: 'hotels',
        client_id: null
      });
      setGeneratedItinerary(null);
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error(error.response?.data?.error || 'Failed to save itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedItinerary) return;

    setIsDownloading(true);
    try {
      // Prepare itinerary object with client info if available
      const itineraryToDownload = {
        ...generatedItinerary,
        client: clients.find(c => c.id === formData.client_id) || null
      };

      await downloadItineraryPDF(itineraryToDownload, company_name, logo_url);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF download failed:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!generatedItinerary ? (
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Itinerary Builder</h2>
                <p className="text-sm text-gray-600">Let Tono create a perfect itinerary</p>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPasteMode(false)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${!pasteMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Structured
              </button>
              <button
                onClick={() => setPasteMode(true)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${pasteMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Paste to Plan (Swarm)
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {!pasteMode ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                {/* Destination */}
                <div>
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Destination *
                  </Label>
                  <Input
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., Paris, France"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Duration */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Duration (days) *
                    </Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      min="1"
                      max="30"
                      className="mt-1"
                    />
                  </div>

                  {/* Travelers */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Travelers
                    </Label>
                    <Input
                      type="number"
                      value={formData.travelers}
                      onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value) })}
                      min="1"
                      max="20"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Budget & Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Budget Level
                    </Label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    >
                      <option value="budget">Budget ($)</option>
                      <option value="moderate">Moderate ($$)</option>
                      <option value="luxury">Luxury ($$$)</option>
                      <option value="ultra-luxury">Ultra Luxury ($$$$)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Currency
                    </Label>
                    <select
                      value={formData.currency || 'USD'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border rounded-md"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>
                </div>

                {/* Accommodation Type */}
                <div>
                  <Label>Accommodation Type</Label>
                  <select
                    value={formData.accommodation_type}
                    onChange={(e) => setFormData({ ...formData, accommodation_type: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  >
                    <option value="hotels">Hotels</option>
                    <option value="resorts">Resorts</option>
                    <option value="apartments">Apartments</option>
                    <option value="hostels">Hostels</option>
                    <option value="villas">Villas</option>
                    <option value="mixed">Mixed</option>
                    <option value="none">No Accommodation (Activity Only)</option>
                  </select>
                </div>

                {/* Interests */}
                <div>
                  <Label>Interests & Activities</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${formData.interests.includes(interest)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                          }`}
                      >
                        {formData.interests.includes(interest) && (
                          <Check className="w-3 h-3 inline mr-1" />
                        )}
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Client Selection */}
                <div>
                  <Label>Assign to Client (Optional)</Label>
                  <select
                    value={formData.client_id || ''}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value || null })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">No client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !formData.destination || !formData.duration}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Generate AI Itinerary
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-2">
                    <Cpu className="w-4 h-4" />
                    Autonomous Agent Swarm
                  </div>
                  <p className="text-xs text-indigo-600/80 mb-4 leading-relaxed">
                    Paste your messy client requirements below. Our 3-agent swarm (Structurer, Planner, Verifier) will process them in real-time.
                  </p>
                  <Textarea
                    placeholder="e.g. 'John wants a 5 day luxury trip to Switzerland in June. They love mountains and chocolate, but hate long drives. Budget is $15k.'"
                    className="min-h-[140px] bg-white border-indigo-200 focus:ring-indigo-500/20 text-sm p-4 leading-relaxed"
                    value={pasteInput}
                    onChange={(e) => setPasteInput(e.target.value)}
                    disabled={loading}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={handleSwarmDeploy}
                      disabled={loading || !pasteInput.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Swarm Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Engage Swarm
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {swarmLogs.length > 0 && (
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed border border-slate-800 shadow-inner h-[280px] overflow-y-auto">
                    {swarmLogs.map((log) => (
                      <div key={log.id} className="mb-2 last:mb-0">
                        <span className={`font-bold ${log.agent === 'structurer' ? 'text-blue-400' : log.agent === 'planner' ? 'text-purple-400' : log.agent === 'verifier' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          [{log.agent.toUpperCase()}]
                        </span>
                        <span className="ml-2 text-slate-300">{log.text}</span>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex items-center gap-2 text-slate-500 mt-2 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                        <span>Agent thinking...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Itinerary Generated!</h2>
                <p className="text-sm text-gray-600">
                  {formData.destination} • {formData.duration} days
                </p>
              </div>
            </div>
            <Button onClick={() => setGeneratedItinerary(null)} variant="outline">
              Create Another
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-4 max-h-[600px] overflow-y-auto">
            <ItineraryDisplay data={generatedItinerary.ai_generated_content} />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              Save Itinerary
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}