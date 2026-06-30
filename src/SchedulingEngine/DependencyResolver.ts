// SchedulingEngine/DependencyResolver.ts
//
// Supports task dependencies via Kahn's-algorithm topological sort.
// Dependent tasks are never scheduled out of order. Cycles are detected
// and reported rather than silently ignored.

import { SchedTask } from "./types";

export interface TopoResult {
  /** Tasks ordered so every dependency appears before its dependents. */
  ordered: SchedTask[];
  /** Task IDs involved in a dependency cycle, if any (ordered list excludes them). */
  cycleTaskIds: string[];
}

export function topologicalSort(tasks: SchedTask[]): TopoResult {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  }
  for (const t of tasks) {
    for (const depId of t.dependsOn ?? []) {
      if (!byId.has(depId)) continue; // dependency outside this batch — ignore, not our concern
      adj.get(depId)!.push(t.id);
      inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
    }
  }

  // Deterministic queue: tasks with no remaining dependencies, in stable
  // input order (not insertion-into-Set order) so output is reproducible.
  const queue: string[] = tasks
    .filter((t) => (inDegree.get(t.id) ?? 0) === 0)
    .map((t) => t.id);

  const ordered: SchedTask[] = [];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(byId.get(id)!);
    for (const next of adj.get(id) ?? []) {
      inDegree.set(next, (inDegree.get(next) ?? 0) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  const cycleTaskIds = tasks
    .map((t) => t.id)
    .filter((id) => !seen.has(id));

  return { ordered, cycleTaskIds };
}

/**
 * Given a fully-dated schedule, verifies every task's date is on/after
 * every dependency's date. Returns human-readable violations.
 */
export function validateDependencyOrder(tasks: SchedTask[]): string[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const violations: string[] = [];
  for (const t of tasks) {
    if (!t.date) continue;
    for (const depId of t.dependsOn ?? []) {
      const dep = byId.get(depId);
      if (!dep || !dep.date) continue;
      if (dep.date > t.date) {
        violations.push(
          `"${t.title}" (${t.date}) is scheduled before its dependency "${dep.title}" (${dep.date})`,
        );
      }
    }
  }
  return violations;
}

/** Earliest date a task may be scheduled given its dependencies' assigned dates. */
export function earliestEligibleDate(
  task: SchedTask,
  byId: Map<string, SchedTask>,
  fallback: string,
): string {
  let earliest = fallback;
  for (const depId of task.dependsOn ?? []) {
    const dep = byId.get(depId);
    if (dep?.date && dep.date > earliest) earliest = dep.date;
  }
  return earliest;
}
