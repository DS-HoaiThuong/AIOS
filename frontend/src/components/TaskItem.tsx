import { MoreHorizontal, Calendar, Sparkles, Link as LinkIcon } from "lucide-react";

export default function TaskItem({ task, onStatusChange, onEditClick, theme }: { task: any, onStatusChange: (id: string, status: string) => void, onEditClick?: (task: any) => void, theme?: string }) {
  
  const priorities: Record<string, string> = {
    urgent: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-50 text-orange-700 border-orange-100",
    medium: "bg-zinc-100 text-zinc-800 border-zinc-200",
    low: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  const priorityLabels: Record<string, string> = {
    urgent: "Urgent",
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
  };

  const isCompleted = task.status === 'done';

  return (
    <div className={`group bg-white rounded-md border border-zinc-200 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-zinc-50 transition-colors cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-sm font-medium text-zinc-900 leading-snug ${isCompleted ? 'line-through text-zinc-500' : ''}`}>
          {task.title}
        </h3>
        <button 
          onClick={() => onEditClick && onEditClick(task)}
          className="text-zinc-300 hover:text-zinc-700 transition-colors p-1 opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      {task.description && (
        <p className={`text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed`}>
          {task.description}
        </p>
      )}

      {task.link && (
        <a 
          href={task.link} 
          target="_blank" 
          rel="noreferrer" 
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 px-1.5 py-0.5 rounded transition-colors mb-2"
        >
          <LinkIcon className="w-3 h-3" />
          <span className="truncate max-w-[150px] underline decoration-zinc-300 underline-offset-2">
            {task.link.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </span>
        </a>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {task.priority && !isCompleted && (
            <span className={`text-[11px] font-medium ${
              task.priority === 'urgent' ? 'text-red-600' :
              task.priority === 'high' ? 'text-orange-600' :
              task.priority === 'medium' ? 'text-zinc-500' :
              'text-emerald-600'
            }`}>
              {task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟠' : task.priority === 'medium' ? '⚪' : '🟢'} {priorityLabels[task.priority]}
            </span>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
        
        {/* Status Actions (Subtle on hover) */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== 'todo' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'todo'); }}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded hover:bg-zinc-200 text-zinc-500 transition-colors"
            >
              Plan
            </button>
          )}
          {task.status !== 'in-progress' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'in-progress'); }}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded hover:bg-zinc-200 text-zinc-500 transition-colors"
            >
              Do
            </button>
          )}
          {task.status !== 'done' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'done'); }}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded hover:bg-zinc-200 text-zinc-500 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
