export interface ChangelogVersion {
  version: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
  deprecated: string[];
  security: string[];
}

export function parseChangelog(markdown: string): ChangelogVersion[];
