import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { joinApiPath, readApiEnvelope } from './pages.service';

export interface SiteSettingItem {
  id: number;
  key: string;
  value: string | null;
  dataType: number;
  group: number;
  label: string | null;
  description: string | null;
  isPublic: boolean;
  isActive: boolean;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function normalizeSettingItem(raw: unknown): SiteSettingItem {
  const r = asRecord(raw);
  return {
    id: Number(r['id'] ?? r['Id'] ?? 0),
    key: String(r['key'] ?? r['Key'] ?? ''),
    value: (r['value'] ?? r['Value'] ?? null) as string | null,
    dataType: Number(r['dataType'] ?? r['DataType'] ?? 0),
    group: Number(r['group'] ?? r['Group'] ?? 0),
    label: (r['label'] ?? r['Label'] ?? null) as string | null,
    description: (r['description'] ?? r['Description'] ?? null) as string | null,
    isPublic: !!(r['isPublic'] ?? r['IsPublic']),
    isActive: !!(r['isActive'] ?? r['IsActive']),
  };
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  constructor(private readonly http: HttpClient) {}

  getSettingsMapByGroup(groupId: number): Observable<Record<string, string>> {
    const url = joinApiPath(
      environment.apiBaseUrl,
      `/settings/admin/by-group/${encodeURIComponent(String(groupId))}`
    );

    return this.http.get<unknown>(url).pipe(
      map((raw) => {
        const envelope = readApiEnvelope<unknown>(raw);
        if (!envelope.success || envelope.data === null || envelope.data === undefined) {
          throw new Error(envelope.message || 'Failed to load settings');
        }

        const listRaw = Array.isArray(envelope.data) ? envelope.data : [];
        const list = listRaw.map((x) => normalizeSettingItem(x));

        return list.reduce<Record<string, string>>((acc, item) => {
          if (item.isActive && item.key && item.value) {
            acc[item.key] = item.value;
          }
          return acc;
        }, {});
      })
    );
  }

  getMergedSettingsMapByGroups(groupIds: number[]): Observable<Record<string, string>> {
    const sources = groupIds.map((id) => this.getSettingsMapByGroup(id));
    return forkJoin(sources).pipe(
      map((maps) => maps.reduce<Record<string, string>>((acc, curr) => ({ ...acc, ...curr }), {}))
    );
  }
}
