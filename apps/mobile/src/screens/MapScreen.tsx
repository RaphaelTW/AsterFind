import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { MapCanvas } from '@/components/MapCanvas';
import { OneCard } from '@/components/OneCard';
import { formatAddress } from '@/services/location';
import { distanceKm, timeAgo } from '@/utils/distance';
import { APP } from '@/config/app';
import { t } from '@/i18n/translations';

export function MapScreen(){
  const {colors,settings,ownSnapshot,remotes,remoteStates,selectedRemoteId,setSelectedRemoteId,refreshOwn,refreshRemote,ringRemote}=useApp();
  const tr=(k: Parameters<typeof t>[1])=>t(settings.language,k);
  const selected = selectedRemoteId ? remoteStates[selectedRemoteId] : ownSnapshot;
  const selectedMeta = selectedRemoteId ? remotes.find(r=>r.id===selectedRemoteId) : undefined;
  const distance = useMemo(()=>{
    if(!ownSnapshot || !selected || !selectedRemoteId) return 0;
    return distanceKm(ownSnapshot.latitude,ownSnapshot.longitude,selected.latitude,selected.longitude);
  },[ownSnapshot,selected,selectedRemoteId]);
  const active = !!selected && Date.now()-selected.timestamp < APP.offlineThresholdMs;
  const title = selectedMeta?.label || tr('myDevice');

  return <View style={{flex:1,backgroundColor:colors.background}}>
    <MapCanvas snapshot={selected}/>
    <View style={{position:'absolute',top:52,left:16,right:16}}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>
        <Pressable onPress={()=>setSelectedRemoteId(undefined)} style={{backgroundColor:!selectedRemoteId?colors.text:colors.surface,paddingHorizontal:16,paddingVertical:10,borderRadius:22}}><Text style={{color:!selectedRemoteId?colors.background:colors.text,fontWeight:'700'}}>{tr('myDevice')}</Text></Pressable>
        {remotes.map(r=><Pressable key={r.id} onPress={()=>setSelectedRemoteId(r.id)} style={{backgroundColor:selectedRemoteId===r.id?colors.text:colors.surface,paddingHorizontal:16,paddingVertical:10,borderRadius:22}}><Text style={{color:selectedRemoteId===r.id?colors.background:colors.text,fontWeight:'700'}}>{r.label}</Text></Pressable>)}
      </ScrollView>
    </View>
    <View style={{position:'absolute',left:10,right:10,bottom:96}}>
      <OneCard style={{backgroundColor:colors.mapSheet,padding:20}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10}}>
          <View style={{flex:1}}><Text style={{fontSize:26,fontWeight:'800',color:colors.text}} numberOfLines={1}>{title}</Text><Text style={{fontSize:14,color:colors.muted,marginTop:6}} numberOfLines={2}>{selected?formatAddress(selected.address)||`${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`:tr('obtainingLocation')}</Text></View>
          <Pressable onPress={()=>selectedRemoteId?refreshRemote(selectedRemoteId):refreshOwn()} style={{width:52,height:52,borderRadius:26,backgroundColor:colors.surface2,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:24}}>↻</Text></Pressable>
        </View>
        {selected && <View style={{flexDirection:'row',gap:10,marginTop:18,flexWrap:'wrap'}}>
          <Pill text={selectedRemoteId?`${distance.toFixed(distance<10?1:0)} km`:'0 km'} />
          <Pill text={`${tr('battery')}: ${Math.round(selected.batteryLevel*100)}%${selected.charging?' ⚡':''}`}  />
          <Pill text={active?tr('active'):`${tr('offline')} • ${timeAgo(selected.timestamp, settings.language)}`}  />
          {selected.accuracy!=null && <Pill text={`±${Math.round(selected.accuracy)} m`} />}
        </View>}
        {selectedMeta?.canRing && <Pressable onPress={()=>ringRemote(selectedMeta.id).catch(e=>Alert.alert('AsterFind',String(e?.message||e)))} style={{marginTop:16,backgroundColor:colors.accent,paddingVertical:14,borderRadius:18,alignItems:'center'}}><Text style={{color:'#fff',fontWeight:'800',fontSize:16}}>🔔 {tr('ring')}</Text></Pressable>}
      </OneCard>
    </View>
  </View>;
}

function Pill({text}:{text:string}){
  const {colors}=useApp();
  return <View style={{backgroundColor:colors.surface2,borderRadius:16,paddingHorizontal:12,paddingVertical:8}}><Text style={{color:colors.text,fontWeight:'600',fontSize:13}}>{text}</Text></View>;
}
