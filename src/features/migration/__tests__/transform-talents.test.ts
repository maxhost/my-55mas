import { describe, it, expect } from 'vitest';
import { parseTagList, transformTalents } from '../lib/transformers/transform-talents';
import type { ColumnMapping } from '../types';

describe('parseTagList', () => {
  it('splits by comma', () => {
    expect(parseTagList('alpha, beta, gamma')).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('splits by semicolon', () => {
    expect(parseTagList('alpha;beta;gamma')).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('splits by mixed separators', () => {
    expect(parseTagList('alpha, beta; gamma')).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('trims whitespace', () => {
    expect(parseTagList('  alpha  ,  beta  ')).toEqual(['alpha', 'beta']);
  });

  it('filters empty entries', () => {
    expect(parseTagList('alpha,,beta;')).toEqual(['alpha', 'beta']);
  });

  it('returns empty array for empty string', () => {
    expect(parseTagList('')).toEqual([]);
  });

  it('returns empty array for whitespace only', () => {
    expect(parseTagList('   ')).toEqual([]);
  });
});

describe('transformTalents — tags + internal_notes', () => {
  const baseMappings: ColumnMapping[] = [
    { csvColumn: 'Email', dbColumn: 'email' },
    { csvColumn: 'Name', dbColumn: 'full_name' },
    { csvColumn: '55+ Handler', dbColumn: 'talent_tag_column' },
    { csvColumn: 'Description', dbColumn: 'internal_notes' },
  ];

  it('parses talent_tag_column as multi-value tag names', () => {
    const rows = [
      { Email: 'a@test.com', Name: 'Ana', '55+ Handler': 'VIP, New', Description: 'notes here' },
    ];
    const { data } = transformTalents(rows, baseMappings, 0);
    expect(data).toHaveLength(1);
    expect(data[0].tagNames).toEqual(['VIP', 'New']);
    expect(data[0].internal_notes).toBe('notes here');
  });

  it('handles empty tag column without crashing', () => {
    const rows = [{ Email: 'a@test.com', Name: 'Ana', '55+ Handler': '', Description: '' }];
    const { data } = transformTalents(rows, baseMappings, 0);
    expect(data[0].tagNames).toEqual([]);
    expect(data[0].internal_notes).toBeNull();
  });

  it('handles missing tag column', () => {
    const minimal: ColumnMapping[] = [
      { csvColumn: 'Email', dbColumn: 'email' },
      { csvColumn: 'Name', dbColumn: 'full_name' },
    ];
    const { data } = transformTalents(
      [{ Email: 'a@test.com', Name: 'Ana' }],
      minimal,
      0
    );
    expect(data[0].tagNames).toEqual([]);
    expect(data[0].internal_notes).toBeNull();
  });
});

describe('transformTalents — other_language', () => {
  const mappings: ColumnMapping[] = [
    { csvColumn: 'Email', dbColumn: 'email' },
    { csvColumn: 'Name', dbColumn: 'full_name' },
    { csvColumn: 'Other Language', dbColumn: 'other_language' },
  ];

  it('stores the raw other_language string on the profile for later parsing', () => {
    const rows = [
      { Email: 'a@test.com', Name: 'Ana', 'Other Language': 'Português, Italiano' },
    ];
    const { data } = transformTalents(rows, mappings, 0);
    expect(data[0].profile.other_language_raw).toBe('Português, Italiano');
  });

  it('defaults other_language_raw to null when the column is empty', () => {
    const rows = [{ Email: 'a@test.com', Name: 'Ana', 'Other Language': '' }];
    const { data } = transformTalents(rows, mappings, 0);
    expect(data[0].profile.other_language_raw).toBeNull();
  });

  it('defaults other_language_raw to null when the column is missing', () => {
    const minimal: ColumnMapping[] = [
      { csvColumn: 'Email', dbColumn: 'email' },
      { csvColumn: 'Name', dbColumn: 'full_name' },
    ];
    const { data } = transformTalents(
      [{ Email: 'a@test.com', Name: 'Ana' }],
      minimal,
      0
    );
    expect(data[0].profile.other_language_raw).toBeNull();
  });
});
