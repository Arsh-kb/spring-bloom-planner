import { useState } from 'react';
import { usePlanner } from '@/context/PlannerContext';
import type { TaskTemplate } from '@/types/planner';
import { jujharTemplate } from '@/data/jujharTemplate';



const builtInTemplates: TaskTemplate[] = [
  {
    id: 'builtin-productive',
    name: '🌱 Productive Week',
    tasks: [
      { title: 'Weekly planning & goal setting', priority: 'high', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Inbox zero & email triage', priority: 'medium', mood: 'routine', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Top 3 priorities review', priority: 'high', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Deep work block #1', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 1 },
      { title: 'Team standup notes', priority: 'medium', mood: 'routine', timeBlock: 'morning', dayIndex: 1 },
      { title: 'Admin & scheduling', priority: 'low', mood: 'routine', timeBlock: 'afternoon', dayIndex: 1 },
      { title: 'Deep work block #2', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 2 },
      { title: 'Review & emails', priority: 'medium', mood: 'routine', timeBlock: 'afternoon', dayIndex: 2 },
      { title: 'Learning / skill building', priority: 'medium', mood: 'reflective', timeBlock: 'evening', dayIndex: 2 },
      { title: 'Deep work block #3', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 3 },
      { title: 'Collaboration & meetings', priority: 'medium', timeBlock: 'afternoon', dayIndex: 3 },
      { title: 'Creative thinking time', priority: 'medium', mood: 'reflective', timeBlock: 'afternoon', dayIndex: 4 },
      { title: 'Weekly review & retro', priority: 'high', timeBlock: 'afternoon', dayIndex: 4 },
      { title: 'Plan next week outline', priority: 'medium', timeBlock: 'evening', dayIndex: 4 },
      { title: 'Light reading & learning', priority: 'low', mood: 'reflective', dayIndex: 5 },
      { title: 'Rest & recharge', priority: 'low', mood: 'energizing', dayIndex: 6 },
      { title: 'Meal prep & self-care', priority: 'low', mood: 'energizing', dayIndex: 6 },
    ],
  },
  {
    id: 'builtin-recovery',
    name: '🍃 Light Recovery',
    tasks: [
      { title: 'Morning walk (30 min)', priority: 'low', mood: 'energizing', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Gentle stretching', priority: 'low', mood: 'energizing', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Gratitude journaling', priority: 'medium', mood: 'reflective', timeBlock: 'evening', dayIndex: 0 },
      { title: 'Light reading', priority: 'low', mood: 'reflective', timeBlock: 'afternoon', dayIndex: 1 },
      { title: 'Short creative project', priority: 'low', mood: 'energizing', timeBlock: 'afternoon', dayIndex: 1 },
      { title: 'Deep journaling session', priority: 'medium', mood: 'reflective', timeBlock: 'evening', dayIndex: 2 },
      { title: 'Nature walk or hike', priority: 'low', mood: 'energizing', timeBlock: 'morning', dayIndex: 2 },
      { title: 'Gentle cleanup & organize', priority: 'low', mood: 'routine', dayIndex: 3 },
      { title: 'Cook a nourishing meal', priority: 'low', mood: 'energizing', dayIndex: 3 },
      { title: 'Meditation (20 min)', priority: 'medium', mood: 'reflective', timeBlock: 'morning', dayIndex: 4 },
      { title: 'Nature time outdoors', priority: 'low', mood: 'energizing', dayIndex: 5 },
      { title: 'Digital detox afternoon', priority: 'medium', mood: 'reflective', dayIndex: 5 },
      { title: 'Reflection & week ahead', priority: 'medium', mood: 'reflective', timeBlock: 'evening', dayIndex: 6 },
    ],
  },
  {
    id: 'builtin-sprint',
    name: '🚀 Sprint Week',
    tasks: [
      { title: 'Sprint kickoff & backlog grooming', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 0 },
      { title: 'Task breakdown & estimation', priority: 'high', mood: 'high-strain', timeBlock: 'afternoon', dayIndex: 0 },
      { title: 'Setup dev environment', priority: 'medium', mood: 'routine', timeBlock: 'afternoon', dayIndex: 0 },
      { title: 'Feature development - core', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 1 },
      { title: 'Write unit tests', priority: 'medium', mood: 'routine', timeBlock: 'afternoon', dayIndex: 1 },
      { title: 'Daily standup prep', priority: 'low', mood: 'routine', timeBlock: 'morning', dayIndex: 1 },
      { title: 'Feature development - continued', priority: 'high', mood: 'high-strain', timeBlock: 'morning', dayIndex: 2 },
      { title: 'Integration testing', priority: 'medium', mood: 'routine', timeBlock: 'afternoon', dayIndex: 2 },
      { title: 'Documentation updates', priority: 'low', mood: 'routine', timeBlock: 'evening', dayIndex: 2 },
      { title: 'Code review (give & receive)', priority: 'medium', mood: 'reflective', timeBlock: 'morning', dayIndex: 3 },
      { title: 'Bug fixes & polish', priority: 'high', mood: 'high-strain', timeBlock: 'afternoon', dayIndex: 3 },
      { title: 'Pair programming session', priority: 'medium', mood: 'energizing', timeBlock: 'afternoon', dayIndex: 3 },
      { title: 'Final testing & QA', priority: 'high', mood: 'routine', timeBlock: 'morning', dayIndex: 4 },
      { title: 'Sprint demo preparation', priority: 'high', timeBlock: 'morning', dayIndex: 4 },
      { title: 'Sprint demo & showcase', priority: 'high', timeBlock: 'afternoon', dayIndex: 4 },
      { title: 'Retrospective & feedback', priority: 'medium', mood: 'reflective', timeBlock: 'afternoon', dayIndex: 4 },
    ],
  },
  ,jujharTemplate];

export function TaskTemplates() {
  const { tasks, currentWeekDates, addTask, templates, saveTemplate, deleteTemplate } = usePlanner();
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const allTemplates = [...builtInTemplates, ...templates];

  const handleApplyTemplate = (template: TaskTemplate) => {
    for (const t of template.tasks) {
      const dateStr = currentWeekDates[t.dayIndex];
      if (!dateStr) continue;
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

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getTasksByDay = (template: TaskTemplate) => {
    const grouped: Record<number, typeof template.tasks> = {};
    for (const t of template.tasks) {
      if (!grouped[t.dayIndex]) grouped[t.dayIndex] = [];
      grouped[t.dayIndex].push(t);
    }
    return grouped;
  };

  return (
    <section>
      <h3 className="font-body text-xs text-foreground/50 mb-4 uppercase tracking-widest drop-shadow-md">
        Task Templates
      </h3>
      <div className="space-y-3">
        {allTemplates.map(template => {
          const isPreview = previewId === template.id;
          const tasksByDay = isPreview ? getTasksByDay(template) : {};
          const uniqueDays = new Set(template.tasks.map(t => t.dayIndex)).size;

          return (
            <div key={template.id} className="bg-black/20 border border-white/8 rounded-xl overflow-hidden shadow-inner hover:bg-black/30 transition-colors">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-body text-foreground drop-shadow-md">{template.name}</p>
                  <p className="text-[10px] font-body text-foreground/50 mt-0.5">
                    {template.tasks.length} tasks · {uniqueDays} days
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewId(isPreview ? null : template.id)}
                    className="text-[11px] font-body text-foreground/50 hover:text-foreground bg-black/15 px-3 py-1.5 rounded-lg transition-colors hover:bg-black/25"
                  >
                    {isPreview ? 'Hide' : 'Preview'}
                  </button>
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

              {/* Preview panel */}
              {isPreview && (
                <div className="border-t border-foreground/5 px-4 py-3 space-y-2 bg-black/10">
                  {Object.entries(tasksByDay).sort(([a], [b]) => Number(a) - Number(b)).map(([dayIdx, dayTasks]) => (
                    <div key={dayIdx}>
                      <p className="text-[10px] font-display text-foreground/60 mb-1 drop-shadow-sm">
                        {dayNames[Number(dayIdx)] || `Day ${Number(dayIdx) + 1}`}
                      </p>
                      <div className="space-y-0.5 ml-2">
                        {dayTasks.map((t, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] font-body text-foreground/70">
                            <span className="text-[9px]">{t.priority === 'high' ? '🍒' : t.priority === 'medium' ? '🌿' : '🍂'}</span>
                            <span className="drop-shadow-sm">{t.title}</span>
                            {t.timeBlock && <span className="text-[8px] text-foreground/40 ml-auto">{t.timeBlock}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {showSaveInput ? (
          <div className="flex items-center gap-2 bg-black/15 border border-white/8 rounded-xl p-3 shadow-inner">
            <input
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveCurrentWeek()}
              placeholder="Template name..."
              className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-foreground/30 outline-none"
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
            className="w-full text-center text-[11px] font-body text-foreground/40 hover:text-foreground/70 py-3 border border-dashed border-foreground/15 rounded-xl hover:border-foreground/25 transition-colors"
          >
            + Save current week as template
          </button>
        )}
      </div>
    </section>
  );
}
