import { useState } from "react";
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
} from "@dnd-kit/core";

export function PlannerGrid() {
  const { days, zenMode, moveTask } = usePlanner();
  const today = new Date().toISOString().split("T")[0];
  const [showMasterList, setShowMasterList] = useState(false);
  const [zoomedDay, setZoomedDay] = useState<Day | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const overId = over.id as string;
    const isOverDay = over.data.current?.type === "Day";
    const isOverTask = over.data.current?.type === "Task";
    if (isOverDay) moveTask(taskId, overId);
    else if (isOverTask) {
      const targetDayId = over.data.current?.task.day;
      if (targetDayId) moveTask(taskId, targetDayId);
    }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto relative">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-min transition-all duration-700 ${
          zenMode ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        }`}>
          {days.slice(0, 4).map((day) => (
            <DayCard key={day.id} day={day} isToday={day.date === today} onZoom={setZoomedDay} />
          ))}
          {days.slice(4).map((day) => (
            <DayCard key={day.id} day={day} isToday={day.date === today} onZoom={setZoomedDay} />
          ))}
        </div>
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
