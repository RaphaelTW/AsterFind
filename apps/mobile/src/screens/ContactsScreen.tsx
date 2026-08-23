import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { OneCard } from '@/components/OneCard';
import { DeviceRow } from '@/components/DeviceRow';
import { useApp } from '@/context/AppContext';
import type { ShareDuration } from '@/types/models';
import { APP } from '@/config/app';
import { t } from '@/i18n/translations';

export function ContactsScreen({pendingRequestUrl,onRequestDone}:{pendingRequestUrl?:string;onRequestDone?:()=>void}){
  const {colors,settings,publishers,remotes,remoteStates,createShare,createRequest,acceptRequest,revokePublisher,removeRemote}=useApp();
  const tr=(k: Parameters<typeof t>[1])=>t(settings.language,k);
  const contacts=remotes.filter(r=>r.kind==='contact'||r.kind==='requested-contact');
  const shares=publishers.filter(p=>p.kind==='contact-share');
  const durations=useMemo<{value:ShareDuration;label:string}[]>(()=>[
    {value:'1h',label:tr('oneHour')},{value:'8h',label:tr('eightHours')},{value:'1d',label:tr('oneDay')},{value:'7d',label:tr('sevenDays')},{value:'forever',label:tr('forever')}
  ],[settings.language]);
  const [name,setName]=useState('');
  const [requestName,setRequestName]=useState('');
  const [duration,setDuration]=useState<ShareDuration>('8h');

  const go=async()=>{try{await createShare(name.trim()||tr('shareLocation'),duration);}catch(e:any){Alert.alert('AsterFind',e.message==='RELAY_NOT_CONFIGURED'?tr('relayConfigure'):String(e.message||e))}};
  const request=async()=>{try{await createRequest(requestName.trim()||tr('requestContactName'));}catch(e:any){Alert.alert('AsterFind',e.message==='RELAY_NOT_CONFIGURED'?tr('relayConfigure'):String(e.message||e))}};
  const accept=async()=>{if(!pendingRequestUrl)return;try{await acceptRequest(pendingRequestUrl,duration);onRequestDone?.();Alert.alert('AsterFind',tr('accepted'));}catch(e:any){Alert.alert(tr('invalidInvite'),String(e?.message||e))}};

  return <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:18,paddingTop:58,paddingBottom:120}}>
    <Text style={{fontSize:34,fontWeight:'900',color:colors.text}}>{tr('contacts')}</Text>
    <Text style={{color:colors.muted,marginTop:6}}>{tr('consentNote')}</Text>

    {pendingRequestUrl && <View style={{marginTop:22}}><OneCard>
      <Text style={{color:colors.text,fontSize:21,fontWeight:'900'}}>{tr('requestReceived')}</Text>
      <Text style={{color:colors.muted,marginTop:8,lineHeight:20}}>{tr('requestReceivedBody')}</Text>
      <Text style={{color:colors.text,fontWeight:'800',marginTop:16}}>{tr('shareFor')}</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10}}>{durations.map(d=><Pressable key={d.value} onPress={()=>setDuration(d.value)} style={{backgroundColor:duration===d.value?colors.text:colors.surface2,borderRadius:18,paddingHorizontal:12,paddingVertical:9}}><Text style={{color:duration===d.value?colors.background:colors.text,fontWeight:'700',fontSize:13}}>{d.label}</Text></Pressable>)}</View>
      <Pressable onPress={accept} style={{backgroundColor:colors.accent,paddingVertical:15,borderRadius:18,alignItems:'center',marginTop:14}}><Text style={{color:'#fff',fontSize:16,fontWeight:'800'}}>{tr('acceptAndShare')}</Text></Pressable>
      <Pressable onPress={onRequestDone} style={{paddingVertical:13,alignItems:'center'}}><Text style={{color:colors.muted,fontWeight:'700'}}>{tr('cancel')}</Text></Pressable>
    </OneCard></View>}

    <Text style={{fontSize:22,fontWeight:'800',color:colors.text,marginTop:26,marginBottom:10}}>{tr('sharedWithMe')}</Text>
    <OneCard>{contacts.length?contacts.map(r=><View key={r.id} style={{borderBottomWidth:1,borderColor:colors.line}}><DeviceRow label={r.label} snapshot={remoteStates[r.id]}/><Pressable onPress={()=>removeRemote(r.id)}><Text style={{color:colors.danger,paddingBottom:12,fontWeight:'700'}}>{tr('remove')}</Text></Pressable></View>):<Text style={{color:colors.muted,paddingVertical:22,textAlign:'center'}}>{tr('noContacts')}</Text>}</OneCard>

    <Text style={{fontSize:22,fontWeight:'800',color:colors.text,marginTop:26,marginBottom:10}}>{tr('requestLocation')}</Text>
    <OneCard>
      <TextInput value={requestName} onChangeText={setRequestName} placeholder={tr('requestContactName')} placeholderTextColor={colors.muted} style={{backgroundColor:colors.surface2,color:colors.text,borderRadius:18,paddingHorizontal:16,paddingVertical:14,fontSize:16}}/>
      <Pressable onPress={request} style={{backgroundColor:colors.accent,paddingVertical:15,borderRadius:18,alignItems:'center',marginTop:12}}><Text style={{color:'#fff',fontSize:16,fontWeight:'800'}}>{tr('requestLocation')}</Text></Pressable>
      {!APP.relayUrl && <Text style={{color:colors.danger,fontSize:12,marginTop:10}}>{tr('relayMissing')}</Text>}
    </OneCard>

    <Text style={{fontSize:22,fontWeight:'800',color:colors.text,marginTop:26,marginBottom:10}}>{tr('shareLocation')}</Text>
    <OneCard>
      <TextInput value={name} onChangeText={setName} placeholder={tr('sharingName')} placeholderTextColor={colors.muted} style={{backgroundColor:colors.surface2,color:colors.text,borderRadius:18,paddingHorizontal:16,paddingVertical:14,fontSize:16}}/>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12}}>{durations.map(d=><Pressable key={d.value} onPress={()=>setDuration(d.value)} style={{backgroundColor:duration===d.value?colors.text:colors.surface2,borderRadius:18,paddingHorizontal:12,paddingVertical:9}}><Text style={{color:duration===d.value?colors.background:colors.text,fontWeight:'700',fontSize:13}}>{d.label}</Text></Pressable>)}</View>
      <Pressable onPress={go} style={{backgroundColor:colors.accent,paddingVertical:15,borderRadius:18,alignItems:'center',marginTop:14}}><Text style={{color:'#fff',fontSize:16,fontWeight:'800'}}>{tr('createInvite')}</Text></Pressable>
      {!APP.relayUrl && <Text style={{color:colors.danger,fontSize:12,marginTop:10}}>{tr('relayMissing')}</Text>}
    </OneCard>

    {shares.length>0 && <><Text style={{fontSize:22,fontWeight:'800',color:colors.text,marginTop:26,marginBottom:10}}>{tr('activeShares')}</Text><OneCard>{shares.map(s=><View key={s.id} style={{paddingVertical:12,borderBottomWidth:1,borderColor:colors.line}}><Text style={{color:colors.text,fontSize:17,fontWeight:'700'}}>{s.label}</Text><Text style={{color:colors.muted,marginTop:4}}>{tr('expires')}: {s.expiresAt>253000000000000?tr('forever'):new Date(s.expiresAt).toLocaleString(settings.language)}</Text><Pressable onPress={()=>revokePublisher(s.id)}><Text style={{color:colors.danger,fontWeight:'700',marginTop:10}}>{tr('revoke')}</Text></Pressable></View>)}</OneCard></>}
  </ScrollView>;
}
