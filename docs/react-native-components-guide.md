# React Native Components & Concepts — Glido App Learning Guide

Is guide mein woh sab cheezein hain jo humne **Glido App** banate waqt use ki hain.  
Har cheez ko explain kiya gaya hai — kya hai, kyun use karte hain, aur humne kahan use kiya.

---

## Table of Contents

1. [React Native Core Components](#1-react-native-core-components)
   - [View](#view)
   - [Text](#text)
   - [TextInput](#textinput)
   - [TouchableOpacity](#touchableopacity)
   - [Animated.View](#animatedview)
   - [StyleSheet](#stylesheet)
   - [Dimensions](#dimensions)
2. [React Hooks](#2-react-hooks)
   - [useState](#usestate)
   - [useEffect](#useeffect)
   - [useRef](#useref)
3. [Expo APIs & Libraries](#3-expo-apis--libraries)
   - [expo-router](#expo-router)
   - [expo-status-bar](#expo-status-bar)
   - [expo-location](#expo-location)
   - [@expo/vector-icons (Ionicons)](#expovector-icons--ionicons)
4. [Third-Party Libraries](#4-third-party-libraries)
   - [react-native-maps](#react-native-maps)
5. [Animation System](#5-animation-system)
6. [Styling in React Native](#6-styling-in-react-native)
7. [Event Handlers & Props](#7-event-handlers--props)
8. [Custom Components](#8-custom-components)
9. [App Architecture & Navigation](#9-app-architecture--navigation)

---

## 1. React Native Core Components

### `View`

**Kya hai?**  
`View` React Native ka sabse basic layout component hai. HTML mein `<div>` ki tarah kaam karta hai.

**Kyun use karte hain?**  
Elements ko group karna, layout banana (flexbox se), aur screen arrange karna.

**Basic Syntax:**
```tsx
import { View } from 'react-native';

<View style={{ flex: 1, backgroundColor: 'white' }}>
  {/* Yahan children components aate hain */}
</View>
```

**Humne kahan use kiya:**
- `app/welcome.tsx` — poori screen ka main container
- `app/phone.tsx` — phone input aur button ko wrap karna
- `app/home.tsx` — map, drawer, search bar sab View ke andar

**Key Props:**
| Prop | Description |
|------|-------------|
| `style` | Layout aur visual styling |
| `onLayout` | Jab element ka size change ho |

---

### `Text`

**Kya hai?**  
`Text` React Native mein sirf text dikhane ke liye use hota hai. HTML ka `<p>` ya `<span>` samjho.

> **Important:** React Native mein text **sirf** `<Text>` ke andar likhna hota hai, `<View>` ke andar seedha nahi.

**Basic Syntax:**
```tsx
import { Text } from 'react-native';

<Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
  Glido se safar karo!
</Text>
```

**Humne kahan use kiya:**
- `app/welcome.tsx` — "Find a ride" heading, subtitle text
- `app/otp.tsx` — "Enter OTP", timer countdown text
- `app/home.tsx` — location label, drawer menu items

**Key Props:**
| Prop | Description |
|------|-------------|
| `numberOfLines` | Text ko N lines tak limit karo |
| `style` | Font, color, alignment |
| `onPress` | Text clickable banana |

---

### `TextInput`

**Kya hai?**  
`TextInput` user se text input lene ka component hai. HTML ka `<input>` field.

**Basic Syntax:**
```tsx
import { TextInput } from 'react-native';

<TextInput
  value={phone}
  onChangeText={(text) => setPhone(text)}
  placeholder="Phone number dalein"
  keyboardType="number-pad"
  maxLength={11}
/>
```

**Humne kahan use kiya:**
- `app/phone.tsx` — phone number input
- `app/otp.tsx` — 4 alag OTP boxes (har digit ke liye alag TextInput)
- `app/home.tsx` — "From" aur "To" location search inputs

**Key Props:**
| Prop | Description |
|------|-------------|
| `value` | Controlled input ki value |
| `onChangeText` | Text change hone par callback |
| `keyboardType` | `"number-pad"`, `"email-address"`, `"default"` |
| `maxLength` | Maximum characters |
| `autoFocus` | Screen open hone par automatically focus |
| `placeholder` | Empty state mein hint text |
| `placeholderTextColor` | Placeholder ka color |
| `secureTextEntry` | Password field banana |
| `onKeyPress` | Key press event (backspace detect karna) |
| `ref` | Programmatically focus karne ke liye |

**OTP input trick — `app/otp.tsx` mein:**
```tsx
// Har digit ke liye alag TextInput, ref se next box pe focus
<TextInput
  ref={refs[0]}
  value={otp[0]}
  maxLength={1}
  onChangeText={(val) => {
    if (val) refs[1].current?.focus(); // Next box pe jao
  }}
  onKeyPress={({ nativeEvent }) => {
    if (nativeEvent.key === 'Backspace') refs[0-1]?.current?.focus();
  }}
/>
```

---

### `TouchableOpacity`

**Kya hai?**  
Clickable/tappable area banana ke liye. Press karne par element thoda transparent ho jaata hai (opacity effect).

**Basic Syntax:**
```tsx
import { TouchableOpacity } from 'react-native';

<TouchableOpacity
  onPress={() => console.log('Dabaya!')}
  activeOpacity={0.7}
>
  <Text>Yahan dabao</Text>
</TouchableOpacity>
```

**Humne kahan use kiya:**
- `app/welcome.tsx` — "Get Started" button
- `app/phone.tsx` — "Send OTP" button, disabled state jab number chota ho
- `app/otp.tsx` — "Verify" button, "Resend OTP" link
- `app/home.tsx` — Menu icon, drawer items

**Key Props:**
| Prop | Description |
|------|-------------|
| `onPress` | Tap karne par function |
| `activeOpacity` | Press pe opacity (0-1, default 0.2) |
| `disabled` | Button disable karo |
| `style` | Container styling |

**Disabled button example — `app/phone.tsx`:**
```tsx
<TouchableOpacity
  onPress={handleSendOTP}
  disabled={phone.length < 11}
  style={[
    styles.button,
    phone.length < 11 && styles.buttonDisabled
  ]}
>
  <Text>Send OTP</Text>
</TouchableOpacity>
```

---

### `Animated.View`

**Kya hai?**  
`Animated.View` normal `View` jaisa hi hai lekin isko animate kar sakte hain — move karna, fade karna, scale karna.

**Basic Syntax:**
```tsx
import { Animated } from 'react-native';

const opacity = useRef(new Animated.Value(0)).current;

Animated.timing(opacity, {
  toValue: 1,
  duration: 800,
  useNativeDriver: true,
}).start();

<Animated.View style={{ opacity }}>
  <Text>Main fade hoke aaya!</Text>
</Animated.View>
```

**Humne kahan use kiya:**
- `app/index.tsx` — Splash screen mein logo fade-in + slide-up
- `app/home.tsx` — Side drawer slide animation

> Detail `Animation System` section mein hai.

---

### `StyleSheet`

**Kya hai?**  
React Native mein styles CSS ki jagah JavaScript objects mein likhte hain. `StyleSheet.create()` se styles organize aur optimize hoti hain.

**Basic Syntax:**
```tsx
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
});

// Use:
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>
```

**Multiple styles combine karna:**
```tsx
// Array syntax se multiple styles merge hoti hain
<View style={[styles.button, isDisabled && styles.buttonDisabled]} />
```

**CSS vs React Native Styles:**
| CSS | React Native |
|-----|--------------|
| `background-color` | `backgroundColor` (camelCase) |
| `font-size: 16px` | `fontSize: 16` (no px) |
| `border-radius: 8px` | `borderRadius: 8` |
| `display: flex` | Default hi flex hai |
| `flex-direction: row` | `flexDirection: 'row'` |

---

### `Dimensions`

**Kya hai?**  
Device ki screen ka width aur height pata karne ke liye.

**Basic Syntax:**
```tsx
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
// width: screen ki chaurai
// height: screen ki unchai
```

**Humne kahan use kiya — `app/home.tsx`:**
```tsx
const DRAWER_WIDTH = Dimensions.get('window').width * 0.75;
// Drawer screen ka 75% wide hoga
```

**`window` vs `screen`:**
- `window` — usable area (status bar minus)
- `screen` — poori physical screen

---

## 2. React Hooks

Hooks React functions hain jo functional components mein state aur lifecycle manage karte hain.

### `useState`

**Kya hai?**  
Component mein data/state store karne ke liye. Jab state change ho, component re-render hota hai.

**Basic Syntax:**
```tsx
import { useState } from 'react';

const [value, setValue] = useState(initialValue);
//     ^         ^               ^
//   current   update fn    starting value
```

**Humne kahan use kiya:**

```tsx
// app/phone.tsx — phone number track karna
const [phone, setPhone] = useState('');

// app/otp.tsx — OTP digits aur timer
const [otp, setOtp] = useState(['', '', '', '']);
const [timer, setTimer] = useState(30);
const [canResend, setCanResend] = useState(false);

// app/home.tsx — location aur drawer state
const [location, setLocation] = useState(null);
const [drawerOpen, setDrawerOpen] = useState(false);
const [fromText, setFromText] = useState('');
const [toText, setToText] = useState('');
```

**Array state update karna (OTP example):**
```tsx
const updateOtp = (index: number, value: string) => {
  const newOtp = [...otp]; // Copy banao
  newOtp[index] = value;   // Update karo
  setOtp(newOtp);           // Set karo
};
```

---

### `useEffect`

**Kya hai?**  
Side effects run karne ke liye — API calls, timers, subscriptions, etc. Component render hone ke baad chalti hai.

**Basic Syntax:**
```tsx
import { useEffect } from 'react';

useEffect(() => {
  // Yahan side effect likhte hain

  return () => {
    // Cleanup (optional) — component unmount pe chalti hai
  };
}, [dependency]); // Dependency array
```

**Dependency Array ke cases:**
```tsx
useEffect(() => { ... });           // Har render pe chalegi
useEffect(() => { ... }, []);       // Sirf ek baar (mount pe)
useEffect(() => { ... }, [value]);  // Jab 'value' change ho tab
```

**Humne kahan use kiya:**

```tsx
// app/index.tsx — Splash animation shuru karna
useEffect(() => {
  Animated.parallel([fadeAnim, slideAnim]).start(() => {
    router.replace('/welcome'); // Animation khatam hone par navigate
  });
}, []); // Sirf ek baar

// app/otp.tsx — Timer countdown
useEffect(() => {
  if (timer === 0) {
    setCanResend(true);
    return;
  }
  const interval = setInterval(() => {
    setTimer((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(interval); // Cleanup!
}, [timer]);

// app/home.tsx — Location permission maangna
useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync();
      setLocation(loc.coords);
    }
  })();
}, []);
```

---

### `useRef`

**Kya hai?**  
Ek "box" hai jo value store karta hai lekin change hone par re-render **nahi** karta.  
2 main uses:
1. DOM/Component ka reference rakhna (focus, scroll, etc.)
2. Animated values store karna

**Basic Syntax:**
```tsx
import { useRef } from 'react';

const myRef = useRef(initialValue);
// Access: myRef.current
// Update: myRef.current = newValue (re-render nahi hoga)
```

**Humne kahan use kiya:**

```tsx
// app/otp.tsx — TextInput refs for focus management
const ref1 = useRef<TextInput>(null);
const ref2 = useRef<TextInput>(null);
// ...
ref2.current?.focus(); // Programmatically focus karna

// app/index.tsx — Animation values
const fadeAnim = useRef(new Animated.Value(0)).current;
const slideAnim = useRef(new Animated.Value(50)).current;

// app/home.tsx — Drawer animation
const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
```

**useState vs useRef:**
| | useState | useRef |
|--|---------|--------|
| Re-render | Haan | Nahi |
| Use case | UI data | DOM refs, animations |
| Access | `value` | `ref.current` |

---

## 3. Expo APIs & Libraries

### `expo-router`

**Kya hai?**  
File-based navigation system. Jaise Next.js mein pages hote hain, waise hi `app/` folder ki files routes ban jaati hain.

**Humara routing structure:**
```
app/
├── _layout.tsx   → Root layout (Stack navigator)
├── index.tsx     → Route: /         (Splash)
├── welcome.tsx   → Route: /welcome  (Welcome)
├── phone.tsx     → Route: /phone    (Phone entry)
├── otp.tsx       → Route: /otp      (OTP verify)
└── home.tsx      → Route: /home     (Main app)
```

**Navigation methods:**
```tsx
import { router } from 'expo-router';

router.push('/phone');      // Navigate karo (history mein add)
router.replace('/home');    // Navigate karo (history replace)
router.back();              // Peeche jao
```

**Stack Layout — `app/_layout.tsx`:**
```tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
```

---

### `expo-status-bar`

**Kya hai?**  
Phone ke status bar (time, battery, signal) ka style control karna.

**Humne kahan use kiya — `app/_layout.tsx`, `app/index.tsx`:**
```tsx
import { StatusBar } from 'expo-status-bar';

<StatusBar style="light" />  // White icons (dark background ke liye)
<StatusBar style="dark" />   // Black icons (light background ke liye)
<StatusBar hidden />          // Status bar chhupao
```

---

### `expo-location`

**Kya hai?**  
Device ki GPS location lene ke liye. Permission maangna zaroori hai.

**Humne kahan use kiya — `app/home.tsx`:**
```tsx
import * as Location from 'expo-location';

// Step 1: Permission maango
const { status } = await Location.requestForegroundPermissionsAsync();

// Step 2: Location lo
if (status === 'granted') {
  const location = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = location.coords;
}
```

**`foreground` vs `background` permission:**
- `Foreground` — App open hone par location
- `Background` — App band hone par bhi location (sensitive permission)

---

### `@expo/vector-icons` — Ionicons

**Kya hai?**  
Ready-made icons ki library. Ionicons set mein 1000+ icons hain.

**Humne kahan use kiya — `components/GlidoLogo.tsx`, `app/home.tsx`:**
```tsx
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="car-sport" size={32} color="#FFD700" />
<Ionicons name="menu" size={24} color="#fff" />
<Ionicons name="location" size={20} color="#6C63FF" />
```

**Icons browse karne ke liye:** [icons.expo.fyi](https://icons.expo.fyi)

---

## 4. Third-Party Libraries

### `react-native-maps`

**Kya hai?**  
Google Maps / Apple Maps ko React Native mein use karne ke liye.

**Humne kahan use kiya — `app/home.tsx`:**
```tsx
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

<MapView
  provider={PROVIDER_DEFAULT}
  style={{ flex: 1 }}
  showsUserLocation={true}
  region={{
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,   // Zoom level
    longitudeDelta: 0.01,
  }}
>
  <Marker
    coordinate={{ latitude, longitude }}
    title="Aap yahan hain"
  />
</MapView>
```

**Key Props:**
| Prop | Description |
|------|-------------|
| `region` | Map center aur zoom |
| `showsUserLocation` | Blue dot user ka location |
| `provider` | PROVIDER_GOOGLE ya DEFAULT |
| `onRegionChange` | Map move hone par callback |

---

## 5. Animation System

React Native ka `Animated` API use karke smooth animations banate hain.

### Animation ke Steps:

**Step 1 — Animated value banao:**
```tsx
const fadeAnim = useRef(new Animated.Value(0)).current;
// 0 = fully transparent
```

**Step 2 — Animation define karo:**
```tsx
// Timing — linear, fixed duration
Animated.timing(fadeAnim, {
  toValue: 1,        // End value
  duration: 800,     // Milliseconds
  useNativeDriver: true, // GPU se fast
})

// Spring — natural bounce effect
Animated.spring(drawerAnim, {
  toValue: 0,
  useNativeDriver: true,
})
```

**Step 3 — Start karo:**
```tsx
Animated.timing(fadeAnim, { ... }).start(() => {
  // Animation khatam hone ke baad
  console.log('Done!');
});
```

**Step 4 — Animated.View pe apply karo:**
```tsx
<Animated.View style={{ opacity: fadeAnim }}>
  <Text>Main fade hoke aaya!</Text>
</Animated.View>
```

### Multiple animations ek saath:

```tsx
// Parallel — dono ek saath chalein
Animated.parallel([
  Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
  Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
]).start();

// Sequence — ek ke baad ek
Animated.sequence([
  Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
  Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
]).start();
```

### Humara Splash Animation — `app/index.tsx`:
```tsx
// Logo pehle invisible hai aur neeche hai
const fadeAnim = useRef(new Animated.Value(0)).current;
const slideAnim = useRef(new Animated.Value(50)).current;

// Dono ek saath chalein — fade in + slide up
Animated.parallel([
  Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
  Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
]).start(() => {
  router.replace('/welcome');
});

<Animated.View style={{
  opacity: fadeAnim,
  transform: [{ translateY: slideAnim }]
}}>
  <GlidoLogo />
</Animated.View>
```

### Humara Drawer Animation — `app/home.tsx`:
```tsx
const DRAWER_WIDTH = Dimensions.get('window').width * 0.75;
const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

// Open karna
Animated.spring(drawerAnim, {
  toValue: 0,
  useNativeDriver: true,
}).start();

// Close karna
Animated.timing(drawerAnim, {
  toValue: -DRAWER_WIDTH,
  duration: 250,
  useNativeDriver: true,
}).start();

<Animated.View style={{
  transform: [{ translateX: drawerAnim }],
  width: DRAWER_WIDTH,
  position: 'absolute',
  left: 0,
}}>
  {/* Drawer content */}
</Animated.View>
```

---

## 6. Styling in React Native

React Native mein CSS nahi hoti — JavaScript objects mein style likhte hain.

### Flexbox Layout

React Native **default hi flex** mein hai. Koi `display: flex` nahi likhna.

```tsx
// Column (default) — children upar se neeche
<View style={{ flexDirection: 'column' }}>

// Row — children left se right
<View style={{ flexDirection: 'row' }}>

// Center karna
<View style={{ justifyContent: 'center', alignItems: 'center' }}>

// Space between
<View style={{ justifyContent: 'space-between' }}>

// Poora space lena
<View style={{ flex: 1 }}>
```

### Position

```tsx
// Absolute position — parent ke relative
<View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>

// Koi element dusre ke upar rakhna
<View style={{ position: 'absolute', zIndex: 10 }}>
```

### Shadow (Platform specific)

```tsx
// iOS shadow
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.25,
shadowRadius: 4,

// Android shadow
elevation: 5,

// Dono platform ke liye:
...Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25 },
  android: { elevation: 5 },
})
```

---

## 7. Event Handlers & Props

### Common Event Handlers

| Handler | Component | Description |
|---------|-----------|-------------|
| `onPress` | TouchableOpacity | Tap karna |
| `onChangeText` | TextInput | Text type karna |
| `onKeyPress` | TextInput | Key press (backspace detect) |
| `onLayout` | View | Size/position change |
| `onFocus` | TextInput | Input focused hona |
| `onBlur` | TextInput | Input blur hona |

### `onKeyPress` — Backspace detect karna

OTP input mein backspace pe previous field pe jaane ke liye:

```tsx
<TextInput
  onKeyPress={({ nativeEvent }) => {
    if (nativeEvent.key === 'Backspace' && otp[index] === '') {
      refs[index - 1]?.current?.focus();
    }
  }}
/>
```

---

## 8. Custom Components

### `GlidoLogo` — `components/GlidoLogo.tsx`

Custom component banane ka pattern — props accept karna, reusable banana.

```tsx
interface GlidoLogoProps {
  size?: 'small' | 'large';
}

export default function GlidoLogo({ size = 'large' }: GlidoLogoProps) {
  const isLarge = size === 'large';
  return (
    <View style={styles.container}>
      <Ionicons
        name="car-sport"
        size={isLarge ? 60 : 32}
        color="#FFD700"
      />
      <Text style={[styles.text, isLarge && styles.textLarge]}>
        Glido
      </Text>
    </View>
  );
}
```

**Use karna:**
```tsx
<GlidoLogo />              // Large (default)
<GlidoLogo size="small" /> // Small version
```

**Custom component ke fayde:**
- Ek jagah se code manage hota hai
- Har jagah same design rehta hai
- Props se flexible banana

---

## 9. App Architecture & Navigation

### Expo Router — File-based Routing

```
app/
├── _layout.tsx   ← Sab screens ka parent (Stack navigator)
├── index.tsx     ← / (Splash screen, auto-redirect)
├── welcome.tsx   ← /welcome
├── phone.tsx     ← /phone
├── otp.tsx       ← /otp
└── home.tsx      ← /home
```

### Navigation Flow

```
Splash (index) 
    ↓ (animation ke baad, router.replace)
Welcome
    ↓ (Get Started, router.push)
Phone Entry
    ↓ (Send OTP, router.push)
OTP Verify
    ↓ (Verify, router.replace)
Home (Main App)
```

### `push` vs `replace` kab use karein:

```tsx
router.push('/phone');    // Back button se wapas aa sakte hain
router.replace('/home');  // Back nahi ja sakte (splash pe wapas nahi jaana)
```

### Screen Options

```tsx
// _layout.tsx mein header chhupana
<Stack screenOptions={{ headerShown: false }} />

// Ya specific screen ke liye
<Stack.Screen name="home" options={{ headerShown: false }} />
```

---

## Quick Reference

### Import Cheat Sheet

```tsx
// React Native core
import { View, Text, TextInput, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';

// React hooks
import { useState, useEffect, useRef } from 'react';

// Expo Router
import { router } from 'expo-router';
import { Stack } from 'expo-router';

// Expo APIs
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Maps
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
```

---

*Yeh guide Glido App ke actual code se banai gayi hai. Har concept aap ne khud use kiya hai!*
