# Express vs Fastify — Side by Side CRUD + JWT

Dono mein same kaam hota hai — sirf tarika alag hai.
Glido ke context mein trips ki CRUD use karke compare karenge.

---

## 1. Setup aur Server Start

### Express
```typescript
import express from 'express'
import jwt from 'jsonwebtoken'

const app = express()
app.use(express.json())  // Body parse karne ke liye manually lagana parta hai

app.listen(3000, () => console.log('Server chala'))
```

### Fastify
```typescript
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'

const app = Fastify({ logger: true })  // Logger built-in
app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })

app.listen({ port: 3000 })
```

**Farq:** Fastify mein body parsing aur logging automatically hoti hai. Express mein `app.use()` se khud lagana parta hai.

---

## 2. JWT Token Banana (Login)

### Express
```typescript
app.post('/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body

  // Manually validate karo
  if (!phone || !otp) {
    return res.status(400).json({ error: 'phone aur otp chahiye' })
  }

  // OTP check karo...
  const savedOtp = redis.get(`otp:${phone}`)
  if (savedOtp !== otp) {
    return res.status(400).json({ error: 'OTP galat hai' })
  }

  // Token banao — khud jsonwebtoken use karo
  const token = jwt.sign(
    { id: user.id, phone },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  )

  res.json({ token })
})
```

### Fastify
```typescript
app.post('/auth/verify-otp', {
  schema: {
    body: {
      type: 'object',
      required: ['phone', 'otp'],   // Validation automatic — 400 khud aayega
      properties: {
        phone: { type: 'string' },
        otp:   { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { phone, otp } = request.body as { phone: string; otp: string }

  const savedOtp = await redis.get(`otp:${phone}`)
  if (savedOtp !== otp) {
    return reply.status(400).send({ error: 'OTP galat hai' })
  }

  // Token banao — app.jwt use karo (registered plugin)
  const token = app.jwt.sign(
    { id: user.id, phone },
    { expiresIn: '30d' }
  )

  return { token }
})
```

**Farq:** Fastify mein `schema` dene se validation khud hoti hai. Express mein `if (!phone)` type checks khud likhne padte hain.

---

## 3. JWT Middleware — Token Verify Karo

Yeh sabse important farq hai.

### Express — Global Middleware
```typescript
// Middleware function alag banao
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ error: 'Token nahi hai' })
  }

  const token = authHeader.split(' ')[1]  // "Bearer TOKEN" se TOKEN nikalo

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded  // Manually req pe daal do
    next()              // Agla middleware/route chalne do
  } catch (err) {
    return res.status(401).json({ error: 'Token galat hai' })
  }
}

// Har protected route pe lagao
app.get('/trips', authenticate, (req, res) => { ... })
app.post('/trips', authenticate, (req, res) => { ... })
app.patch('/trips/:id', authenticate, (req, res) => { ... })
```

### Fastify — Decorator + onRequest Hook
```typescript
// Ek baar decorator banao
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
    // ↑ Yeh khud header se token uthata hai
    // ↑ Verify karta hai
    // ↑ request.user mein daal deta hai
  } catch (err) {
    reply.status(401).send({ error: 'Token galat hai' })
  }
})

// Route pe sirf naam do
app.get('/trips', { onRequest: [app.authenticate] }, async (request, reply) => { ... })
app.post('/trips', { onRequest: [app.authenticate] }, async (request, reply) => { ... })
```

**Farq:**
- Express: Token manually header se nikalo, `jwt.verify()` call karo, `req.user` pe manually daal do
- Fastify: `request.jwtVerify()` yeh sab khud karta hai — ek line

---

## 4. CREATE — Naya Trip (POST)

### Express
```typescript
app.post('/trips', authenticate, async (req, res) => {
  // Manually validate karo
  const { pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.body

  if (!pickup_address || !dropoff_address) {
    return res.status(400).json({ error: 'Address chahiye' })
  }
  if (typeof pickup_lat !== 'number') {
    return res.status(400).json({ error: 'Coordinates number hone chahiye' })
  }

  const rider = req.user as { id: string }  // Cast karo — Express types weak hain

  try {
    const { data: trip } = await supabase
      .from('trips')
      .insert({ rider_id: rider.id, pickup_address, dropoff_address, status: 'requested' })
      .select()
      .single()

    res.status(201).json({ trip })
  } catch (err) {
    res.status(500).json({ error: 'Trip nahi bani' })
  }
})
```

### Fastify
```typescript
interface TripBody {
  pickup_address: string
  dropoff_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_lat: number
  dropoff_lng: number
}

app.post<{ Body: TripBody }>(
  '/trips',
  {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['pickup_address', 'dropoff_address', 'pickup_lat', 'pickup_lng', 'dropoff_lat', 'dropoff_lng'],
        properties: {
          pickup_address:  { type: 'string' },
          dropoff_address: { type: 'string' },
          pickup_lat:      { type: 'number' },
          pickup_lng:      { type: 'number' },
          dropoff_lat:     { type: 'number' },
          dropoff_lng:     { type: 'number' }
        }
      }
    }
  },
  async (request, reply) => {
    // Yahan tak aaya matlab sab valid hai — schema ne check kar liya
    const rider = request.user as { id: string }
    const { pickup_address, dropoff_address } = request.body

    const { data: trip } = await supabase
      .from('trips')
      .insert({ rider_id: rider.id, pickup_address, dropoff_address, status: 'requested' })
      .select()
      .single()

    return reply.status(201).send({ trip })
  }
)
```

---

## 5. READ ALL — Saari Trips (GET)

### Express
```typescript
app.get('/trips', authenticate, async (req, res) => {
  const rider = req.user as { id: string }

  try {
    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .eq('rider_id', rider.id)
      .order('created_at', { ascending: false })

    res.json({ trips })
  } catch (err) {
    res.status(500).json({ error: 'Data nahi mila' })
  }
})
```

### Fastify
```typescript
app.get('/trips', { onRequest: [app.authenticate] }, async (request, reply) => {
  const rider = request.user as { id: string }

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('rider_id', rider.id)
    .order('created_at', { ascending: false })

  return { trips }
  // Error Fastify ka global handler pakad leta hai — try/catch ki zaroorat nahi
})
```

**Farq:** Fastify mein unhandled errors automatically global error handler pe jaate hain. Express mein har route mein `try/catch` + `res.status(500)` likhna parta hai.

---

## 6. READ ONE — Ek Trip (GET /:id)

### Express
```typescript
app.get('/trips/:id', authenticate, async (req, res) => {
  const rider = req.user as { id: string }
  const { id } = req.params  // String — manually type karo

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('rider_id', rider.id)
    .single()

  if (!trip) return res.status(404).json({ error: 'Trip nahi mili' })

  res.json({ trip })
})
```

### Fastify
```typescript
app.get<{ Params: { id: string } }>(
  '/trips/:id',
  { onRequest: [app.authenticate] },
  async (request, reply) => {
    const rider = request.user as { id: string }
    const { id } = request.params  // Type safe — TypeScript jaanta hai yeh string hai

    const { data: trip } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .eq('rider_id', rider.id)
      .single()

    if (!trip) return reply.status(404).send({ error: 'Trip nahi mili' })

    return { trip }
  }
)
```

---

## 7. UPDATE — Trip Cancel Karo (PATCH /:id)

### Express
```typescript
app.patch('/trips/:id', authenticate, async (req, res) => {
  const rider = req.user as { id: string }
  const { id } = req.params
  const { status } = req.body

  // Manually validate
  if (!status) return res.status(400).json({ error: 'status chahiye' })
  if (status !== 'cancelled') return res.status(400).json({ error: 'Sirf cancelled allowed hai' })

  const { data: existing } = await supabase
    .from('trips').select('status').eq('id', id).eq('rider_id', rider.id).single()

  if (!existing) return res.status(404).json({ error: 'Trip nahi mili' })

  if (['completed', 'cancelled'].includes(existing.status)) {
    return res.status(400).json({ error: `Trip already ${existing.status} hai` })
  }

  const { data: trip } = await supabase
    .from('trips').update({ status }).eq('id', id).select().single()

  res.json({ trip })
})
```

### Fastify
```typescript
app.patch<{ Params: { id: string }; Body: { status: string } }>(
  '/trips/:id',
  {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['cancelled'] }  // Sirf yeh value allowed — Fastify check karega
        }
      }
    }
  },
  async (request, reply) => {
    const rider = request.user as { id: string }
    const { id } = request.params
    const { status } = request.body

    const { data: existing } = await supabase
      .from('trips').select('status').eq('id', id).eq('rider_id', rider.id).single()

    if (!existing) return reply.status(404).send({ error: 'Trip nahi mili' })

    if (['completed', 'cancelled'].includes(existing.status)) {
      return reply.status(400).send({ error: `Trip already ${existing.status} hai` })
    }

    const { data: trip } = await supabase
      .from('trips').update({ status }).eq('id', id).select().single()

    return { trip }
  }
)
```

---

## 8. DELETE — Trip Mitao (DELETE /:id)

### Express
```typescript
app.delete('/trips/:id', authenticate, async (req, res) => {
  const user = req.user as { id: string; role: string }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission nahi' })
  }

  try {
    await supabase.from('trips').delete().eq('id', req.params.id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Delete nahi hua' })
  }
})
```

### Fastify
```typescript
app.delete<{ Params: { id: string } }>(
  '/trips/:id',
  { onRequest: [app.authenticate] },
  async (request, reply) => {
    const user = request.user as { id: string; role: string }

    if (user.role !== 'admin') {
      return reply.status(403).send({ error: 'Permission nahi' })
    }

    await supabase.from('trips').delete().eq('id', request.params.id)

    return reply.status(204).send()
  }
)
```

---

## 9. Global Error Handler

### Express
```typescript
// Sab routes ke BAAD likhna parta hai
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message || 'Kuch toot gaya'
  })
})

// Aur async errors khud pakadne parte hain — Express v4 mein auto nahi
app.get('/trips', authenticate, async (req, res, next) => {
  try {
    // ...
  } catch (err) {
    next(err)  // ← Ye bhoolna easy hai
  }
})
```

### Fastify
```typescript
// Ek baar likho — sab async errors khud yahan aate hain
app.setErrorHandler((error, request, reply) => {
  console.error(error)
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Kuch toot gaya'
  })
})

// Routes mein try/catch ki zaroorat nahi — Fastify handle karta hai
app.get('/trips', { onRequest: [app.authenticate] }, async (request, reply) => {
  const { data } = await supabase.from('trips').select('*')  // Error hogi toh setErrorHandler pe jayegi
  return { data }
})
```

---

## 10. Final Comparison Table

| Cheez | Express | Fastify |
|-------|---------|---------|
| Body parsing | `app.use(express.json())` manual | Built-in |
| Input validation | Khud likhna | Schema se automatic |
| JWT verify | Manual: header nikalo → `jwt.verify()` → `req.user` daal do | `await request.jwtVerify()` — ek line |
| TypeScript types | Weak, cast karna parta hai | Strong generics `app.get<{Params, Body, Query}>` |
| Async error handling | Har route mein `try/catch + next(err)` | Automatic — `setErrorHandler` ek baar |
| Speed | 15k req/sec | 30k+ req/sec |
| Async/await | Works lekin awkward | First-class support |
| Code likhna | Zyada boilerplate | Kam, clean |

---

## Ek Nazar Mein — Ek Hi Kaam, Code Ka Farq

```
Express:                          Fastify:
─────────────────────────────     ─────────────────────────────
1. app.use(express.json())        (built-in)
2. Middleware function likho      app.decorate('authenticate', ...)
3. Token header se nikalo         (jwtVerify karta hai)
4. jwt.verify() call karo         (jwtVerify karta hai)
5. req.user = decoded             (jwtVerify karta hai)
6. next() call karo               (nahi chahiye)
7. try { } catch(err) { next() }  (setErrorHandler karta hai)
8. if (!body.field) return 400    schema: { required: [...] }
─────────────────────────────     ─────────────────────────────
~50 lines per route               ~25 lines per route
```

**Conclusion:** Express aur Fastify dono kaam karte hain — Fastify mein sirf less code likhna parta hai aur errors zyada clearly aate hain. Naye project ke liye Fastify better choice hai.
