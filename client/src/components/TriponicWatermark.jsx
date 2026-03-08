import React from 'react';

export default function TriponicWatermark() {
    return (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">T</span>
                </div>
                <span className="text-xs font-medium text-slate-600">Powered by Triponic</span>
            </div>
        </div>
    );
}
