# Fastify — Glido Backend ka Dil

---

## 1. Fastify Kya Hai?

Fastify ek **web framework** hai jo Node.js ke upar chalta hai.

Jab aapka React Native app kuch maangta hai — jaise "yeh OTP verify karo" ya "nearby drivers do" — toh wo request kisi **server** pe jaati hai. Woh server handle karne ke liye Fastify use hota hai.

```
Rider App  →  "OTP verify karo"  →  Fastify Server  →  DB check  →  "✅ Sahi hai"
```

---

## 2. Problem Kya Thi? Fastify Kyun Aaya?

### Pehle Express tha (sabse popular framework)
Express bahut purana hai (2010). Kaam karta hai lekin:

| Masla | Detail |
|-------|--------|
| Slow | 15,000 req/sec handle karta hai |
| No validation | Aap khud check karo k data sahi aya ya nahi |
| No TypeScript | Types likhne mein takleef |
| Old patterns | Modern async/await ke saath awkward |

### Fastify ne kya solve kiya?

| Feature | Express | Fastify |
|---------|---------|---------|
| Speed | 15k req/sec | **30k+ req/sec** |
| JSON parsing | Slow | **4x faster** |
| Input validation | Manually karo | **Built-in (JSON Schema)** |
| TypeScript | Baad mein add kiya | **Day 1 se support** |
| Error handling | Manual | **Auto structured errors** |
| Plugins | Ad-hoc | **Clean lifecycle hooks** |

**Ride-hailing app mein yeh matter karta hai** — jab 500 drivers ek saath location update bhejein, server slow nahi hona chahiye.

---

## 3. Glido Mein Fastify Kya Kaam Karega?

Har cheez jo app ko server se chahiye, woh Fastify handle karega:

```
┌─────────────────────────────────────────────────────┐
│                  Fastify Server                      │
├──────────────────────────────────────────────────────┤
│  POST /auth/send-otp       ← Phone number bhejo      │
│  POST /auth/verify-otp     ← OTP verify karo         │
│                                                      │
│  GET  /drivers/nearby      ← Nearby drivers laao     │
│  POST /trips/book          ← Ride book karo          │
│  PUT  /trips/:id/accept    ← Driver accept kare      │
│  PUT  /trips/:id/complete  ← Trip complete           │
│                                                      │
│  GET  /user/profile        ← Profile info            │
│  POST /payments/initiate   ← JazzCash payment        │
│  POST /ratings/submit      ← Rating do               │
└──────────────────────────────────────────────────────┘
```

---

## 4. Code Kaise Hota Hai — Step by Step

### Setup

```bash
mkdir glido-backend
cd glido-backend
npm init -y
npm install fastify @fastify/cors @fastify/jwt dotenv
npm install -D typescript @types/node ts-node
```

### Basic Server

```typescript
// src/server.ts
import Fastify from 'fastify'

const app = Fastify({
  logger: true  // Console mein requests log hoti hain
})

// Server start
app.listen({ port: 3000 }, (err) => {
  if (err) throw err
  console.log('Glido server chal raha hai: http://localhost:3000')
})
```

---

### Route — Seedha Simple

```typescript
// GET request — kuch data maango
app.get('/ping', async (request, reply) => {
  return { message: 'Server theek hai!' }
})

// POST request — kuch data bhejo
app.post('/auth/send-otp', async (request, reply) => {
  const { phone } = request.body as { phone: string }
  // SMS bhejo...
  return { success: true, message: 'OTP bhej diya' }
})
```

---

### Validation — Input Check (Fastify ka superpower)

```typescript
// Yeh schema define karo — Fastify automatically validate karega
const sendOtpSchema = {
  body: {
    type: 'object',
    required: ['phone'],
    properties: {
      phone: {
        type: 'string',
        pattern: '^03[0-9]{9}$'  // Pakistan format: 03xxxxxxxxx
      }
    }
  }
}

app.post('/auth/send-otp', { schema: sendOtpSchema }, async (request, reply) => {
  const { phone } = request.body as { phone: string }
  // Yahan tak aaya matlab phone number sahi hai — Fastify ne check kar liya
  return { success: true }
})

// Agar galat number aaye:
// { error: "Bad Request", message: "phone must match pattern" }
// Yeh khud Fastify deta hai — aapko kuch likhna nahi
```

---

### JWT Auth — Protected Routes

```typescript
import fastifyJwt from '@fastify/jwt'

// JWT plugin register karo
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!
})

// Middleware — token check karo
app.addHook('onRequest', async (request, reply) => {
  // Public routes skip karo
  const publicRoutes = ['/auth/send-otp', '/auth/verify-otp']
  if (publicRoutes.includes(request.url)) return

  try {
    await request.jwtVerify()  // Token valid hai ya nahi
  } catch (err) {
    reply.status(401).send({ error: 'Login karo pehle' })
  }
})

// Protected route — sirf logged in user access kar sakta
app.get('/user/profile', async (request, reply) => {
  const user = request.user as { id: string; phone: string }
  return { id: user.id, phone: user.phone }
})
```

---

### Plugins — Code Organize karne ka tarika

Fastify mein har feature alag plugin mein likhte hain:

```typescript
// src/plugins/auth.ts
import { FastifyInstance } from 'fastify'

export default async function authPlugin(app: FastifyInstance) {

  // OTP bhejo
  app.post('/send-otp', async (request, reply) => {
    const { phone } = request.body as { phone: string }
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    // Redis mein save karo 60 seconds ke liye
    await redis.set(`otp:${phone}`, otp, 'EX', 60)
    // SMS bhejo 2factor.in se
    await sendSms(phone, `Aapka Glido OTP: ${otp}`)
    return { success: true }
  })

  // OTP verify karo
  app.post('/verify-otp', async (request, reply) => {
    const { phone, otp } = request.body as { phone: string; otp: string }
    const savedOtp = await redis.get(`otp:${phone}`)

    if (!savedOtp || savedOtp !== otp) {
      return reply.status(400).send({ error: 'OTP galat hai ya expire ho gaya' })
    }

    // User create ya fetch karo Supabase se
    const token = app.jwt.sign({ phone }, { expiresIn: '30d' })
    return { token }
  })
}
```

```typescript
// src/server.ts — plugin register karo
app.register(authPlugin, { prefix: '/auth' })
// Ab routes: /auth/send-otp, /auth/verify-otp
```

---

### Error Handling — Sab jagah kaam karta hai

```typescript
// Global error handler
app.setErrorHandler((error, request, reply) => {
  console.error(error)

  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.message
    })
  }

  reply.status(500).send({
    error: 'Server mein masla aa gaya, dobara try karo'
  })
})
```

---

## 5. Glido Ka Complete Backend Structure

```
glido-backend/
├── src/
│   ├── server.ts              ← Entry point, server start
│   ├── plugins/
│   │   ├── auth.ts            ← OTP send/verify, JWT
│   │   ├── trips.ts           ← Book, accept, complete ride
│   │   ├── drivers.ts         ← Nearby drivers, location
│   │   ├── payments.ts        ← JazzCash/EasyPaisa
│   │   └── ratings.ts         ← Star ratings
│   ├── services/
│   │   ├── sms.ts             ← 2factor.in wrapper
│   │   ├── redis.ts           ← Location cache
│   │   └── supabase.ts        ← DB queries
│   └── types/
│       └── index.ts           ← TypeScript types
├── .env                       ← Secrets (JWT, API keys)
├── package.json
└── tsconfig.json
```

---

## 6. React Native App Se Fastify Ko Call Karna

```typescript
// app/phone.tsx mein — OTP bhejne ke liye
const sendOtp = async (phone: string) => {
  const response = await fetch('http://localhost:3000/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
  const data = await response.json()
  if (data.success) router.push('/otp')
}
```

---

## 7. Quick Reference — Yaad Rakhne Wali Baatein

| Cheez | Code |
|-------|------|
| GET route | `app.get('/path', handler)` |
| POST route | `app.post('/path', handler)` |
| URL parameter | `app.get('/trip/:id', ...)` → `request.params.id` |
| Request body | `request.body` |
| Query string | `request.query` |
| Headers | `request.headers` |
| Response code | `reply.status(201).send(data)` |
| Plugin register | `app.register(plugin, { prefix: '/auth' })` |
| Validation | `{ schema: { body: {...} } }` as route option |

---

## 8. Fastify vs Express — Ek Last Comparison

```javascript
// Express — purana tarika
app.post('/otp', (req, res) => {
  if (!req.body.phone) return res.status(400).json({ error: 'phone chahiye' })
  if (req.body.phone.length !== 11) return res.status(400).json({ error: 'galat number' })
  // Aap khud validate karte ho
})

// Fastify — modern tarika
app.post('/otp', { schema: otpSchema }, async (req, reply) => {
  // Schema ne already validate kar diya — seedha logic likho
})
```

Fastify mein **boilerplate (repetitive code) kam** hai, **speed zyada** hai, aur **errors clear** hain.

---

## Related Docs
- [authentication-explained.md](./authentication-explained.md) — OTP + JWT ka full flow
- [supabase-explained.md](./supabase-explained.md) — Database integration

---

---

# CRUD + JWT — Mukammal Guide

---

## CRUD Kya Hai?

Har app mein basically 4 kaam hote hain:

| Letter | Kaam | HTTP Method | Example |
|--------|------|-------------|---------|
| **C** — Create | Naya record banao | `POST` | Naya trip book karo |
| **R** — Read | Data laao | `GET` | Trip history dekho |
| **U** — Update | Record badlo | `PUT` / `PATCH` | Trip status update karo |
| **D** — Delete | Record mitao | `DELETE` | Account delete karo |

---

## JWT Kya Hai aur CRUD se Kaise Jura Hai?

```
Login karo → Server JWT token deta hai → Aap har request mein token bhejte ho → Server verify karta hai
```

```
App                          Fastify Server
 │                                │
 │── POST /auth/verify-otp ──────▶│
 │                                │── OTP check karo
 │◀── { token: "eyJhbG..." } ─────│── Token banao
 │                                │
 │── GET /trips (+ token) ───────▶│
 │                                │── Token verify karo ✅
 │◀── [trip1, trip2, ...] ────────│── Data bhejo
 │                                │
 │── GET /trips (bina token) ────▶│
 │◀── 401 Unauthorized ───────────│── Reject
```

Token header mein bhejte hain:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 1 — JWT Setup (Ek baar karo)

```typescript
// src/server.ts
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'

const app = Fastify({ logger: true })

// JWT register karo
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!  // .env mein: JWT_SECRET=koi_bhi_lambi_string
})

// Decorator — kisi bhi route ko protect karne ke liye
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: 'Token nahi hai ya galat hai' })
  }
})

export default app
```

---

## Step 2 — Token Banana (Login ke waqt)

```typescript
// src/plugins/auth.ts
export default async function authPlugin(app: FastifyInstance) {

  app.post('/verify-otp', async (request, reply) => {
    const { phone, otp } = request.body as { phone: string; otp: string }

    const savedOtp = await redis.get(`otp:${phone}`)
    if (!savedOtp || savedOtp !== otp) {
      return reply.status(400).send({ error: 'OTP galat hai' })
    }

    // Supabase se user laao ya banao
    const { data: user } = await supabase
      .from('users')
      .upsert({ phone }, { onConflict: 'phone' })
      .select()
      .single()

    // JWT token banao — 30 din valid
    const token = app.jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      { expiresIn: '30d' }
    )

    return { token, user }
  })
}
```

---

## Step 3 — CRUD Routes (Trips Example — Glido ke liye)

Yeh Glido ka real example hai — trips ki CRUD with JWT protection.

```typescript
// src/plugins/trips.ts
import { FastifyInstance } from 'fastify'

// TypeScript types
interface TripBody {
  pickup_lat: number
  pickup_lng: number
  pickup_address: string
  dropoff_lat: number
  dropoff_lng: number
  dropoff_address: string
}

interface TripParams {
  id: string
}

export default async function tripsPlugin(app: FastifyInstance) {

  // ─────────────────────────────────────────────
  // CREATE — Naya trip book karo
  // POST /trips
  // ─────────────────────────────────────────────
  app.post<{ Body: TripBody }>(
    '/',
    {
      onRequest: [app.authenticate],  // ← JWT check — login zaroori
      schema: {
        body: {
          type: 'object',
          required: ['pickup_lat', 'pickup_lng', 'pickup_address', 'dropoff_lat', 'dropoff_lng', 'dropoff_address'],
          properties: {
            pickup_lat:       { type: 'number' },
            pickup_lng:       { type: 'number' },
            pickup_address:   { type: 'string' },
            dropoff_lat:      { type: 'number' },
            dropoff_lng:      { type: 'number' },
            dropoff_address:  { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const rider = request.user as { id: string }  // JWT se user id lo
      const { pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address } = request.body

      // Fare calculate karo (distance formula)
      const fare = calculateFare(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)

      // Supabase mein save karo
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({
          rider_id: rider.id,
          pickup_lat,
          pickup_lng,
          pickup_address,
          dropoff_lat,
          dropoff_lng,
          dropoff_address,
          fare,
          status: 'requested'
        })
        .select()
        .single()

      if (error) return reply.status(500).send({ error: 'Trip nahi bani' })

      return reply.status(201).send({ trip })  // 201 = Created
    }
  )

  // ─────────────────────────────────────────────
  // READ ALL — Apni saari trips dekho
  // GET /trips
  // ─────────────────────────────────────────────
  app.get(
    '/',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const rider = request.user as { id: string }

      const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .eq('rider_id', rider.id)      // Sirf apni trips
        .order('created_at', { ascending: false })  // Nai pehle

      if (error) return reply.status(500).send({ error: 'Data nahi mila' })

      return { trips }
    }
  )

  // ─────────────────────────────────────────────
  // READ ONE — Ek specific trip dekho
  // GET /trips/:id
  // ─────────────────────────────────────────────
  app.get<{ Params: TripParams }>(
    '/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const rider = request.user as { id: string }
      const { id } = request.params

      const { data: trip, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .eq('rider_id', rider.id)  // Dusre ki trip nahi dekh sakte
        .single()

      if (!trip) return reply.status(404).send({ error: 'Trip nahi mili' })

      return { trip }
    }
  )

  // ─────────────────────────────────────────────
  // UPDATE — Trip status badlo
  // PATCH /trips/:id
  // ─────────────────────────────────────────────
  app.patch<{ Params: TripParams; Body: { status: string } }>(
    '/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['cancelled']  // Rider sirf cancel kar sakta hai
            }
          }
        }
      }
    },
    async (request, reply) => {
      const rider = request.user as { id: string }
      const { id } = request.params
      const { status } = request.body

      // Pehle check karo trip exist karti hai aur is rider ki hai
      const { data: existing } = await supabase
        .from('trips')
        .select('status')
        .eq('id', id)
        .eq('rider_id', rider.id)
        .single()

      if (!existing) return reply.status(404).send({ error: 'Trip nahi mili' })

      // Already complete ya cancel trip nahi badal sakte
      if (['completed', 'cancelled'].includes(existing.status)) {
        return reply.status(400).send({ error: `Trip already ${existing.status} hai` })
      }

      const { data: trip } = await supabase
        .from('trips')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      return { trip }
    }
  )

  // ─────────────────────────────────────────────
  // DELETE — Trip record mitao (admin only)
  // DELETE /trips/:id
  // ─────────────────────────────────────────────
  app.delete<{ Params: TripParams }>(
    '/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as { id: string; role: string }

      // Sirf admin delete kar sakta hai
      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Permission nahi hai' })
      }

      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', request.params.id)

      if (error) return reply.status(500).send({ error: 'Delete nahi hua' })

      return reply.status(204).send()  // 204 = Deleted, koi body nahi
    }
  )
}
```

---

## Step 4 — Server mein Register karo

```typescript
// src/server.ts
import tripsPlugin from './plugins/trips'
import authPlugin from './plugins/auth'

app.register(authPlugin, { prefix: '/auth' })
app.register(tripsPlugin, { prefix: '/trips' })

// Ab yeh routes available hain:
// POST   /auth/send-otp
// POST   /auth/verify-otp
// POST   /trips          ← Create
// GET    /trips          ← Read All
// GET    /trips/:id      ← Read One
// PATCH  /trips/:id      ← Update
// DELETE /trips/:id      ← Delete
```

---

## Step 5 — React Native Se Call Karna (Token ke saath)

```typescript
// utils/api.ts — Reusable API helper
const BASE_URL = 'http://your-server.com'

export async function apiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: object
) {
  const token = await AsyncStorage.getItem('token')  // Stored token

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ← Har request mein token
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (response.status === 401) {
    // Token expire — login pe bhejo
    router.replace('/welcome')
    return
  }

  return response.json()
}
```

```typescript
// app/home.tsx mein use karo
import { apiCall } from '@/utils/api'

// Trip book karo
const bookRide = async () => {
  const result = await apiCall('/trips', 'POST', {
    pickup_lat: 31.5204,
    pickup_lng: 74.3587,
    pickup_address: 'Lahore, Gulberg',
    dropoff_lat: 31.4697,
    dropoff_lng: 74.2728,
    dropoff_address: 'Lahore, DHA Phase 5'
  })
  console.log('Trip bani:', result.trip)
}

// Trip history dekho
const getTripHistory = async () => {
  const result = await apiCall('/trips')
  console.log('Meri trips:', result.trips)
}

// Trip cancel karo
const cancelTrip = async (tripId: string) => {
  const result = await apiCall(`/trips/${tripId}`, 'PATCH', {
    status: 'cancelled'
  })
  console.log('Trip cancel:', result.trip)
}
```

---

## HTTP Status Codes — Quick Reference

| Code | Matlab | Kab use karo |
|------|--------|--------------|
| `200` | OK | Normal GET/PATCH success |
| `201` | Created | POST se naya record bana |
| `204` | No Content | DELETE success |
| `400` | Bad Request | Galat input / validation fail |
| `401` | Unauthorized | Token nahi / galat |
| `403` | Forbidden | Token sahi lekin permission nahi |
| `404` | Not Found | Record nahi mila |
| `500` | Server Error | Kuch toot gaya server pe |

---

## CRUD Flow — Ek Nazar Mein

```
                    React Native App
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    POST /trips      GET /trips     PATCH /trips/:id
    (Book ride)    (History dekho)  (Cancel karo)
          │               │               │
          └───────────────┼───────────────┘
                          │
                   Fastify Server
                  (JWT verify karo)
                          │
                   Supabase DB
                  (Data save/fetch)
```
