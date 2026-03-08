import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ShieldCheck, Cpu, Play, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const AGENT_COLORS = {
    structurer: 'text-blue-400',
    planner: 'text-purple-400',
    verifier: 'text-emerald-400',
    system: 'text-slate-400',
};

const AGENT_NAMES = {
    structurer: 'Data Extraction Agent',
    planner: 'Geo-Routing Agent',
    verifier: 'Constraint Verifier Agent',
    system: 'System',
};

export default function AgenticPlanner() {
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [logs, setLogs] = useState([]);
    const [finalResult, setFinalResult] = useState(null);
    const [currentAgent, setCurrentAgent] = useState('system');

    const terminalRef = useRef(null);
    const navigate = useNavigate();

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const handleDeploy = () => {
        if (!input.trim()) return;

        setIsThinking(true);
        setLogs([]);
        setFinalResult(null);
        setCurrentAgent('structurer');

        const addLog = (agent, msg, isComplete = false) => {
            setLogs(prev => [...prev, { id: Date.now() + Math.random(), agent, text: msg, isComplete }]);
        };

        addLog('system', 'Initializing Multi-Agent Deployment Swarm...');

        const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/public/agentic-planning?q=${encodeURIComponent(input)}`);

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
            setFinalResult(data);
            setIsThinking(false);
            setCurrentAgent('system');
            addLog('system', 'Swarm execution finished. Final payload verified.', true);
            eventSource.close();
        });

        eventSource.addEventListener('error', (e) => {
            const data = JSON.parse(e.data);
            addLog('system', `[FATAL] ${data.message}`);
            setIsThinking(false);
            eventSource.close();
        });
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">

            {/* Input Section */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div className="mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <Cpu className="w-6 h-6 text-indigo-600" />
                        Autonomous Multi-Agent Planner
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Describe your client's perfect trip in messy, unstructured text. Watch our 3-Agent Swarm extract, route, and verify it in real-time.
                    </p>
                </div>

                <div className="space-y-4">
                    <Textarea
                        placeholder="e.g., 'Draft a 5 day trip to Japan for me and my wife. We love street food and temples, but absolutely hate museums and waking up early. Budget is around 3k.'"
                        className="h-32 resize-none text-base p-4"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isThinking}
                    />
                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all font-medium"
                            onClick={handleDeploy}
                            disabled={isThinking || !input.trim()}
                        >
                            {isThinking ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Swarm Active...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2 fill-current" />
                                    Engage Agent Swarm
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Terminal Output */}
            {(logs.length > 0 || isThinking) && (
                <div className="bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden font-mono text-sm leading-relaxed tracking-wide flex flex-col h-[400px]">
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-widest">
                            <Terminal className="w-4 h-4" />
                            Swarm Orchestrator terminal
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                {isThinking && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isThinking ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                            </span>
                            <span className="text-xs text-slate-500">
                                {isThinking ? `Active: ${AGENT_NAMES[currentAgent]}` : 'Idle'}
                            </span>
                        </div>
                    </div>

                    <div
                        ref={terminalRef}
                        className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar"
                    >
                        {logs.map((log) => (
                            <div key={log.id} className="animate-fade-in-up">
                                <span className={`${AGENT_COLORS[log.agent]} font-semibold`}>
                                    [{AGENT_NAMES[log.agent]}]
                                </span>
                                <span className={`ml-3 ${log.isComplete ? 'text-emerald-300 font-medium' : 'text-slate-300'}`}>
                                    {log.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Final Results Display */}
            {finalResult && !isThinking && (
                <div className="bg-white border border-emerald-200 rounded-2xl shadow-lg overflow-hidden animate-fade-in-up">
                    <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500 p-1.5 rounded-full text-white">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-900">Itinerary Swarm Completed</h3>
                                <p className="text-emerald-700 text-sm">Verified Score: {finalResult.verification?.score}/100</p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-200">
                            Ready for Client
                        </Badge>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="text-blue-500">01</span> Structured Extraction
                            </h4>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="space-y-2 text-sm text-slate-600">
                                    <p><strong className="text-slate-900">Destination:</strong> {finalResult.structuredData?.destination}</p>
                                    <p><strong className="text-slate-900">Duration:</strong> {finalResult.structuredData?.duration} Days</p>
                                    <p><strong className="text-slate-900">Travelers:</strong> {finalResult.structuredData?.travelers}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {finalResult.structuredData?.tags?.map(t => (
                                            <Badge variant="outline" key={t} className="bg-white">{t}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="text-emerald-500">02</span> Constraint Verification
                            </h4>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-sm font-medium text-slate-900 mb-2">
                                    {finalResult.verification?.finalApproval}
                                </p>
                                {finalResult.verification?.flags?.length > 0 ? (
                                    <ul className="space-y-1 mt-3">
                                        {finalResult.verification.flags.map((f, i) => (
                                            <li key={i} className="text-xs text-amber-600 flex items-start gap-1">
                                                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> No strict constraints violated.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100">
                        {/* Note: Normally this would save to the DB, but for the demo we'll just show the success */}
                        <Button className="bg-slate-900 text-white hover:bg-slate-800">
                            Save to Database <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #334155;
                    border-radius: 20px;
                }
            `}} />
        </div>
    );
}
