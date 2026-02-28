import type { Task, JournalEntry } from '@/types/planner';

const titles = {
  highCompletion: [
    'Clear Skies, Steady Hands',
    'A Week of Warm Soil',
    'Roots Deepening Quietly',
    'The Garden Answers Back',
    'Seeds Finding Light',
    'Full Bloom, No Fanfare',
    'Everything in Season',
    'Harvest Within Reach',
    'A Current of Purpose',
    'The Path Was Always Here',
  ],
  risingMomentum: [
    'The First Green Shoots',
    'Morning Fog, Afternoon Clearing',
    'Something Stirs Beneath',
    'A Turn Toward Warmth',
    'Water Finding Its Way',
    'Slow Thaw, Quiet Growth',
    'Breaking Ground Gently',
    'Light Through Young Leaves',
    'The Creek Begins to Move',
    'Buds Before the Bloom',
  ],
  tapering: [
    'Quiet Growth Beneath the Surface',
    'Shorter Days, Longer Thoughts',
    'Leaves Beginning to Turn',
    'The Orchard Rests',
    'Amber Light on Still Water',
    'A Settling of Dust',
    'Embers Beneath the Ash',
    'The Last Warm Evening',
    'Birds Gathering Southward',
    'Preparing the Quiet Rows',
  ],
  lowActivity: [
    'A Week of Steady Rain',
    'Snow on Bare Branches',
    'The Forest Holds Its Breath',
    'Stillness as a Practice',
    'Waiting for the Thaw',
    'Deep Rest, Deep Roots',
    'The Ground Remembers',
    'Frost on the Window',
    'Silence Between Storms',
    'Nothing Needs to Happen',
  ],
};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function generateWeekTitle(
  tasks: Task[],
  journal: JournalEntry[],
  weekDates: string[]
): string {
  const weekTasks = tasks.filter(t => weekDates.includes(t.date));
  const weekJournal = journal.filter(j => weekDates.includes(j.date));

  const total = weekTasks.length;
  const completed = weekTasks.filter(t => t.completed).length;
  const ratio = total > 0 ? completed / total : 0;
  const highPriorityRatio = total > 0 ? weekTasks.filter(t => t.priority === 'high').length / total : 0;

  // Deterministic seed from week data
  const seed = simpleHash(weekDates.join('') + total + completed + weekJournal.length);

  let pool: string[];
  if (ratio >= 0.65) {
    pool = titles.highCompletion;
  } else if (ratio >= 0.35 && highPriorityRatio > 0.3) {
    pool = titles.risingMomentum;
  } else if (ratio >= 0.2) {
    pool = titles.tapering;
  } else {
    pool = titles.lowActivity;
  }

  return pool[seed % pool.length];
}
