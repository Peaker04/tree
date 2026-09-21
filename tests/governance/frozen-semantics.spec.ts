import { describe, it, expect } from 'vitest';
import { CANONICAL_TASK_STATUSES, CANONICAL_REVIEW_DECISIONS, CANONICAL_PROOF_PROFILES } from './canonical-fixtures';

describe('Wave 0 Governance: Frozen Canonical Semantics Fixtures', () => {
  describe('Canonical TaskStatus Fixture Integrity', () => {
    it('has exactly 7 canonical states', () => {
      expect(CANONICAL_TASK_STATUSES).toHaveLength(7);
    });

    it('contains no duplicate states', () => {
      const uniqueStates = new Set(CANONICAL_TASK_STATUSES);
      expect(uniqueStates.size).toBe(CANONICAL_TASK_STATUSES.length);
    });

    it('matches the exact canonical 7-state lifecycle', () => {
      expect([...CANONICAL_TASK_STATUSES]).toEqual([
        'PENDING',
        'IN_PROGRESS',
        'BLOCKED',
        'WAITING_REVIEW',
        'REWORK_REQUIRED',
        'COMPLETED',
        'CANCELLED',
      ]);
    });

    it('strictly excludes non-canonical aliases (DRAFT, ASSIGNED, SUBMITTED)', () => {
      const statusSet = new Set<string>(CANONICAL_TASK_STATUSES);
      expect(statusSet.has('DRAFT')).toBe(false);
      expect(statusSet.has('ASSIGNED')).toBe(false);
      expect(statusSet.has('SUBMITTED')).toBe(false);
    });
  });

  describe('Canonical ReviewDecision Fixture Integrity', () => {
    it('has exactly 4 canonical review outcomes', () => {
      expect(CANONICAL_REVIEW_DECISIONS).toHaveLength(4);
    });

    it('contains no duplicate outcomes', () => {
      const uniqueDecisions = new Set(CANONICAL_REVIEW_DECISIONS);
      expect(uniqueDecisions.size).toBe(CANONICAL_REVIEW_DECISIONS.length);
    });

    it('matches the exact canonical 4 review outcomes', () => {
      expect([...CANONICAL_REVIEW_DECISIONS]).toEqual([
        'APPROVE',
        'APPROVE_WITH_EXCEPTION',
        'REQUEST_REWORK',
        'CANCEL',
      ]);
    });
  });

  describe('Canonical ProofProfile Fixture Integrity', () => {
    it('has exactly 3 canonical proof profiles', () => {
      expect(CANONICAL_PROOF_PROFILES).toHaveLength(3);
    });

    it('contains no duplicate profiles', () => {
      const uniqueProfiles = new Set(CANONICAL_PROOF_PROFILES);
      expect(uniqueProfiles.size).toBe(CANONICAL_PROOF_PROFILES.length);
    });

    it('matches the exact canonical 3 proof profiles', () => {
      expect([...CANONICAL_PROOF_PROFILES]).toEqual(['CHANGE_PROOF', 'SERVICE_PROOF', 'INSPECTION_PROOF']);
    });
  });
});
