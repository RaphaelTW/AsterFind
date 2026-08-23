import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import { MapScreen } from './src/screens/MapScreen';
import { DevicesScreen } from './src/screens/DevicesScreen';
import { ContactsScreen } from './src/screens/ContactsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { acceptInvite } from './src/services/sharing';
import { ensureBackgroundTracking } from './src/services/background';
import { t } from './src/i18n/translations';

type Tab='map'|'devices'|'contacts'|'settings';

function Shell(){
  const {colors,settings,reloadLists}=useApp();
  const tr=(k: Parameters<typeof t>[1])=>t(settings.language,k);
  const [tab,setTab]=useState<Tab>('map');
  const [pendingRequestUrl,setPendingRequestUrl]=useState<string>();

  useEffect(()=>{
    const handle=(url:string)=>{
      const p=Linking.parse(url);
      if(p.path==='request'){
        setPendingRequestUrl(url);
        setTab('contacts');
        return;
      }
      if(p.path!=='share'&&p.path!=='pair') return;
      Alert.alert(tr('inviteAcceptTitle'), p.path==='pair'?tr('pairInviteBody'):tr('shareInviteBody'), [
        {text:tr('cancel'),style:'cancel'},
        {text:tr('acceptInvite'),onPress:async()=>{try{await acceptInvite(url);await reloadLists();await ensureBackgroundTracking();Alert.alert('AsterFind',tr('accepted'));}catch(e:any){Alert.alert(tr('invalidInvite'),String(e?.message||e))}}}
      ]);
    };
    Linking.getInitialURL().then(u=>u&&handle(u));
    const sub=Linking.addEventListener('url',e=>handle(e.url));
    return ()=>sub.remove();
  },[settings.language,reloadLists]);

  return <View style={{flex:1,backgroundColor:colors.background}}>
    <StatusBar style={colors.background==='#09090A'?'light':'dark'}/>
    <View style={{flex:1}}>{tab==='map'?<MapScreen/>:tab==='devices'?<DevicesScreen/>:tab==='contacts'?<ContactsScreen pendingRequestUrl={pendingRequestUrl} onRequestDone={()=>setPendingRequestUrl(undefined)}/>:<SettingsScreen/>}</View>
    <View style={{position:'absolute',left:12,right:12,bottom:14,backgroundColor:colors.surface,borderRadius:30,borderWidth:1,borderColor:colors.line,paddingVertical:8,paddingHorizontal:8,flexDirection:'row',justifyContent:'space-around'}}>
      <TabButton icon="⌖" label={tr('map')} active={tab==='map'} onPress={()=>setTab('map')}/>
      <TabButton icon="▣" label={tr('devices')} active={tab==='devices'} onPress={()=>setTab('devices')}/>
      <TabButton icon="◉" label={tr('contacts')} active={tab==='contacts'} onPress={()=>setTab('contacts')}/>
      <TabButton icon="⚙" label={tr('settings')} active={tab==='settings'} onPress={()=>setTab('settings')}/>
    </View>
  </View>;
}

function TabButton({icon,label,active,onPress}:{icon:string;label:string;active:boolean;onPress:()=>void}){const {colors}=useApp();return <Pressable onPress={onPress} style={{alignItems:'center',minWidth:68,paddingVertical:7,borderRadius:22,backgroundColor:active?colors.surface2:'transparent'}}><Text style={{fontSize:20,color:active?colors.accent:colors.muted}}>{icon}</Text><Text style={{fontSize:11,marginTop:3,color:active?colors.text:colors.muted,fontWeight:active?'800':'600'}}>{label}</Text></Pressable>}

export default function App(){return <SafeAreaProvider><AppProvider><Shell/></AppProvider></SafeAreaProvider>}
