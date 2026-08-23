import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { DeviceRow } from '@/components/DeviceRow';
import { OneCard } from '@/components/OneCard';
import { useApp } from '@/context/AppContext';
import { APP } from '@/config/app';
import { t } from '@/i18n/translations';

export function DevicesScreen(){
  const {colors,settings,ownSnapshot,remotes,remoteStates,createPair,ringRemote,removeRemote,setSelectedRemoteId}=useApp();
  const tr=(k: Parameters<typeof t>[1])=>t(settings.language,k);
  const [label,setLabel]=useState('');
  const devices=useMemo(()=>remotes.filter(r=>r.kind==='owned-device'),[remotes]);
  const pair=async()=>{ try{await createPair(label.trim()||tr('otherDeviceName'));}catch(e:any){Alert.alert('AsterFind',e.message==='RELAY_NOT_CONFIGURED'?tr('relayConfigure'):String(e.message||e));} };
  return <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:18,paddingTop:58,paddingBottom:120}}>
    <Text style={{fontSize:34,fontWeight:'900',color:colors.text}}>{tr('devices')}</Text>
    <Text style={{color:colors.muted,marginTop:6,marginBottom:18}}>{tr('pairedOnly')}</Text>
    <OneCard>
      <DeviceRow label={tr('myDevice')} snapshot={ownSnapshot}/>
      {devices.map(r=><View key={r.id} style={{borderTopWidth:1,borderColor:colors.line}}><DeviceRow label={r.label} snapshot={remoteStates[r.id]} canRing={r.canRing} onRing={()=>ringRemote(r.id).catch(e=>Alert.alert('AsterFind',String(e)))} onPress={()=>setSelectedRemoteId(r.id)}/><Pressable onPress={()=>Alert.alert(tr('removeDeviceTitle'),`${tr('removeDeviceQuestion')}\n${r.label}`,[{text:tr('cancel'),style:'cancel'},{text:tr('remove'),style:'destructive',onPress:()=>removeRemote(r.id)}])}><Text style={{color:colors.danger,paddingBottom:12,fontWeight:'700'}}>{tr('remove')}</Text></Pressable></View>)}
      {!devices.length && <Text style={{color:colors.muted,paddingVertical:16,textAlign:'center'}}>{tr('noDevices')}</Text>}
    </OneCard>
    <Text style={{fontSize:22,fontWeight:'800',color:colors.text,marginTop:26,marginBottom:10}}>{tr('addDevice')}</Text>
    <OneCard>
      <TextInput value={label} onChangeText={setLabel} placeholder={tr('deviceName')} placeholderTextColor={colors.muted} style={{backgroundColor:colors.surface2,color:colors.text,borderRadius:18,paddingHorizontal:16,paddingVertical:14,fontSize:16}}/>
      <Pressable onPress={pair} style={{backgroundColor:colors.accent,paddingVertical:15,borderRadius:18,alignItems:'center',marginTop:12}}><Text style={{color:'#fff',fontSize:16,fontWeight:'800'}}>{tr('generatePairLink')}</Text></Pressable>
      {!APP.relayUrl && <Text style={{color:colors.danger,fontSize:12,marginTop:10}}>{tr('relayMissing')}</Text>}
    </OneCard>
  </ScrollView>;
}
