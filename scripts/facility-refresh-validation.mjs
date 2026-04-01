import fs from 'node:fs';

export function loadFacilitiesGeoJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function summarizeFacilityRefreshFeatures(features) {
  const records = (features ?? []).map((feature) => feature?.properties ?? {});
  const totalFeatures = records.length;
  let openCount = 0;
  let closedCount = 0;
  let defaultVisibleCount = 0;
  let hiddenByDefaultCount = 0;
  let parBearingCount = 0;
  let parTotal = 0;

  for (const record of records) {
    const status = normalizeText(record.status)?.toLowerCase() ?? null;
    if (status === 'closed') {
      closedCount += 1;
    } else {
      openCount += 1;
    }

    if (Number(record.default_visible) === 0) {
      hiddenByDefaultCount += 1;
    } else {
      defaultVisibleCount += 1;
    }

    const parValue = parseParValue(record.par);
    if (parValue !== null) {
      parBearingCount += 1;
      parTotal += parValue;
    }
  }

  return {
    totalFeatures,
    openCount,
    closedCount,
    defaultVisibleCount,
    hiddenByDefaultCount,
    parBearingCount,
    parTotal,
    duplicateIdGroups: findDuplicateGroups(records, (record) => normalizeText(record.id)),
    sharedActiveDmicpIdGroups: findDuplicateGroups(records, (record) =>
      normalizeText(record.active_dmicp_id),
    ),
  };
}

export function formatFacilityRefreshSummary(summary, label) {
  const lines = [
    `${label}:`,
    `  total features: ${summary.totalFeatures}`,
    `  open / closed: ${summary.openCount} / ${summary.closedCount}`,
    `  default visible / hidden: ${summary.defaultVisibleCount} / ${summary.hiddenByDefaultCount}`,
    `  PAR-bearing facilities: ${summary.parBearingCount}`,
    `  PAR total: ${summary.parTotal.toLocaleString('en-GB')}`,
    `  duplicate ids: ${summary.duplicateIdGroups.length}`,
    `  shared active_dmicp_id groups: ${summary.sharedActiveDmicpIdGroups.length}`,
  ];

  if (summary.duplicateIdGroups.length > 0) {
    lines.push('  duplicate id details:');
    for (const group of summary.duplicateIdGroups) {
      lines.push(
        `    ${group.key}: ${group.records.map((record) => record.name ?? '(unnamed)').join(' | ')}`,
      );
    }
  }

  if (summary.sharedActiveDmicpIdGroups.length > 0) {
    lines.push('  shared active_dmicp_id details:');
    for (const group of summary.sharedActiveDmicpIdGroups) {
      lines.push(
        `    ${group.key}: ${group.records.map((record) => `${record.id ?? '(no id)'} ${record.name ?? '(unnamed)'}`).join(' | ')}`,
      );
    }
  }

  return lines.join('\n');
}

export function parseParValue(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(/,/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function findDuplicateGroups(records, keySelector) {
  const groups = new Map();

  for (const record of records) {
    const key = keySelector(record);
    if (!key) {
      continue;
    }

    const entries = groups.get(key) ?? [];
    entries.push(record);
    groups.set(key, entries);
  }

  return [...groups.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([key, entries]) => ({
      key,
      records: entries.map((record) => ({
        id: normalizeText(record.id),
        name: normalizeText(record.name),
        region: normalizeText(record.region),
        combined_practice: normalizeText(record.combined_practice),
        status: normalizeText(record.status),
        par: record.par ?? null,
      })),
    }))
    .sort((left, right) => left.key.localeCompare(right.key, undefined, { sensitivity: 'base' }));
}
