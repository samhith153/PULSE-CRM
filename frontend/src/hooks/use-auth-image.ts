'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL, getToken } from '@/utils/api';

// Uploaded files are no longer served from a public static mount — they are
// only reachable through GET /api/v1/uploads/... with a Bearer token, which
// an <img> tag cannot send. This hook fetches the file with the token and
// exposes it as a (cached) blob URL for rendering.
const blobCache = new Map<string, string>();

export function useAuthImage(src: string | null | undefined): string {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!src) {
      setUrl('');
      return undefined;
    }

    // External pictures (e.g., Google profile photos) are public — no auth needed.
    if (/^https?:\/\//.test(src)) {
      setUrl(src);
      return undefined;
    }

    const apiPath = src.startsWith('/uploads/') ? `/api/v1${src}` : src;
    const endpoint = `${API_BASE_URL}${apiPath}`;

    const cached = blobCache.get(endpoint);
    if (cached) {
      setUrl(cached);
      return undefined;
    }

    let active = true;
    let objectUrl: string | null = null;
    const token = getToken();

    fetch(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        blobCache.set(endpoint, objectUrl);
        if (active) setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl('');
      });

    return () => {
      active = false;
      // Only revoke if this render created the URL and it wasn't cached
      // (cached URLs are shared across components for the session).
      if (objectUrl && blobCache.get(endpoint) !== objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return url;
}
