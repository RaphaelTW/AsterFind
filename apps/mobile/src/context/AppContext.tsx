import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Linking as RNLinking, Share, useColorScheme } from 'react-native';
import type { AppSettings, DeviceSnapshot, PublisherChannel, RemoteChannel, ShareDuration } from '@/types/models';
import { APP } from '@/config/app';
import { getSettings, listPublishers, listRemotes, saveSettings, getSecret, savePublishers, saveRemotes, deleteChannelSecrets } from '@/storage/localStore';
import { getCurrentSnapshot, requestLocationPermissions, reverseGeocodeCached } from '@/services/location';
import { acceptLocationRequest, createContactShare, createDevicePairInvite, createLocationRequest } from '@/services/sharing';
import { getState, getChannelMeta, postCommand, deleteChannel } from '@/services/relay';
import { decryptJson, encryptJson } from '@/utils/crypto';
import { ensureBackgroundTracking } from '@/services/background';
import { checkGitHubRelease } from '@/services/update';
import { t } from '@/i18n/translations';

export type ThemeColors = {
  background: string; surface: string; surface2: string; text: string; muted: string; line: string; accent: string; success: string; danger: string; mapSheet: string;
};

const light: ThemeColors = { background:'#F5F5F7', surface:'#FFFFFF', surface2:'#F0F0F3', text:'#171719', muted:'#707078', line:'#E0E0E5', accent:'#176B51', success:'#0A8F55', danger:'#D33B3B', mapSheet:'rgba(255,255,255,0.96)' };
const dark: ThemeColors = { background:'#09090A', surface:'#151517', surface2:'#202023', text:'#F7F7F8', muted:'#A8A8B0', line:'#2D2D31', accent:'#1C7A5B', success:'#43C57A', danger:'#FF6565', mapSheet:'rgba(20,20,22,0.96)' };

type RemoteState = Record<string, DeviceSnapshot>;

type AppCtx = {
  colors: ThemeColors;
  settings: AppSettings;
  setLanguage: (v: AppSettings['language']) => Promise<void>;
  toggleSystemTheme: () => Promise<void>;
  toggleAutoUpdates: () => Promise<void>;
  ownSnapshot?: DeviceSnapshot;
  publishers: PublisherChannel[];
  remotes: RemoteChannel[];
  remoteStates: RemoteState;
  selectedRemoteId?: string;
  setSelectedRemoteId: (id?: string) => void;
  reloadLists: () => Promise<void>;
  refreshOwn: () => Promise<void>;
  refreshRemote: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  createShare: (label: string, duration: ShareDuration) => Promise<void>;
  createRequest: (label: string) => Promise<void>;
  acceptRequest: (url: string, duration: ShareDuration) => Promise<void>;
  createPair: (label: string) => Promise<void>;
  ringRemote: (id: string) => Promise<void>;
  revokePublisher: (id: string) => Promise<void>;
  removeRemote: (id: string) => Promise<void>;
  checkUpdates: (force?: boolean) => Promise<void>;
};

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettingsState] = useState<AppSettings>({ language:'pt-BR', autoCheckUpdates:true, useSystemTheme:true });
  const [publishers, setPublishers] = useState<PublisherChannel[]>([]);
  const [remotes, setRemotes] = useState<RemoteChannel[]>([]);
  const [remoteStates, setRemoteStates] = useState<RemoteState>({});
  const [ownSnapshot, setOwnSnapshot] = useState<DeviceSnapshot>();
  const [selectedRemoteId, setSelectedRemoteId] = useState<string>();

  const colors = useMemo(() => (settings.useSystemTheme && systemScheme === 'dark') ? dark : light, [settings.useSystemTheme, systemScheme]);

  const reloadLists = useCallback(async () => {
    const [storedPublishers, storedRemotes] = await Promise.all([listPublishers(), listRemotes()]);
    const now = Date.now();

    const activePublishers = storedPublishers.filter(x => x.expiresAt > now);
    const expiredPublisherIds = storedPublishers.filter(x => x.expiresAt <= now).map(x => x.id);
    if (activePublishers.length !== storedPublishers.length) {
      await savePublishers(activePublishers);
      await Promise.all(expiredPublisherIds.map(id => deleteChannelSecrets(id).catch(() => {})));
    }

    const activeRemotes: RemoteChannel[] = [];
    const expiredRemoteIds: string[] = [];
    for (const remote of storedRemotes) {
      if (remote.expiresAt > now) {
        activeRemotes.push(remote);
        continue;
      }
      // A location request starts with a 7-day invitation expiry. The recipient
      // may have accepted it and extended the relay lifetime while this device
      // was offline, so reconcile with the relay before removing it locally.
      if (remote.kind === 'requested-contact' && APP.relayUrl) {
        const viewerToken = await getSecret(remote.id, 'viewer');
        if (viewerToken) {
          try {
            const meta = await getChannelMeta(remote.id, viewerToken);
            if (meta.expiresAt > now) {
              activeRemotes.push({ ...remote, expiresAt: meta.expiresAt });
              continue;
            }
          } catch {}
        }
      }
      expiredRemoteIds.push(remote.id);
    }
    if (activeRemotes.length !== storedRemotes.length || activeRemotes.some((x, i) => x.expiresAt !== storedRemotes[i]?.expiresAt)) {
      await saveRemotes(activeRemotes);
      await Promise.all(expiredRemoteIds.map(id => deleteChannelSecrets(id).catch(() => {})));
    }
    setPublishers(activePublishers);
    setRemotes(activeRemotes);
  }, []);

  const refreshOwn = useCallback(async () => {
    const ok = await requestLocationPermissions(false);
    if (!ok) throw new Error(t(settings.language,'locationPermissionDenied'));
    setOwnSnapshot(await getCurrentSnapshot(t(settings.language,'myDevice')));
  }, [settings.language]);

  const refreshRemote = useCallback(async (id: string) => {
    if (!APP.relayUrl) return;
    const [viewerToken, key] = await Promise.all([getSecret(id, 'viewer'), getSecret(id, 'key')]);
    if (!viewerToken || !key) return;
    let state: { ciphertext:string; updatedAt:number } | null = null;
    try {
      state = await getState(id, viewerToken);
    } catch (error) {
      if (String((error as Error)?.message || error).includes('Relay 404')) {
        const current = await listRemotes();
        const next = current.filter(x => x.id !== id);
        await saveRemotes(next);
        await deleteChannelSecrets(id).catch(() => {});
        setRemotes(next.filter(x => x.expiresAt > Date.now()));
        setRemoteStates(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
        return;
      }
      throw error;
    }
    if (!state?.ciphertext) return;
    const decoded = decryptJson<DeviceSnapshot>(state.ciphertext, key);
    if (!decoded.address) decoded.address = await reverseGeocodeCached(id, decoded.latitude, decoded.longitude);
    if (decoded.shareExpiresAt) {
      const current = await listRemotes();
      const meta = current.find(x => x.id === id);
      if (meta && meta.expiresAt !== decoded.shareExpiresAt) {
        const next = current.map(x => x.id === id ? {...x, expiresAt: decoded.shareExpiresAt!} : x);
        await saveRemotes(next);
        setRemotes(next.filter(x => x.expiresAt > Date.now()));
      }
    }
    setRemoteStates(prev => ({ ...prev, [id]: decoded }));
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([refreshOwn(), ...remotes.map(r => refreshRemote(r.id))]);
  }, [refreshOwn, refreshRemote, remotes]);

  const createShare = useCallback(async (label: string, duration: ShareDuration) => {
    if (!APP.relayUrl) throw new Error('RELAY_NOT_CONFIGURED');
    const ok = await requestLocationPermissions(true);
    if (!ok) throw new Error(t(settings.language,'backgroundPermissionRequired'));
    const url = await createContactShare(label || t(settings.language,'shareLocation'), duration);
    await reloadLists();
    await ensureBackgroundTracking();
    await Share.share({ message: `${t(settings.language,'shareMessage')}\n${url}` });
  }, [reloadLists, settings.language]);

  const createRequest = useCallback(async (label: string) => {
    if (!APP.relayUrl) throw new Error('RELAY_NOT_CONFIGURED');
    const url = await createLocationRequest(label || t(settings.language,'requestContactName'));
    await reloadLists();
    await Share.share({ message: `${t(settings.language,'requestMessage')}
${url}` });
  }, [reloadLists, settings.language]);

  const acceptRequest = useCallback(async (url: string, duration: ShareDuration) => {
    if (!APP.relayUrl) throw new Error('RELAY_NOT_CONFIGURED');
    const ok = await requestLocationPermissions(true);
    if (!ok) throw new Error(t(settings.language,'backgroundPermissionRequired'));
    await acceptLocationRequest(url, duration);
    await reloadLists();
    await ensureBackgroundTracking();
  }, [reloadLists, settings.language]);

  const createPair = useCallback(async (label: string) => {
    if (!APP.relayUrl) throw new Error('RELAY_NOT_CONFIGURED');
    const url = await createDevicePairInvite(label || t(settings.language,'deviceGeneric'));
    await reloadLists();
    await Share.share({ message: `${t(settings.language,'pairMessage')}\n${url}` });
  }, [reloadLists, settings.language]);

  const ringRemote = useCallback(async (id: string) => {
    const [commandToken, key] = await Promise.all([getSecret(id, 'command'), getSecret(id, 'key')]);
    if (!commandToken || !key) throw new Error(t(settings.language,'ringNotAllowed'));
    await postCommand(id, commandToken, encryptJson({ type:'ring', timestamp: Date.now() }, key));
  }, [settings.language]);

  const revokePublisher = useCallback(async (id: string) => {
    const token = await getSecret(id, 'publisher');
    if (token && APP.relayUrl) await deleteChannel(id, token).catch(() => {});
    const next = (await listPublishers()).filter(x => x.id !== id);
    await savePublishers(next); await deleteChannelSecrets(id); await reloadLists();
    await ensureBackgroundTracking().catch(() => {});
  }, [reloadLists]);

  const removeRemote = useCallback(async (id: string) => {
    const current = await listRemotes();
    const meta = current.find(x => x.id === id);
    if ((meta?.kind === 'owned-device' || meta?.kind === 'requested-contact') && APP.relayUrl) {
      const commandToken = await getSecret(id, 'command');
      if (commandToken) await deleteChannel(id, commandToken).catch(() => {});
    }
    const next = current.filter(x => x.id !== id);
    await saveRemotes(next); await deleteChannelSecrets(id); await reloadLists();
    setRemoteStates(prev => { const n={...prev}; delete n[id]; return n; });
  }, [reloadLists]);

  const setLanguage = useCallback(async (language: AppSettings['language']) => {
    const next={...settings,language}; setSettingsState(next); await saveSettings(next);
  }, [settings]);
  const toggleSystemTheme = useCallback(async () => {
    const next={...settings,useSystemTheme:!settings.useSystemTheme}; setSettingsState(next); await saveSettings(next);
  }, [settings]);
  const toggleAutoUpdates = useCallback(async () => {
    const next={...settings,autoCheckUpdates:!settings.autoCheckUpdates}; setSettingsState(next); await saveSettings(next);
  }, [settings]);

  const checkUpdates = useCallback(async (force=false) => {
    try {
      const r = await checkGitHubRelease(force);
      if (!r) { if (force) Alert.alert('AsterFind', t(settings.language,'noUpdate')); return; }
      if (r.newer) Alert.alert(t(settings.language,'updateAvailable'), `${r.tag}`, [{text:t(settings.language,'later'),style:'cancel'}, {text:t(settings.language,'openRelease'),onPress:()=>RNLinking.openURL(r.url)}]);
      else if (force) Alert.alert('AsterFind', t(settings.language,'latestVersion'));
    } catch (e:any) { if (force) Alert.alert(t(settings.language,'updateCheckFailed'), String(e?.message||e)); }
  }, [settings.language]);

  useEffect(() => {
    (async () => {
      const s = await getSettings(); setSettingsState(s); await reloadLists();
      const ok = await requestLocationPermissions(false).catch(() => false);
      if (ok) setOwnSnapshot(await getCurrentSnapshot(t(s.language,'myDevice')).catch(() => undefined));
      await ensureBackgroundTracking().catch(() => {});
      if (s.autoCheckUpdates) {
        const r = await checkGitHubRelease(false).catch(() => null);
        if (r?.newer) Alert.alert(t(s.language,'updateAvailable'), `${r.tag}`, [{text:t(s.language,'later'),style:'cancel'}, {text:t(s.language,'openRelease'),onPress:()=>RNLinking.openURL(r.url)}]);
      }
    })();
  }, [reloadLists]);

  useEffect(() => {
    const timer=setInterval(() => refreshOwn().catch(() => {}), 10_000);
    return () => clearInterval(timer);
  }, [refreshOwn]);

  useEffect(() => {
    const timer=setInterval(() => reloadLists().catch(() => {}), 60_000);
    return () => clearInterval(timer);
  }, [reloadLists]);

  useEffect(() => {
    if (!remotes.length) return;
    remotes.forEach(r => refreshRemote(r.id).catch(() => {}));
    const timer=setInterval(() => remotes.forEach(r => refreshRemote(r.id).catch(() => {})), 10_000);
    return () => clearInterval(timer);
  }, [remotes, refreshRemote]);

  return <Ctx.Provider value={{colors,settings,setLanguage,toggleSystemTheme,toggleAutoUpdates,ownSnapshot,publishers,remotes,remoteStates,selectedRemoteId,setSelectedRemoteId,reloadLists,refreshOwn,refreshRemote,refreshAll,createShare,createRequest,acceptRequest,createPair,ringRemote,revokePublisher,removeRemote,checkUpdates}}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx=useContext(Ctx); if(!ctx) throw new Error('AppProvider missing'); return ctx;
}
