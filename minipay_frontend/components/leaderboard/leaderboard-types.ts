export interface BountyRow {
  id: number;
  username: string;
  games_played: number;
  game_won?: number;
  /** False when the player has games but none met LEADERBOARD_MIN_TURNS — listed at the bottom. */
  leaderboard_eligible?: boolean;
}

export type TimeScope = 'all' | 'month' | 'bounty';

export type BountyPeriod = 'month' | 'range';

export type BountyMonthConfig = {
  key: string;
  label: string;
  completed: boolean;
  prizeCount: number;
  period: BountyPeriod;
  month?: string;
  /** UTC inclusive start (period=range). */
  rangeStart?: string;
  /** UTC exclusive end (period=range). June 1–28 → end 2026-06-29T00:00:00.000Z */
  rangeEnd?: string;
  featuredTab?: boolean;
};

export const BOUNTY_MONTHS: Record<string, BountyMonthConfig> = {
  '2026-05': {
    key: '2026-05',
    label: 'May 2026',
    completed: true,
    prizeCount: 40,
    period: 'month',
    month: '2026-05',
  },
  '2026-06': {
    key: '2026-06',
    label: 'June 2026',
    completed: true,
    prizeCount: 40,
    period: 'range',
    rangeStart: '2026-06-01T00:00:00.000Z',
    rangeEnd: '2026-06-29T00:00:00.000Z',
  },
  '2026-07': {
    key: '2026-07',
    label: 'July 2026',
    completed: false,
    prizeCount: 10,
    period: 'month',
    month: '2026-07',
    featuredTab: true,
  },
};

export const FEATURED_BOUNTY_MONTH_KEY =
  Object.values(BOUNTY_MONTHS).find((m) => m.featuredTab)?.key ?? '2026-07';

/** Featured bounty month (default Bounty tab). */
export const BOUNTY_MONTH_KEY = FEATURED_BOUNTY_MONTH_KEY;
export const BOUNTY_MONTH_LABEL = BOUNTY_MONTHS[FEATURED_BOUNTY_MONTH_KEY]?.label ?? 'July 2026';

/** When true, featured bounty tab shows final standings (prizes paid). */
export const BOUNTY_COMPLETED = BOUNTY_MONTHS[FEATURED_BOUNTY_MONTH_KEY]?.completed ?? false;

/** @deprecated Use getActiveBountyConfig().prizeCount */
export const BOUNTY_WINNER_COUNT = BOUNTY_MONTHS[FEATURED_BOUNTY_MONTH_KEY]?.prizeCount ?? 10;

/** 0 = fetch all players with finished games (no display cap). */
export const LEADERBOARD_LIMIT = 0;

export function getBountyMonthConfig(key: string | null | undefined): BountyMonthConfig | null {
  if (!key) return null;
  return BOUNTY_MONTHS[key] ?? null;
}

export function isBountyMonthKey(key: string): boolean {
  return key in BOUNTY_MONTHS;
}

export function bountyMonthToApiParams(config: BountyMonthConfig): {
  period: 'month' | 'range';
  month?: string;
  start?: string;
  end?: string;
} {
  if (config.period === 'range') {
    return {
      period: 'range',
      start: config.rangeStart,
      end: config.rangeEnd,
    };
  }
  return {
    period: 'month',
    month: config.month ?? config.key,
  };
}

export type LeaderboardApiMeta = {
  lastUpdatedAt: string | null;
  snapshotDate: string | null;
  live: boolean;
};

export function formatLeaderboardLastUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

export function parseLeaderboardApiResponse(res: unknown): {
  rows: BountyRow[];
  meta: LeaderboardApiMeta;
} {
  const envelope = (res as { data?: unknown })?.data;
  let payload: unknown = envelope;
  let lastUpdatedAt: string | null = null;
  let snapshotDate: string | null = null;
  let live = false;

  if (envelope && typeof envelope === 'object' && !Array.isArray(envelope)) {
    const obj = envelope as {
      data?: unknown;
      lastUpdatedAt?: string;
      snapshotDate?: string;
      live?: boolean;
    };
    if (Array.isArray(obj.data)) {
      payload = obj.data;
      lastUpdatedAt = obj.lastUpdatedAt ?? null;
      snapshotDate = obj.snapshotDate ?? null;
      live = Boolean(obj.live);
    }
  }

  let list: unknown = payload;
  if (Array.isArray(payload)) {
    list = payload;
  } else if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
    list = (payload as { data: unknown[] }).data;
  } else if (payload && typeof payload === 'object' && Array.isArray((payload as { leaderboard?: unknown[] }).leaderboard)) {
    list = (payload as { leaderboard: unknown[] }).leaderboard;
  }

  if (!Array.isArray(list)) {
    return {
      rows: [],
      meta: { lastUpdatedAt, snapshotDate, live },
    };
  }

  const rows = list.map((row: Record<string, unknown>, index: number) => ({
    id: Number(row.id ?? index),
    username: String(row.username ?? '—'),
    games_played: Number(row.games_played ?? 0),
    game_won: row.game_won != null ? Number(row.game_won) : undefined,
    leaderboard_eligible: row.leaderboard_eligible !== false,
  }));

  return { rows, meta: { lastUpdatedAt, snapshotDate, live } };
}
