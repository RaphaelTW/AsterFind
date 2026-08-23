import { APP } from '@/config/app';

function ensureRelay() {
  if (!APP.relayUrl) throw new Error('RELAY_NOT_CONFIGURED');
  return APP.relayUrl;
}

async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(`${ensureRelay()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  if (!res.ok) throw new Error(`Relay ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

export async function createChannel(input: {
  channelId: string;
  publisherToken: string;
  viewerToken: string;
  commandToken: string;
  expiresAt: number;
}) {
  return request('/v1/channels', { method: 'POST', body: JSON.stringify(input) });
}


export async function updateChannelExpiry(channelId: string, publisherToken: string, expiresAt: number) {
  return request(`/v1/channels/${channelId}/expiry`, {
    method: 'PUT', headers: { Authorization: `Bearer ${publisherToken}` }, body: JSON.stringify({ expiresAt })
  });
}

export async function putState(channelId: string, publisherToken: string, ciphertext: string) {
  return request(`/v1/channels/${channelId}/state`, {
    method: 'PUT', headers: { Authorization: `Bearer ${publisherToken}` }, body: JSON.stringify({ ciphertext })
  });
}

export async function getState(channelId: string, viewerToken: string) {
  return request(`/v1/channels/${channelId}/state`, { headers: { Authorization: `Bearer ${viewerToken}` } }) as Promise<{ciphertext:string;updatedAt:number}|null>;
}

export async function getChannelMeta(channelId: string, viewerToken: string) {
  return request(`/v1/channels/${channelId}/meta`, { headers: { Authorization: `Bearer ${viewerToken}` } }) as Promise<{expiresAt:number;stateUpdatedAt:number|null}>;
}

export async function postCommand(channelId: string, commandToken: string, ciphertext: string) {
  return request(`/v1/channels/${channelId}/command`, {
    method: 'POST', headers: { Authorization: `Bearer ${commandToken}` }, body: JSON.stringify({ ciphertext })
  });
}

export async function getCommand(channelId: string, publisherToken: string, after = 0) {
  return request(`/v1/channels/${channelId}/command?after=${after}`, { headers: { Authorization: `Bearer ${publisherToken}` } }) as Promise<{ciphertext:string;updatedAt:number}|null>;
}

export async function deleteChannel(channelId: string, authorizationToken: string) {
  return request(`/v1/channels/${channelId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authorizationToken}` } });
}
