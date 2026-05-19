# Glido — System Architecture

## Overview

Glido is a Pakistan-based ride-hailing platform (like Uber/Careem) built on React Native (Expo) for mobile and Node.js for backend. This document covers architecture, cost analysis, use cases, and capacity planning.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Mobile Apps** | React Native (Expo) | Rider App + Driver App |
| **Navigation** | Expo Router | Screen routing |
| **Auth** | Supabase Auth + 2Factor.in | Phone OTP, JWT sessions |
| **REST API** | Node.js + Fastify | Business logic, trips, payments |
| **Realtime** | Socket.io | Driver location, ride matching |
| **Database** | Supabase (PostgreSQL) | All persistent data |
| **Live Locations** | Redis (Upstash) | Driver lat/lng (fast cache) |
| **File Storage** | Supabase Storage | Profile pics, documents |
| **Maps** | Google Maps API | Routing, fare estimate |
| **Payments** | JazzCash / EasyPaisa | Pakistan payments |
| **Server** | Node.js on Railway.app | Backend hosting |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                  Mobile Apps (Expo)                   │
│            Rider App          Driver App              │
└────────────────────┬─────────────────────────────────┘
                     │ HTTPS + WebSocket
              ┌──────▼──────┐
              │    Nginx     │
              │ (API Gateway)│
              └──────┬───────┘
         ┌───────────┼───────────┐
         │           │           │
   ┌─────▼─────┐ ┌───▼────┐ ┌───▼──────────┐
   │  REST API │ │Socket  │ │ Supabase Auth │
   │ (Fastify) │ │  .io   │ │ + 2Factor.in  │
   └─────┬─────┘ └───┬────┘ └───────────────┘
         │           │
   ┌─────▼───────────▼──────┐
   │        Supabase         │
   │   PostgreSQL + Storage  │
   └─────────────────────────┘
         │
   ┌─────▼──────┐
   │   Redis    │
   │ (Upstash)  │
   │  Locations │
   └────────────┘
```

---

## Authentication Flow

```
1. User enters phone number (Pakistani format: 03xx-xxxxxxx)
         ↓
2. Supabase Auth triggers → 2Factor.in SMS API called
         ↓
3. User receives OTP via SMS (~PKR 2 cost)
         ↓
4. User enters OTP → Supabase verifies
         ↓
5. JWT token issued → stored on device
         ↓
6. Every API request uses JWT → backend verifies via Supabase
```

---

## Realtime Driver Location Flow

```
Driver App (every 2 seconds)
         ↓
   Socket.io server
         ├── Redis: SET driver:{id} {lat,lng,heading}
         │         (3 reasons below)
         └── Rider Socket: location broadcast (realtime)
         ↓
   Rider App → map marker moves
```

### Redis kyun rakha hai (3 reasons)

**1. Rider baad mein app khole**
```
Driver broadcast ho raha tha → Rider ki app band thi
Rider ne app kholi → Socket pe koi data nahi
Redis → last known location → rider ko dedo ✅
```

**2. Nearby drivers search**
```
Rider ride book kare → 5km mein kaun sa driver hai?
Socket.io se yeh query possible nahi
Redis → sab drivers ki location stored → seedha query ✅
```

**3. Multiple servers (scale hone par)**
```
Server 1 pe Driver connected
Server 2 pe Rider connected
Socket.io directly connect nahi kar sakta ❌
Redis pub/sub → dono servers share karte hain ✅
```

---

## Ride Booking Flow

```
Rider sets pickup + destination
         ↓
REST API: fare estimate (Google Maps Distance API)
         ↓
Rider confirms → ride request created in PostgreSQL
         ↓
Socket.io broadcasts to nearby drivers (within 5km radius)
         ↓
Driver accepts → matched in Redis → both notified
         ↓
Trip starts → status updates in PostgreSQL
         ↓
Trip ends → fare calculated → payment processed
         ↓
Both apps show receipt + rating screen
```

---

## Database Schema (PostgreSQL)

```sql
users          -- riders and drivers both
trips          -- all ride records
payments       -- transaction history
driver_docs    -- CNIC, license, vehicle info
ratings        -- rider ↔ driver ratings
promo_codes    -- discount codes
```

---

## Use Cases

### Rider App

| # | Use Case | Description |
|---|---|---|
| 1 | **Register / Login** | Phone OTP via Supabase + 2Factor.in |
| 2 | **Set Pickup Location** | GPS auto-detect or manual pin on map |
| 3 | **Set Destination** | Search address or select from saved places |
| 4 | **View Fare Estimate** | Distance-based pricing before booking |
| 5 | **Book Ride** | Request sent to nearby drivers |
| 6 | **Track Driver** | Realtime driver location on map |
| 7 | **Cancel Ride** | Before driver arrives (cancellation policy) |
| 8 | **Trip in Progress** | Route tracking, ETA |
| 9 | **Payment** | JazzCash / EasyPaisa / Cash |
| 10 | **Rate Driver** | 1–5 stars after trip |
| 11 | **Trip History** | Past rides with receipts |
| 12 | **Saved Places** | Home, Office shortcuts |
| 13 | **Promo Codes** | Discount on fare |
| 14 | **SOS / Emergency** | Panic button with location share |

### Driver App

| # | Use Case | Description |
|---|---|---|
| 1 | **Register** | Phone OTP + upload CNIC + license + vehicle |
| 2 | **Go Online / Offline** | Toggle availability |
| 3 | **Receive Ride Request** | Notification with pickup distance |
| 4 | **Accept / Decline** | 15 second window |
| 5 | **Navigate to Rider** | Google Maps turn-by-turn |
| 6 | **Start Trip** | Confirm rider pickup |
| 7 | **Complete Trip** | Mark as done → payment released |
| 8 | **Earnings Dashboard** | Daily / weekly / monthly |
| 9 | **Rate Rider** | After trip |
| 10 | **Trip History** | All completed trips |

### Admin Panel (Web)

| # | Use Case | Description |
|---|---|---|
| 1 | **Driver Approval** | Verify documents before activation |
| 2 | **Live Map** | All active drivers on map |
| 3 | **Trip Monitoring** | All ongoing trips |
| 4 | **User Management** | Ban / unban users |
| 5 | **Promo Code Management** | Create / expire promos |
| 6 | **Revenue Reports** | Daily / monthly earnings |
| 7 | **Support Tickets** | Complaints from riders/drivers |

---

## Concurrent Users Capacity

### Current Setup (Railway $5/month server + Supabase Free + Upstash Free)

| Metric | Capacity |
|---|---|
| Concurrent WebSocket connections | ~1,000 |
| REST API requests/second | ~200 |
| Active drivers on map | ~300 |
| Database connections | 50 (Supabase free limit) |
| **Recommended max concurrent users** | **500–800** |

### Upgraded Setup (Railway $20/month + Supabase Pro $25)

| Metric | Capacity |
|---|---|
| Concurrent WebSocket connections | ~5,000 |
| REST API requests/second | ~1,000 |
| Active drivers on map | ~2,000 |
| Database connections | 500 |
| **Recommended max concurrent users** | **3,000–5,000** |

### Scale Further (Multiple servers + Load balancer)

| Metric | Capacity |
|---|---|
| Concurrent users | **10,000+** |
| Setup | PM2 cluster + Redis pub/sub for Socket.io |
| Cost | ~$100–200/month |

---

## Cost Analysis

### Monthly Costs — Phase 1 (0 to 1,000 users)

| Service | Plan | Cost |
|---|---|---|
| Supabase | Free tier | **$0** |
| Railway.app (Node.js server) | Starter | **$5** |
| Upstash Redis | Free tier | **$0** |
| Google Maps API | Free $200 credit | **$0** |
| 2Factor.in OTP | ~1,000 OTPs × PKR 2 | **~PKR 2,000** |
| Domain | .pk domain | **~PKR 2,500/year** |
| **Total** | | **~$5 + PKR 2,000/month** |

### Monthly Costs — Phase 2 (1,000 to 5,000 users)

| Service | Plan | Cost |
|---|---|---|
| Supabase | Pro | **$25** |
| Railway.app | Pro | **$20** |
| Upstash Redis | Pay-as-you-go | **~$5** |
| Google Maps API | After free credit | **~$20** |
| 2Factor.in OTP | ~5,000 OTPs × PKR 2 | **~PKR 10,000** |
| **Total** | | **~$70 + PKR 10,000/month** |

### Monthly Costs — Phase 3 (5,000 to 20,000 users)

| Service | Plan | Cost |
|---|---|---|
| Supabase | Pro + addons | **$50** |
| Server (2x Railway) | Pro | **$40** |
| Upstash Redis | Pro | **$20** |
| Google Maps API | High usage | **~$100** |
| 2Factor.in OTP | ~20,000 OTPs | **~PKR 40,000** |
| **Total** | | **~$210 + PKR 40,000/month** |

---

## OTP Cost Detail (2Factor.in)

| Monthly OTPs | Cost (PKR 2/OTP) |
|---|---|
| 1,000 | PKR 2,000 |
| 5,000 | PKR 10,000 |
| 10,000 | PKR 20,000 |
| 50,000 | PKR 100,000 |

> Note: OTP is sent only on registration and each login. If users stay logged in (JWT refresh), OTP cost is much lower.

---

## Scaling Strategy

```
Phase 1: Single server, Supabase free
         ↓ (500+ concurrent)
Phase 2: Supabase Pro, bigger Railway server
         ↓ (3,000+ concurrent)
Phase 3: Multiple servers + Nginx load balancer
         Redis pub/sub for Socket.io across servers
         ↓ (10,000+ concurrent)
Phase 4: Kubernetes / dedicated infrastructure
```

---

## Security Checklist

- [ ] JWT tokens expire in 7 days, refresh token rotation enabled
- [ ] All API routes protected with Supabase JWT middleware
- [ ] Driver documents stored in private Supabase Storage bucket
- [ ] Rate limiting on OTP endpoint (max 3 OTP per phone per hour)
- [ ] HTTPS only (Railway provides SSL automatically)
- [ ] Phone number validation (Pakistani format only)
- [ ] SQL injection protection (Supabase parameterized queries)

---

## Environment Variables Required

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWO_FACTOR_API_KEY=
GOOGLE_MAPS_API_KEY=
JAZZ_CASH_MERCHANT_ID=
JAZZ_CASH_PASSWORD=
JAZZ_CASH_INTEGRITY_SALT=
REDIS_URL=
JWT_SECRET=
```

---

*Last updated: May 2026*
