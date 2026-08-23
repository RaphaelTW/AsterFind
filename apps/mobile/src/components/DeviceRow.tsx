import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import type { DeviceSnapshot } from '@/types/models';
import { formatAddress } from '@/services/location';
import { APP } from '@/config/app';
import { timeAgo } from '@/utils/distance';
import { t } from '@/i18n/translations';

export function DeviceRow({label,snapshot,onPress,canRing,onRing}:{label:string;snapshot?:DeviceSnapshot;onPress?:()=>void;canRing?:boolean;onRing?:()=>void}){
  const {colors,settings}=useApp();
  const tr=(k: Parameters<typeof t>[1])=>t(settings.language,k);
  const online=!!snapshot && Date.now()-snapshot.timestamp < APP.offlineThresholdMs;
  return <Pressable onPress={onPress} style={{paddingVertical:16,flexDirection:'row',gap:14,alignItems:'center'}}>
    <View style={{width:54,height:54,borderRadius:27,backgroundColor:colors.surface2,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:24}}>📱</Text></View>
    <View style={{flex:1}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{color:colors.text,fontSize:18,fontWeight:'700'}} numberOfLines={1}>{label}</Text><View style={{width:8,height:8,borderRadius:4,backgroundColor:online?colors.success:colors.muted}}/></View>
      <Text style={{color:colors.muted,fontSize:13,marginTop:3}} numberOfLines={2}>{snapshot ? (formatAddress(snapshot.address)||`${snapshot.latitude.toFixed(5)}, ${snapshot.longitude.toFixed(5)}`) : tr('noUpdate')}</Text>
      <Text style={{color:colors.muted,fontSize:12,marginTop:5}}>{snapshot ? `${Math.round(snapshot.batteryLevel*100)}% • ${online?tr('active'):`${tr('offline')} • ${timeAgo(snapshot.timestamp, settings.language)}`}` : tr('offline')}</Text>
    </View>
    {canRing && <Pressable onPress={onRing} hitSlop={10} style={{padding:10}}><Text style={{fontSize:22}}>🔔</Text></Pressable>}
  </Pressable>;
}
