import { useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { TaskTemplate } from '@/types/planner';

const builtInTemplates: TaskTemplate[] = [
  {
    id: 'builtin-productive',
    name: '🌱 Productive Week',
    tasks: [
      { title: 'Weekly planning', priority: 'high', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Deep work block', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 1 },
      { title: 'Deep work block', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 3 },
      { title: 'Review & emails', priority: 'medium', mood: 'routine', timeBlock: 'afternoon', dayIndex: 2 },
      { title: 'Creative thinking', priority: 'medium', mood: 'reflective', timeBlock: 'afternoon', dayIndex: 4 },
      { title: 'Weekly review', priority: 'high', timeBlock: 'afternoon', dayIndex: 4 },
      { title: 'Rest & recharge', priority: 'low', mood: 'energizing', dayIndex: 6 },
    ],
  },
  {
    id: 'builtin-recovery',
    name: '🍃 Light Recovery',
    tasks: [
      { title: 'Morning walk', priority: 'low', mood: 'energizing', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Light reading', priority: 'low', mood: 'reflective', timeBlock: 'afternoon', dayIndex: 1 },
      { title: 'Journaling', priority: 'medium', mood: 'reflective', timeBlock: 'evening', dayIndex: 2 },
      { title: 'Gentle cleanup', priority: 'low', mood: 'routine', dayIndex: 3 },
      { title: 'Nature time', priority: 'low', mood: 'energizing', dayIndex: 5 },
    ],
  },
  {
    id: 'builtin-sprint',
    name: '🚀 Sprint Week',
    tasks: [
      { title: 'Sprint kickoff', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Feature development', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 1 },
      { title: 'Feature development', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 2 },
      { title: 'Code review', priority: 'medium', mood: 'reflective', timeBlock: 'afternoon', dayIndex: 3 },
      { title: 'Testing & QA', priority: 'high', mood: 'routine', timeBlock: 'morning', dayIndex: 4 },
      { title: 'Sprint demo', priority: 'high', timeBlock: 'afternoon', dayIndex: 4 },
      { title: 'Retro & rest', priority: 'medium', mood: 'reflective', timeBlock: 'afternoon', dayIndex: 4 },
    ],
  },
];

export function TaskTemplates() {
  const { tasks, currentWeekDates, addTask, templates, saveTemplate, deleteTemplate } = usePlanner();
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const allTemplates = [...builtInTemplates, ...templates];

  const handleApplyTemplate = (template: TaskTemplate) => {
    for (const t of template.tasks) {
      const dateStr = currentWeekDates[t.dayIndex];
      if (!dateStr) continue;
      // Skip if a task with same title already exists on that day
      const exists = tasks.some(existing => existing.title === t.title && existing.date === dateStr);
      if (exists) continue;
      addTask(dateStr, t.title, t.priority, t.mood, t.timeBlock, t.recurrence || null);
    }
  };

  const handleSaveCurrentWeek = () => {
    if (!newTemplateName.trim()) return;
    const weekTasks = tasks.filter(t => currentWeekDates.includes(t.date));
    const templateTasks = weekTasks.map(t => ({
      title: t.title,
      priority: t.priority,
      mood: t.mood,
      timeBlock: t.timeBlock,
      recurrence: t.recurrence,
      dayIndex: currentWeekDates.indexOf(t.date),
    }));
    saveTemplate({
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      tasks: templateTasks,
    });
    setNewTemplateName('');
    setShowSaveInput(false);
  };

  return (
    <section>
      <h3 className="font-body text-xs text-foreground/50 mb-4 uppercase tracking-widest" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
        Task Templates
      </h3>
      <div className="space-y-3">
        {allTemplates.map(template => (
          <div key={template.id} className="bg-black/15 border border-white/5 rounded-xl p-4 shadow-inner hover:bg-black/25 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-foreground/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                  {template.name}
                </p>
                <p className="text-[10px] font-body text-foreground/40 mt-0.5">
                  {template.tasks.length} tasks · {new Set(template.tasks.map(t => t.dayIndex)).size} days
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApplyTemplate(template)}
                  className="text-[11px] font-body text-primary/80 hover:text-primary bg-primary/10 px-3 py-1.5 rounded-lg transition-colors hover:bg-primary/20"
                >
                  Apply
                </button>
                {template.id.startsWith('custom-') && (
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="text-[11px] font-body text-foreground/40 hover:text-destructive bg-black/10 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Save current week as template */}
        {showSaveInput ? (
          <div className="flex items-center gap-2 bg-black/10 border border-white/5 rounded-xl p-3 shadow-inner">
            <input
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveCurrentWeek()}
              placeholder="Template name..."
              className="flex-1 bg-transparent text-sm font-body text-foreground/90 placeholder:text-foreground/30 outline-none"
              autoFocus
            />
            <button onClick={handleSaveCurrentWeek} className="text-[11px] font-body text-primary/80 hover:text-primary px-2 py-1 rounded transition-colors">
              Save
            </button>
            <button onClick={() => setShowSaveInput(false)} className="text-[11px] font-body text-foreground/40 px-2 py-1 rounded transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            className="w-full text-center text-[11px] font-body text-foreground/40 hover:text-foreground/70 py-3 border border-dashed border-foreground/10 rounded-xl hover:border-foreground/20 transition-colors"
          >
            + Save current week as template
          </button>
        )}
      </div>
    </section>
  );
}
