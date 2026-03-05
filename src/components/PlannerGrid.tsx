import { useState, useRef, useCallback } from "react";
import { usePlanner } from "@/context/PlannerContext";
import { DayCard } from "./DayCard";
import { MasterTaskList } from "./MasterTaskList";
import { DayDetailView } from "./DayDetailView";
import type { Day } from "@/types/planner";
import {
  DndContext,
  DragEndEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useIsMobile } from "@/hooks/use-mobile";

export function PlannerGrid() {
  const { days, zenMode, moveTask, reorderTasks, tasks, setWeekOffset } = usePlanner();
  const today = new Date().toISOString().split("T")[0];
  const [showMasterList, setShowMasterList] = useState(false);
  const [zoomedDay, setZoomedDay] = useState<Day | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Swipe gesture for week navigation
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant and > 80px
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) setWeekOffset(prev => prev - 1); // swipe right = prev week
      else setWeekOffset(prev => prev + 1); // swipe left = next week
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [setWeekOffset]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    const isOverDay = over.data.current?.type === "Day";
    const isOverTask = over.data.current?.type === "Task";

    const activeTask = tasks.find(t => t.id === taskId);
    if (!activeTask) return;

    if (isOverDay) {
      if (activeTask.date !== overId) moveTask(taskId, overId);
    } else if (isOverTask) {
      const overTask = over.data.current?.task;
      if (!overTask) return;
      if (activeTask.date === overTask.date) {
        const dayTasks = days.find(d => d.id === activeTask.date)?.tasks || [];
        const oldIndex = dayTasks.findIndex(t => t.id === taskId);
        const newIndex = dayTasks.findIndex(t => t.id === overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newOrder = arrayMove(dayTasks, oldIndex, newIndex);
          reorderTasks(activeTask.date, newOrder.map(t => t.id));
        }
      } else {
        moveTask(taskId, overTask.date);
      }
    }
  };

  const handleDragStart = (event: any) => {
    setActiveTaskId(event.active.id as string);
  };

  const activeTaskData = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;

  return (
    <div
      className="flex-1 p-3 sm:p-4 overflow-y-auto relative pb-16 sm:pb-4"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-min transition-all duration-700 ${
          zenMode ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        }`}>
          {days.slice(0, 4).map((day) => (
            <DayCard key={day.id} day={day} isToday={day.date === today} onZoom={setZoomedDay} />
          ))}
          {days.slice(4).map((day) => (
            <DayCard key={day.id} day={day} isToday={day.date === today} onZoom={setZoomedDay} />
          ))}
        </div>

        <DragOverlay>
          {activeTaskData && (
            <div className="glass-panel px-3 py-2 rounded-md shadow-2xl backdrop-blur-xl border border-white/20 text-sm font-body text-foreground/90 max-w-[200px] truncate">
              {activeTaskData.priority === 'high' ? '🍒' : activeTaskData.priority === 'medium' ? '🌿' : '🍂'}{' '}
              {activeTaskData.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {zenMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-10">
          <button
            onClick={() => setShowMasterList(true)}
            className="glass-panel px-8 py-4 rounded-xl font-display text-foreground text-nature text-lg hover:scale-105 transition-transform duration-500"
          >
            Open Task Ledger
          </button>
        </div>
      )}

      {showMasterList && <MasterTaskList onClose={() => setShowMasterList(false)} />}
      {zoomedDay && <DayDetailView day={zoomedDay} onClose={() => setZoomedDay(null)} />}
    </div>
  );
}
