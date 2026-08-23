import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import type { PublisherChannel, RemoteChannel, ShareDuration } from '@/types/models';
import { createChannel, updateChannelExpiry } from './relay';
import { randomKey, randomToken } from '@/utils/crypto';
import { listPublishers, listRemotes, savePublishers, saveRemotes, setSecret } from '@/storage/localStore';

export const FOREVER_TS = 253402300799000; // 9999-12-31T23:59:59Z; revoked manually by the user.

export function expiryFor(duration: ShareDuration) {
  const now = Date.now();
  if (duration === 'forever') return FOREVER_TS;
  const ms = { '1h': 3600000, '8h': 28800000, '1d': 86400000, '7d': 604800000 }[duration];
  return now + ms;
}

export async function createContactShare(label: string, duration: ShareDuration) {
  const channelId = Crypto.randomUUID();
  const [publisherToken, viewerToken, commandToken, key] = await Promise.all([randomToken(), randomToken(), randomToken(), randomKey()]);
  const expiresAt = expiryFor(duration);
  await createChannel({ channelId, publisherToken, viewerToken, commandToken, expiresAt });
  const meta: PublisherChannel = { id: channelId, label, kind: 'contact-share', expiresAt, createdAt: Date.now(), canReceiveRing: false };
  await Promise.all([
    setSecret(channelId, 'publisher', publisherToken), setSecret(channelId, 'viewer', viewerToken), setSecret(channelId, 'command', commandToken), setSecret(channelId, 'key', key)
  ]);
  await savePublishers([...(await listPublishers()), meta]);
  return Linking.createURL('share', { queryParams: { c: channelId, v: viewerToken, k: key, e: String(expiresAt), n: label } });
}

export async function createLocationRequest(label: string) {
  const channelId = Crypto.randomUUID();
  const [publisherToken, viewerToken, commandToken, key] = await Promise.all([randomToken(), randomToken(), randomToken(), randomKey()]);
  // A pending request is only valid for 7 days. If accepted, the recipient
  // explicitly replaces this expiry with the duration they choose.
  const inviteExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  await createChannel({ channelId, publisherToken, viewerToken, commandToken, expiresAt: inviteExpiresAt });
  const remote: RemoteChannel = { id: channelId, label, kind: 'requested-contact', expiresAt: inviteExpiresAt, createdAt: Date.now(), canRing: false };
  await Promise.all([
    setSecret(channelId, 'viewer', viewerToken), setSecret(channelId, 'command', commandToken), setSecret(channelId, 'key', key)
  ]);
  await saveRemotes([...(await listRemotes()), remote]);
  return Linking.createURL('request', { queryParams: { c: channelId, p: publisherToken, k: key, i: String(inviteExpiresAt), n: label } });
}

export async function createDevicePairInvite(label: string) {
  const channelId = Crypto.randomUUID();
  const [publisherToken, viewerToken, commandToken, key] = await Promise.all([randomToken(), randomToken(), randomToken(), randomKey()]);
  const expiresAt = FOREVER_TS;
  await createChannel({ channelId, publisherToken, viewerToken, commandToken, expiresAt });
  const remote: RemoteChannel = { id: channelId, label, kind: 'owned-device', expiresAt, createdAt: Date.now(), canRing: true };
  await Promise.all([
    setSecret(channelId, 'viewer', viewerToken), setSecret(channelId, 'command', commandToken), setSecret(channelId, 'key', key)
  ]);
  await saveRemotes([...(await listRemotes()), remote]);
  return Linking.createURL('pair', { queryParams: { c: channelId, p: publisherToken, k: key, e: String(expiresAt), n: label } });
}

export async function acceptLocationRequest(url: string, duration: ShareDuration) {
  const parsed = Linking.parse(url);
  const q = parsed.queryParams || {};
  const channelId = String(q.c || '');
  const publisherToken = String(q.p || '');
  const key = String(q.k || '');
  const label = String(q.n || 'AsterFind').slice(0, 80);
  const inviteExpiresAt = Number(q.i || 0);
  if (parsed.path !== 'request' || !channelId || !publisherToken || !key || !Number.isFinite(inviteExpiresAt) || inviteExpiresAt <= Date.now()) {
    throw new Error('Solicitação inválida ou expirada.');
  }
  const expiresAt = expiryFor(duration);
  await updateChannelExpiry(channelId, publisherToken, expiresAt);
  const item: PublisherChannel = { id: channelId, label, kind: 'contact-share', expiresAt, createdAt: Date.now(), canReceiveRing: false };
  await setSecret(channelId, 'publisher', publisherToken);
  await setSecret(channelId, 'key', key);
  const current = (await listPublishers()).filter(x => x.id !== channelId);
  await savePublishers([...current, item]);
  return item;
}

export async function acceptInvite(url: string) {
  const parsed = Linking.parse(url);
  const q = parsed.queryParams || {};
  const channelId = String(q.c || '');
  const key = String(q.k || '');
  const label = String(q.n || 'AsterFind').slice(0, 80);
  const expiresAt = Number(q.e || 0);
  if (!channelId || !key || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || (parsed.path !== 'pair' && parsed.path !== 'share')) throw new Error('Convite inválido ou expirado.');

  if (parsed.path === 'pair') {
    const publisherToken = String(q.p || '');
    if (!publisherToken) throw new Error('Convite de pareamento inválido.');
    const item: PublisherChannel = { id: channelId, label, kind: 'paired-device', expiresAt, createdAt: Date.now(), canReceiveRing: true };
    await setSecret(channelId, 'publisher', publisherToken);
    await setSecret(channelId, 'key', key);
    const current = (await listPublishers()).filter(x => x.id !== channelId);
    await savePublishers([...current, item]);
    return { type: 'paired-device' as const, item };
  }

  const viewerToken = String(q.v || '');
  if (!viewerToken) throw new Error('Convite de compartilhamento inválido.');
  const item: RemoteChannel = { id: channelId, label, kind: 'contact', expiresAt, createdAt: Date.now(), canRing: false };
  await setSecret(channelId, 'viewer', viewerToken);
  await setSecret(channelId, 'key', key);
  const current = (await listRemotes()).filter(x => x.id !== channelId);
  await saveRemotes([...current, item]);
  return { type: 'contact' as const, item };
}
