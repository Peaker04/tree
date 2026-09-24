import { describe, expect, it } from 'vitest';
import {
  createCalendarCells,
  createDefaultTaskDeadline,
  isTaskDeadlineDateSelectable,
} from '../../apps/mobile/src/domain/taskDeadline';

describe('Create Task deadline interaction', () => {
  it('defaults to tomorrow at 17:00 without allowing today or past dates', () => {
    const now = new Date(2026, 8, 23, 18, 30);
    const deadline = createDefaultTaskDeadline(now);

    expect(deadline).toEqual(new Date(2026, 8, 24, 17, 0));
    expect(isTaskDeadlineDateSelectable(new Date(2026, 8, 22), now)).toBe(false);
    expect(isTaskDeadlineDateSelectable(new Date(2026, 8, 23), now)).toBe(false);
    expect(isTaskDeadlineDateSelectable(new Date(2026, 8, 24), now)).toBe(true);
  });

  it('builds a Monday-first 42-cell calendar without leaking adjacent-month dates', () => {
    const cells = createCalendarCells(new Date(2026, 8, 1));

    expect(cells).toHaveLength(42);
    expect(cells[0]).toBeNull();
    expect(cells[1]).toEqual(new Date(2026, 8, 1));
    expect(cells.filter(Boolean)).toHaveLength(30);
  });
});
