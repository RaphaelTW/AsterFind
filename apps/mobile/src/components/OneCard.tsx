import React from 'react';
import { View, ViewProps } from 'react-native';
import { useApp } from '@/context/AppContext';

export function OneCard({style,...props}:ViewProps){
  const {colors}=useApp();
  return <View {...props} style={[{backgroundColor:colors.surface,borderRadius:28,padding:18,borderWidth:1,borderColor:colors.line},style]} />;
}
