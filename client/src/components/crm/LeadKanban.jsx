import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Calendar, MoreHorizontal, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCorners, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

// --- DRAGGABLE CARD COMPONENT ---
function DraggableLeadCard({ lead, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { leadId: lead.id, currentStatus: lead.status }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick && onClick(lead)}
      className={cn(
        "bg-white p-3 rounded border border-slate-200 shadow-sm transition-all group relative cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md",
        isDragging && "shadow-xl rotate-1 opacity-90 border-blue-500 ring-2 ring-blue-500/20"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-slate-800 truncate pr-2 group-hover:text-blue-600 transition-colors">
          {lead.full_name || 'Unnamed Lead'}
        </h4>
        {lead.ai_score && (
          <div className="flex shrink-0">
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              lead.ai_score >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            )}>
              {lead.ai_score}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        {lead.destination && (
          <div className="flex items-center text-xs text-slate-500">
            <MapPin className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
            <span className="truncate">{lead.destination}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center text-slate-600 font-medium">
            <DollarSign className="w-3 h-3 mr-1 text-slate-400" />
            {lead.budget ? lead.budget.toLocaleString() : '0'}
          </div>
          <div className="flex items-center text-slate-400">
            <Calendar className="w-3 h-3 mr-1" />
            {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }).replace('about ', '') : 'recently'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
        <div className="flex -space-x-1.5 overflow-hidden">
          {/* Simple Avatar Placeholder */}
          <div className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-600">
            {lead.full_name?.charAt(0) || 'U'}
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4 text-slate-400 hover:text-slate-600" />
        </div>
      </div>
    </div >
  );
}

// --- DROPPABLE COLUMN COMPONENT ---
function DroppableStageColumn({ stage, leads, onLeadClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const totalValue = leads.reduce((sum, l) => sum + (Number(l.budget) || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full rounded-lg transition-colors border-2 border-transparent",
        isOver ? 'border-blue-200 bg-blue-50/30' : 'bg-slate-100/50'
      )}
    >
      {/* Column Header */}
      <div className="p-3 pb-2 flex flex-col gap-1 border-b-2 border-transparent hover:border-slate-200 transition-colors bg-slate-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-tight">
            {stage.label}
          </h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded-full">
            {leads.length}
          </span>
        </div>

        {/* Progress Bar & Value */}
        <div className="flex items-center justify-between mt-1">
          <div className={`h-1 w-full rounded-full mr-2 ${stage.barColor || 'bg-slate-300'}`}>
            <div className="h-full bg-current opacity-30 w-full rounded-full"></div>
            {/* Note: Real app would calculate width based on target */}
          </div>
          <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
            ${(totalValue / 1000).toFixed(1)}k
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="p-2 flex-grow overflow-y-auto space-y-2 min-h-[500px]">
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
        ))}

        {leads.length === 0 && (
          <div className="h-24 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
            Empty Stage
          </div>
        )}
      </div>
    </div>
  );
}


const stages = [
  { id: 'new', label: 'New', barColor: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', barColor: 'bg-indigo-500' },
  { id: 'qualified', label: 'Qualified', barColor: 'bg-yellow-500' },
  { id: 'proposal', label: 'Proposal', barColor: 'bg-orange-500' },
  { id: 'won', label: 'Won', barColor: 'bg-emerald-500' },
];

export default function LeadKanban({ leads, onStatusChange, onLeadClick, isLoading }) {
  const [activeId, setActiveId] = React.useState(null);

  // Add sensors with constraints to distinguish click from drag
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Drag only starts after moving 10px
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Delay touch drag to allow scrolling/clicking
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id && over.id) {
      const lead = leads.find(l => l.id === active.id);
      const newStatus = over.id; // The column ID is the status

      if (lead && lead.status !== newStatus) {
        onStatusChange(lead.id, newStatus);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {stages.map((stage) => (
          <Skeleton key={stage.id} className="h-[600px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 h-full items-start">
        {stages.map((stage) => {
          const stageLeads = leads.filter(lead => lead.status === stage.id);
          return (
            <DroppableStageColumn
              key={stage.id}
              stage={stage}
              leads={stageLeads}
              onLeadClick={onLeadClick}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="bg-white p-3 rounded border border-blue-500 shadow-xl w-[260px] rotate-3 opacity-90 cursor-grabbing">
            <h4 className="font-semibold text-sm text-slate-900 mb-2 truncate">{activeLead.full_name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{activeLead.destination}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}