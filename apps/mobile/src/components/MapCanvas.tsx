import React from 'react';
import { View, Text } from 'react-native';
import { Map, Camera, GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { MAP_STYLE } from '@/config/app';
import type { DeviceSnapshot } from '@/types/models';

export function MapCanvas({snapshot}:{snapshot?:DeviceSnapshot}){
  const center:[number,number]=snapshot?[snapshot.longitude,snapshot.latitude]:[0,20];
  const point = snapshot ? { type:'Feature' as const, geometry:{type:'Point' as const,coordinates:center}, properties:{} } : undefined;
  return <View style={{flex:1,overflow:'hidden'}}>
    <Map style={{flex:1}} mapStyle={MAP_STYLE as any} androidView="texture">
      <Camera center={center} zoom={snapshot?16:2} duration={600} easing="ease" />
      {point && <GeoJSONSource id="device" data={point as any}>
        <Layer id="halo" type="circle" paint={{'circle-radius':25,'circle-color':'#5E87FF','circle-opacity':0.2} as any} />
        <Layer id="dot" type="circle" paint={{'circle-radius':10,'circle-color':'#376FEA','circle-stroke-color':'#FFFFFF','circle-stroke-width':3} as any} />
      </GeoJSONSource>}
    </Map>
    <View pointerEvents="none" style={{position:'absolute',left:12,bottom:8,backgroundColor:'rgba(0,0,0,.55)',paddingHorizontal:7,paddingVertical:4,borderRadius:7}}><Text style={{color:'#fff',fontSize:10}}>© OpenStreetMap contributors</Text></View>
  </View>;
}
