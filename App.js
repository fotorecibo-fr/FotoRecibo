import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Animated, ActivityIndicator, Alert, ScrollView, Linking } from 'react-native';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';

const ADMIN_PIN = '8842';
const PAYMENT_CONFIG = {
  gcash: { name: "FOTO RECIBO", number: "09171234567", qrUrl: "https://i.imgur.com/YOUR_GCASH_QR.png", deepLink: "gcash://" },
  maya: { name: "FOTO RECIBO", number: "09171234567", qrUrl: "https://i.imgur.com/YOUR_MAYA_QR.png", deepLink: "maya://" },
  prices: { '1': 20, '2': 30, '4': 50, '6': 70 }
};

export default function App() {
  const [screen, setScreen] = useState('HOME');
  const [photos, setPhotos] = useState([]);
  const [layout, setLayout] = useState('4');
  const [timer, setTimer] = useState(5);
  const [mirrored, setMirrored] = useState(true);
  const [pinVisible, setPinVisible] = useState(false);
  const [pin, setPin] = useState('');
  const timerRef = useRef(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  useEffect(()=>{ if(!hasPermission) requestPermission(); },[]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPressIn={()=>{timerRef.current=setTimeout(()=>setPinVisible(true),4000)}} onPressOut={()=>clearTimeout(timerRef.current)}>
          <Text style={s.logo}>📷 FOTO RECIBO - MIRROR {mirrored?'ON':'OFF'} - HOLD 4s PIN {ADMIN_PIN}</Text>
        </TouchableOpacity>
      </View>

      {screen==='HOME' && (
        <View style={s.center}>
          <Text style={s.sub}>B&W RECEIPT - MIRRORED - 5s TIMER - GCASH/MAYA</Text>
          <TouchableOpacity style={s.startBtn} onPress={()=>setScreen('PAY')}><Text style={s.startTxt}>TAP TO START</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setMirrored(!mirrored)} style={s.toggle}><Text>Mirror {mirrored?'ON':'OFF'} - Tap to toggle</Text></TouchableOpacity>
        </View>
      )}

      {screen==='PAY' && (
        <ScrollView contentContainerStyle={s.preview}>
          <Text style={s.title}>LAYOUT ₱{PAYMENT_CONFIG.prices[layout]} - {timer}s TIMER</Text>
          <View style={s.row}>{['1','2','4','6'].map(l=><TouchableOpacity key={l} onPress={()=>setLayout(l)} style={[s.box, layout===l&&s.boxActive]}><Text style={layout===l&&{color:'#fff'}}>{l} Photo</Text></TouchableOpacity>)}</View>
          <View style={s.row}>{[0,3,5,10].map(t=><TouchableOpacity key={t} onPress={()=>setTimer(t)} style={[s.box, timer===t&&s.boxActive]}><Text style={timer===t&&{color:'#fff'}}>{t}s</Text></TouchableOpacity>)}</View>
          <Text style={[s.title,{marginTop:20}]}>GCash / Maya Direct - No PayMongo</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.gcash} onPress={()=>setPhotos(['gcash'])}><Text style={s.light}>GCash {PAYMENT_CONFIG.gcash.number}</Text></TouchableOpacity>
            <TouchableOpacity style={s.maya} onPress={()=>setPhotos(['maya'])}><Text style={s.light}>Maya {PAYMENT_CONFIG.maya.number}</Text></TouchableOpacity>
          </View>
          {(photos[0]==='gcash'||photos[0]==='maya') && (
            <View style={s.qr}><Text>Scan {photos[0]} - ₱{PAYMENT_CONFIG.prices[layout]}</Text><TouchableOpacity style={s.print} onPress={()=>setScreen('CAP')}><Text style={s.light}>I PAID - START {timer}s + MIRROR</Text></TouchableOpacity></View>
          )}
        </ScrollView>
      )}

      {screen==='CAP' && <Capture layout={layout} timer={timer} mirrored={mirrored} onDone={(p)=>{setPhotos(p); setScreen('PREVIEW');}} />}

      {screen==='PREVIEW' && (
        <ScrollView contentContainerStyle={s.preview}>
          <Text style={s.title}>YOUR RECEIPT {photos.length} Photos B&W Mirrored</Text>
          <View style={s.strip}>{photos.map((_,i)=><View key={i} style={s.ph}><Text>Photo {i+1}</Text></View>)}</View>
          <View style={s.row}><TouchableOpacity style={s.retake} onPress={()=>setScreen('CAP')}><Text>Retake</Text></TouchableOpacity><TouchableOpacity style={s.print} onPress={()=>{Alert.alert('Printed'); setScreen('HOME');}}><Text style={s.light}>Print Receipt</Text></TouchableOpacity></View>
        </ScrollView>
      )}

      <Modal visible={pinVisible} transparent animationType="fade">
        <View style={s.modalBg}><View style={s.modalCard}><TextInput secureTextEntry keyboardType="numeric" maxLength={4} value={pin} onChangeText={setPin} style={s.pin} placeholder="----" /><TouchableOpacity style={s.print} onPress={()=>{if(pin===ADMIN_PIN){setPinVisible(false); setPin('');} else Alert.alert('Wrong');}}><Text style={s.light}>Authorize</Text></TouchableOpacity></View></View>
      </Modal>
    </View>
  );
}

function Capture({ layout, timer, mirrored, onDone }){
  const devices = useCameraDevices(); const device = devices.front; const camRef = useRef(null); const [cd, setCd] = useState(null); const flash = useRef(new Animated.Value(0)).current;
  useEffect(()=>{ if(!device) return; (async()=>{ const total=parseInt(layout); const arr=[]; for(let i=0;i<total;i++){ if(timer>0){ for(let c=timer;c>0;c--){ setCd(c); await new Promise(r=>setTimeout(r,1000)); } setCd(null);} flash.setValue(1); Animated.timing(flash,{toValue:0,duration:400,useNativeDriver:true}).start(); await new Promise(r=>setTimeout(r,200)); if(camRef.current){ try{ const p=await camRef.current.takePhoto({flash:'off'}); arr.push(`file://${p.path}`);}catch(e){} } await new Promise(r=>setTimeout(r,800)); } onDone(arr); })(); },[device]);
  if(!device) return <View style={s.center}><ActivityIndicator size="large" /></View>;
  return <View style={s.container}><Camera ref={camRef} style={[StyleSheet.absoluteFill, mirrored&&{transform:[{scaleX:-1}]}]} device={device} isActive photo /><Animated.View pointerEvents="none" style={[s.flash,{opacity:flash}]} />{cd&&<View style={s.overlay}><Text style={s.count}>{cd}</Text></View>}</View>;
}

const s = StyleSheet.create({
  container:{flex:1, backgroundColor:'#111'}, header:{height:70, backgroundColor:'#000', justifyContent:'center', alignItems:'center', paddingTop:20}, logo:{color:'#fff', fontSize:9, fontWeight:'900'},
  center:{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#F8F9FA', padding:20}, sub:{fontSize:12, fontWeight:'700', marginBottom:20, textAlign:'center'},
  startBtn:{backgroundColor:'#000', padding:20, borderRadius:12}, startTxt:{color:'#fff', fontSize:20, fontWeight:'bold'}, toggle:{marginTop:15, padding:10, backgroundColor:'#eee', borderRadius:8},
  overlay:{...StyleSheet.absoluteFillObject, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.6)'}, count:{fontSize:120, fontWeight:'900', color:'#fff'}, flash:{...StyleSheet.absoluteFillObject, backgroundColor:'#fff'},
  preview:{padding:20, alignItems:'center', backgroundColor:'#F8F9FA', flexGrow:1}, title:{fontSize:14, fontWeight:'900', marginBottom:10}, row:{flexDirection:'row', gap:10, marginVertical:8},
  box:{padding:10, borderWidth:1, borderColor:'#ccc', borderRadius:8, backgroundColor:'#fff'}, boxActive:{backgroundColor:'#000'}, strip:{width:240, backgroundColor:'#fff', padding:10, gap:10, elevation:3}, ph:{width:220, height:140, backgroundColor:'#ddd', justifyContent:'center', alignItems:'center', borderWidth:1},
  retake:{padding:12, backgroundColor:'#ddd', borderRadius:8}, print:{padding:12, backgroundColor:'#000', borderRadius:8}, light:{color:'#fff', fontWeight:'bold', fontSize:11, textAlign:'center'},
  gcash:{padding:12, backgroundColor:'#007dfe', borderRadius:8}, maya:{padding:12, backgroundColor:'#000', borderRadius:8}, qr:{marginTop:15, padding:15, backgroundColor:'#fff', borderWidth:2, borderColor:'#000', borderRadius:10, alignItems:'center', width:280},
  modalBg:{flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', alignItems:'center'}, modalCard:{width:280, padding:20, backgroundColor:'#fff', borderRadius:12, alignItems:'center'}, pin:{width:'100%', borderBottomWidth:2, fontSize:24, textAlign:'center', letterSpacing:8}
});
