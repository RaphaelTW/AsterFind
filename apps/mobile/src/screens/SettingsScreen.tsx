import React from 'react';
import { Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { OneCard } from '@/components/OneCard';
import { useApp } from '@/context/AppContext';
import { APP } from '@/config/app';
import { languageLabels, t } from '@/i18n/translations';
import type { LanguageCode } from '@/types/models';
import { openDndAccessSettings, stopLoudRing } from '@/native/LoudRing';

export function SettingsScreen(){
  const {colors,settings,setLanguage,toggleSystemTheme,toggleAutoUpdates,checkUpdates}=useApp();
  const tr=(k: Parameters<typeof t>[1])=>t(settings.language,k);
  return <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{padding:18,paddingTop:58,paddingBottom:120}}>
    <Text style={{fontSize:34,fontWeight:'900',color:colors.text}}>{tr('settings')}</Text>

    <Section title={tr('language')}><OneCard>{Object.entries(languageLabels).map(([code,label])=><Pressable key={code} onPress={()=>setLanguage(code as LanguageCode)} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:12}}><Text style={{color:colors.text,fontSize:16}}>{label}</Text><Text style={{color:colors.accent,fontWeight:'900'}}>{settings.language===code?'✓':''}</Text></Pressable>)}</OneCard></Section>

    <Section title={tr('appearance')}><OneCard><SettingRow title={tr('systemTheme')} value={settings.useSystemTheme} onChange={toggleSystemTheme}/></OneCard></Section>

    <Section title={tr('locationAndSound')}><OneCard><Pressable onPress={openDndAccessSettings} style={{paddingVertical:10}}><Text style={{color:colors.text,fontSize:16,fontWeight:'700'}}>{tr('dndPermission')}</Text><Text style={{color:colors.muted,marginTop:4}}>{tr('dndDescription')}</Text></Pressable><Pressable onPress={stopLoudRing} style={{paddingVertical:14,borderTopWidth:1,borderColor:colors.line}}><Text style={{color:colors.danger,fontWeight:'800'}}>{tr('stopCurrentRing')}</Text></Pressable></OneCard></Section>

    <Section title={tr('updates')}><OneCard><SettingRow title={tr('autoCheckUpdates')} value={settings.autoCheckUpdates} onChange={toggleAutoUpdates}/><Pressable onPress={()=>checkUpdates(true)} style={{paddingVertical:14,borderTopWidth:1,borderColor:colors.line}}><Text style={{color:colors.accent,fontWeight:'800'}}>{tr('checkUpdates')}</Text></Pressable></OneCard></Section>

    <Section title={tr('about')}><OneCard>
      <Text style={{color:colors.text,fontSize:18,fontWeight:'800'}}>AsterFind {APP.version}</Text>
      <Text style={{color:colors.muted,marginTop:8,lineHeight:20}}>{tr('aboutBody')}</Text>
      <Pressable onPress={()=>Linking.openURL(APP.developerUrl)} style={{paddingVertical:13}}><Text style={{color:colors.accent,fontWeight:'800'}}>{tr('developer')}</Text></Pressable>
      <Pressable onPress={()=>Linking.openURL(`https://github.com/${APP.githubRepo}`)} style={{paddingVertical:13,borderTopWidth:1,borderColor:colors.line}}><Text style={{color:colors.accent,fontWeight:'800'}}>{tr('docs')}</Text></Pressable>
      <View style={{paddingVertical:13,borderTopWidth:1,borderColor:colors.line}}><Text style={{color:colors.text,fontWeight:'700'}}>{tr('donate')}</Text><Text selectable style={{color:colors.muted,marginTop:5}}>{APP.pixKey}</Text></View>
    </OneCard></Section>
  </ScrollView>;
}

function Section({title,children}:{title:string;children:React.ReactNode}){const {colors}=useApp();return <View style={{marginTop:26}}><Text style={{fontSize:21,fontWeight:'800',color:colors.text,marginBottom:10}}>{title}</Text>{children}</View>}
function SettingRow({title,value,onChange}:{title:string;value:boolean;onChange:()=>void}){const {colors}=useApp();return <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8}}><Text style={{color:colors.text,fontSize:16,fontWeight:'600'}}>{title}</Text><Switch value={value} onValueChange={onChange}/></View>}
