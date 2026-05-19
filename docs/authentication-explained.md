# Authentication — Poori Tafseel (Roman Urdu)

---

## Sabse Pehle — OTP Ka Maalik Kaun Hai?

Yeh sabse important sawaal hai.

> **Supabase OTP generate karta hai, store karta hai, aur verify bhi karta hai.**
> 2Factor.in sirf SMS delivery ka kaam karta hai — ek postman ki tarah.

```
Supabase = OTP ka maalik
2Factor.in = SMS delivery wala postman
```

---

## Poora Flow — Step by Step

```
Step 1: User phone number enter karta hai
              ↓
Step 2: App → Supabase ko request: "is number pe OTP bhejo"
              ↓
Step 3: Supabase khud OTP generate karta hai
        (maan lo: 4821)
        Aur apne database mein save karta hai:
        { phone: '+923001234567', otp: '4821', expires_at: 10 min }
              ↓
Step 4: Supabase tumhara backend webhook call karta hai:
        POST https://tumhara-api.com/sms-webhook
        { phone: '+923001234567', otp: '4821' }
              ↓
Step 5: Tumhara backend 2Factor.in ko call karta hai:
        "is number pe 4821 bhejo"
              ↓
Step 6: 2Factor.in SMS bhejta hai → User ke phone pe: "4821"
              ↓
Step 7: User 4821 enter karta hai → App Supabase ko bhejta hai
              ↓
Step 8: Supabase check karta hai:
        "Maine 4821 is number ke liye store kiya tha? Haan!"
        "Time expire hua? Nahi!"
        → Verify ✅
              ↓
Step 9: Supabase JWT token deta hai → User logged in
```

---

## Webhook Kyun Hai Beech Mein?

Yeh sawaal zaruri hai.

Supabase seedha 2Factor.in ko kyun nahi call karta?

```
Supabase nahi jaanta ke tum konsa SMS provider use karte ho.
Twilio? 2Factor.in? MSG91? Apna custom?

Isliye Supabase kehta hai:
"Mujhe nahi pata SMS kaise bhejna — tum batao apna webhook"
"Main OTP tumhare webhook pe bhejunga, baaki tum sambhalo"
```

Webhook ek middleman hai:

```
Supabase → [Webhook: tumhara code] → 2Factor.in → SMS
```

---

## Supabase Ko OTP Kaise Pata Chala?

Yahi tumhara sawaal tha — bilkul sahi.

```
Supabase ne khud OTP banaya tha (4821)
Supabase ne khud apne database mein rakha tha
Webhook mein bhi Supabase ne hi 4821 bheja tha

Jab user ne 4821 submit kiya:
Supabase ne apni hi table mein check kiya
"Haan, maine yeh generate kiya tha, match ho gaya" ✅
```

2Factor.in ko OTP verify karne se koi lena dena nahi.
Woh sirf SMS deliver karta hai — bas.

---

## Simple Analogy

```
Supabase = Exam controller
           - Paper set karta hai (OTP generate)
           - Answer key apne paas rakhta hai (DB mein store)
           - Papers distribute karta hai (webhook call)
           - Answer check karta hai (verify)

2Factor.in = Delivery boy
           - Papers students tak pohanchata hai (SMS)
           - Use nahi pata answers kya hain
           - Use sirf deliver karna hai
```

---

## JWT Token Kya Hota Hai?

OTP verify hone ke baad Supabase JWT token deta hai.

```
JWT = Ek digital ID card

Jaise:
Passport mein likha hota hai:
- Naam, date of birth, country
- Expiry date
- Government ki seal (fake nahi ho sakta)

JWT mein hota hai:
- User ID, phone number
- Token kab expire hoga
- Supabase ki signature (fake nahi ho sakta)
```

### JWT Kaise Kaam Karta Hai:

```
Login hone ke baad:
JWT token → phone pe secure storage mein save

Har API call pe:
App → JWT token sath bhejti hai
Backend → JWT verify karta hai (Supabase se)
Backend → "haan yeh valid user hai" → response deta hai
```

Token expire hone ke baad dobara login ya auto-refresh.

---

## Session Kya Hota Hai?

```
Session = Login ki yaad

Login kiya → Session bana
App band ki → Session phone mein stored raha
App dobara kholi → Session check hua → Auto login ✅
Session expire hua (7 din) → Dobara OTP mangega
```

Supabase session automatically refresh karta rehta hai jab tak user active hai.

---

## Security — OTP Abuse Kaise Rokein?

Agar koi bot har second OTP maange toh?

```
Rate Limiting lagao:
- Ek number se max 3 OTP per hour
- Ek IP se max 10 OTP per hour
- Galat OTP 5 baar → 30 min block
```

Yeh Supabase dashboard mein configure hota hai ya tumhara backend handle karta hai.

---

## OTP Expiry

Supabase default: **10 minutes**

```
OTP generate hua → 10 minute ki countdown
10 minute ke andar enter karo → ✅
10 minute baad enter karo → ❌ "OTP expired"
Resend karna hoga
```

Yeh time Supabase dashboard mein change ho sakta hai.

---

## Development Mein OTP Kaise Test Karein (Free)

Real SMS bhejne ki zaroorat nahi development mein:

```
Supabase Dashboard
→ Authentication → Settings
→ "Enable phone confirmations" OFF karo

Ab test OTP: 000000 (ya jo bhi set karo)
Koi SMS nahi jayega, 2Factor.in ki zaroorat nahi
```

Sirf production mein real SMS hoga.

---

## Poora System Ek Nazar Mein

```
┌─────────────┐     signInWithOtp()      ┌─────────────┐
│             │ ─────────────────────── ▶ │             │
│  Rider App  │                           │  Supabase   │
│             │ ◀ ─────────────────────── │    Auth     │
└─────────────┘      JWT token            │             │
                                          │  OTP store  │
                                          └──────┬──────┘
                                                 │ webhook call
                                                 ▼
                                          ┌─────────────┐
                                          │  Tumhara    │
                                          │  Backend    │
                                          └──────┬──────┘
                                                 │ SMS API call
                                                 ▼
                                          ┌─────────────┐
                                          │ 2Factor.in  │
                                          │  (SMS bheja)│
                                          └──────┬──────┘
                                                 │ SMS
                                                 ▼
                                          ┌─────────────┐
                                          │  User Phone │
                                          │   "4821"    │
                                          └─────────────┘
```

---

## Summary — 5 Points Yaad Rakho

1. **Supabase OTP banata hai** — 2Factor.in nahi
2. **Supabase OTP apne paas rakhta hai** — DB mein
3. **2Factor.in sirf delivery karta hai** — SMS postman
4. **Webhook beech ka middleman hai** — Supabase → Tumhara code → 2Factor.in
5. **JWT = Login ka proof** — har API call mein sath jaata hai
