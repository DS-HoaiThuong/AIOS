import { MoreHorizontal, Calendar, Tag } from "lucide-react";

export default function TaskItem({ task, onStatusChange }: { task: any, onStatusChange: (id: string, status: string) => void }) {
  
  const priorities: Record<string, string> = {
    high: "bg-red-50 text-red-600 border-red-100",
    medium: "bg-orange-50 text-orange-600 border-orange-100",
    low: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className="group bg-white border border-zinc-200 hover:border-indigo-300 rounded-2xl p-4 transition-all hover:shadow-md cursor-grab active:cursor-grabbing">
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {task.priority && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${priorities[task.priority] || priorities.medium} uppercase tracking-wider`}>
              {task.priority}
            </span>
          )}
          {task.project && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border bg-zinc-100 text-zinc-600 border-zinc-200 uppercase tracking-wider">
              {task.project}
            </span>
          )}
        </div>
        <button className="text-zinc-400 hover:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <h4 className="text-[15px] font-bold text-zinc-900 mb-2 leading-snug">{task.title}</h4>
      
      {task.description && (
        <p className="text-xs font-medium text-zinc-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3 text-zinc-400">
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        {/* Status Actions */}
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== 'todo' && (
            <button 
              onClick={() => onStatusChange(task.id, 'todo')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
            >
              To Do
            </button>
          )}
          {task.status !== 'in-progress' && (
            <button 
              onClick={() => onStatusChange(task.id, 'in-progress')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
            >
              Do
            </button>
          )}
          {task.status !== 'done' && (
            <button 
              onClick={() => onStatusChange(task.id, 'done')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
