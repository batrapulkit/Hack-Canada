import React, { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import api from '../../api/client';

export default function CopilotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi, I am your Backboard AI Copilot. I remember your client preferences globally. How can I help?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await api.post('/copilot/message', { message: userMessage });
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection to Copilot failed.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden">
                    <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <span className="font-semibold">AI Copilot</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`p-2 rounded-lg max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-900 self-end' : 'bg-white border text-gray-800 self-start'}`}>
                                {msg.content}
                            </div>
                        ))}
                        {loading && <div className="text-gray-400 text-sm self-start">Copilot is thinking...</div>}
                    </div>

                    <form onSubmit={sendMessage} className="p-3 border-t bg-white flex gap-2">
                        <input
                            type="text"
                            className="flex-1 px-3 py-2 border rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            placeholder="Ask about a client..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                        />
                        <button type="submit" className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" disabled={loading}>
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                >
                    <Bot size={24} />
                </button>
            )}
        </div>
    );
}
