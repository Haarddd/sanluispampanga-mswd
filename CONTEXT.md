# Senior Citizen Assistance Platform - System Context & Architecture

## 📋 Project Overview

A mobile-first PWA platform designed specifically para sa senior citizens na may government benefits assistance, medicine request management, at location-based services. Target users are older adults na mas komportable sa SMS at voice interaction kaysa sa email at complex UIs.

---

## 🔐 Authentication System

### Phone-First Authentication Flow

**Rationale**: Senior citizens ay mas familiar sa phone numbers at SMS notification kaysa email. Direct SMS communication ay mas accessible at immediate para sa verification.

#### Stage 1: Phone Verification

- **Input**: Phone number (PH format +63XXXXXXXXX)
- **Output**: 6-digit SMS verification code (valid for 10 minutes, max 3 retry attempts)
- **Implementation**: Integrate with SMS provider (Twilio, Nexmo, or local PH provider like Semaphore/Infobip)
- **UX**: Simple, large input field, countdown timer, resend option after 30s

#### Stage 2: Onboarding (New & Existing Users)

Both new and existing users proceed through the same onboarding after verification:

1. **Full Name Input**
   - Required field, max 100 characters
   - Auto-format: Capitalize each word

2. **Address Input (Smart Location)**
   - Option A: Manual typing (text input with barangay/municipality autocomplete from PSGC - Philippine Standard Geographic Code)
   - Option B: "Use My Current Location" button
     - Triggers geolocation API (with permission request)
     - Reverse-geocoding to get full address
     - User can edit if needed
   - Fallback: Manual address input if location permission denied
   - Store: { street, barangay, municipality, province, region, zip_code}

3. **Senior Citizen ID Upload**
   - File input: JPG/PNG, max 5MB
   - Supports: PhilHealth ID, Senior Citizen ID, or passport
   - Auto-optimize: Compress before upload to Supabase Storage
   - OCR possibility: Extract name/birthdate for validation (future enhancement)
   - Store: { id_type, file_url, upload_date, verification_status }

4. **Create Account Button**
   - Submits onboarding data
   - Status immediately changes to "PENDING_ADMIN_REVIEW"

#### Stage 3: Admin Verification

- Admin reviews:
  - Phone number authenticity (cross-check with ID)
  - ID document clarity and validity
  - Address coherence
- Possible outcomes:
  - ✅ APPROVED: SMS notification sent, user can now sign in
  - ❌ REJECTED: SMS with rejection reason, can re-upload ID
  - ❓ NEEDS_CLARIFICATION: SMS requesting additional info

#### Authentication Method Post-Registration: **SMS OTP + Optional PIN**

**Primary Flow: SMS OTP-Only**

- User enters phone number → 6-digit SMS OTP → Session token
- **Benefits**:
  - Zero password fatigue para sa senior citizens
  - Reduces account takeover risk
  - Simpler support experience

**Optional Secondary Layer: Simple PIN (4-6 digits)**

- Set during onboarding (after phone verification)
- Used as additional security check on login (after OTP validation succeeds)
- Flow: Phone number → SMS OTP → Verify OTP → Enter PIN → Access granted
- **PIN Features**:
  - Simple numeric input (no special characters, no complexity rules)
  - Large buttons (0-9 keypad, like ATM interface)
  - Attempt limit: Max 3 wrong tries → cooldown 5 minutes
  - Can be reset by admin if user forgets (simple process)
  - Not stored in plain text (hashed with bcrypt)

**When to Use PIN**:

- Optional: Can skip during onboarding if user prefers OTP-only
- Recommended for: Users accessing sensitive data (medication history, benefits info)
- Admin dashboard: Always require PIN for admin accounts (2FA best practice)

**Session Management & Subsequent Logins**:

- **First Login (Phone + OTP)**: One-time only during initial signup verification
  - User registers with phone → Receives SMS OTP → Verifies OTP → Account created
  - After this, phone-based OTP flow is only used if user logs out or session expires
- **Subsequent Logins (PIN-Only)**:
  - User enters phone number → System checks if account exists
  - If account verified & active: Skip OTP, go directly to PIN entry
  - User enters PIN → Session created → Logged in
  - **No more SMS OTP needed** every time (like Maya/GCash behavior)
- **Session Storage** (Browser):
  - Access token stored in httpOnly cookie (secure, can't be accessed by JS)
  - Refresh token stored in httpOnly cookie (for auto-refresh)
  - Session duration: 30 days with auto-refresh on every page load
  - Automatic logout after 30 days of inactivity
- **Backend Session Management** (Supabase):
  - JWT token issued after successful PIN verification
  - Token expires in 30 days
  - Store session metadata: { user_id, phone_number, login_time, last_activity, ip_address }
  - Each logout: Invalidate token on server side
- **PIN Reset/Recovery**:
  - If user forgets PIN → Show "Can't log in?" option
  - Requires: Phone OTP verification (one-time)
  - After OTP verified: Set new PIN → Back to PIN-only login
- **Session Expiry/Timeout**:
  - 30-minute inactivity timeout (user clicks OK to extend, or auto-refresh)
  - 30-day absolute timeout (forced logout, must use PIN again)
  - Show warning banner 5 minutes before timeout

---

## 📱 User Dashboard (Mobile-First, PWA)

### Design Principles

- **Layout**: Bottom navigation with 4 main sections (like GCash/Maya)
- **Viewport**: Optimized for 360px-414px width (standard mobile)
- **Interactions**: Touch-friendly (48px min tap targets), swipe-able, minimal scrolling
- **Accessibility**: High contrast, large text (16px minimum), voice-friendly

### Section 1: Home

**Purpose**: Central hub for announcements, quick actions, and system status

**Components**:

- **Announcement Banner** (top, dismissible)
  - Government updates (e.g., pension release, new benefits)
  - System maintenance notices
  - Critical alerts (e.g., document expiration reminders)
  - Format: Card with title, date, small description, "Read More" link

- **Quick Actions** (prominent buttons)
  - Request Medicine
  - Request Assistance
  - View Profile

- **Status Overview**
  - Pending requests count
  - Unread announcements count
  - Last updated: profile verification date

- **Upcoming Events/Reminders**
  - Medication reminders (if medicine tracking implemented)
  - Benefit claim deadlines
  - Document expiration warnings

**Future Content Ideas**:

- Health tips/wellness articles
- Nearby services (pharmacies, hospitals, barangay offices)
- Government benefit application guides

---

### Section 2: Medicine

**Purpose**: Request and track medicine assistance

**Sub-sections**:

1. **Request Medicine**
   - Dropdown/search: Select from available medicines list
   - Quantity input: Numeric stepper (easier for seniors than text input)
   - Reason/Prescription: Optional text field (photo upload of prescription would be ideal)
   - "Submit Request" button
   - Confirmation message with reference number

2. **My Requests** (List/Timeline view)
   - Card per request showing:
     - Medicine name + quantity
     - Request date
     - Current status: PENDING → APPROVED → DISPENSED → COMPLETED
     - Status-specific icons (hourglass, checkmark, etc.)
     - Pharmacist notes (if any)
   - Tap to expand: Full details + timestamp updates

3. **Assistance Request** (Alternative: Medical/Non-Medical Help)
   - Category selector: Medicine, Healthcare, Food, Transport, Social, Other
   - Description: Text area for detailed request
   - Urgency level: Normal / Urgent (affects priority)
   - Location confirmation: "Confirm your current address for assistance"
   - Submit button
   - Track status similarly to medicine requests

_(Database schema defined in separate `database_erd_and_rls.md` file)_

---

### Section 3: Benefits

**Status**: Context gathering phase

**Planned Content**:

- List of eligible benefits (based on age, region, registered programs)
- Benefit details: Eligibility criteria, claim period, required documents
- Apply/Claim buttons (redirect to government portal or in-app form)
- Claim status tracking
- Documents checklist for each benefit

**Future Enhancements**:

- Integration with PhilHealth, SSS, PAGIBIG APIs
- Automatic benefit eligibility assessment
- Document compliance checker
- Reminder for benefit expiration/renewal

---

### Section 4: Profile

**Purpose**: Personal data hub + Digital ID management (similar to e.gov app)

**Components**:

1. **Digital Senior Citizen ID Display**
   - QR code (for verification by institutions)
   - ID number, full name, birthdate
   - Validity period
   - Print/Share options

2. **Personal Information**
   - Full name, birthdate, age
   - Contact (phone, email if available)
   - Address
   - ID documents on file (thumbnail + status)

3. **Registered Benefits**
   - List of active programs (PhilHealth, pension, etc.)
   - Status of each

4. **Account Settings**
   - Change phone number (requires re-verification)
   - Edit address
   - Re-upload ID (if rejected or expired)
   - Language preference (Filipino/English toggle)
   - Notification preferences (SMS on/off)
   - **PIN Management**:
     - Set/Change PIN (requires current OTP verification first)
     - Disable PIN (if user prefers OTP-only login)
     - Display: "PIN last changed: [date]"
   - **Logout** button

_(Database schema defined in separate `database_erd_and_rls.md` file)_

---

## 🛠️ Admin Dashboard (Responsive, Desktop-First)

### Section 1: User Management (CRUD)

**Purpose**: Administer user accounts

**Features**:

- **Table View**: Sortable & filterable by phone, name, verification status, registration date
- **Search**: Phone number or full name
- **Columns**: Phone | Name | Address | Status | ID Status | Actions
- **Status Badges**: ACTIVE | PENDING_VERIFICATION | REJECTED | ARCHIVED
- **Actions**:
  - 👁️ View: Open user detail modal
  - ✅ Verify: Approve pending user (auto-SMS sent)
  - ❌ Reject: Mark as rejected with reason (auto-SMS sent)
  - ⚠️ Flag: Mark suspicious activity
  - 🗑️ Deactivate: Move to archive (soft delete, data preserved)
  - 📄 View Documents: See uploaded ID, verify manually

- **User Detail Modal**:
  - Full profile data
  - ID document (lightbox viewer)
  - Registration timeline
  - Request history (medicine + assistance)
  - Admin notes (textarea for internal notes)
  - Verification logs

**Bulk Actions**: Select multiple → Bulk verify, bulk export

---

### Section 2: Medicine Inventory

**Purpose**: Manage available medicines & track requests

**Features**:

1. **Medicines List** (Table)
   - Columns: Medicine Name | Generic Name | Available Qty | Unit | Actions
   - Add/Edit/Delete medicines
   - Real-time stock level color-coding (Green: OK, Yellow: Low, Red: Critical)

2. **Add/Edit Medicine Modal**
   - Name, Generic Name, Description
   - Dosage/Strength, Unit of measure (tablet, bottle, syringe, etc.)
   - Usage instructions
   - Available quantity (numeric input)
   - Is active toggle (soft disable)
   - Submit button

3. **Medicine Requests Queue** (Sub-tab)
   - Filter by status: PENDING | APPROVED | DISPENSED | COMPLETED | REJECTED
   - Sort by: Newest | Oldest | Urgent
   - Card per request:
     - User name + phone (clickable to user detail)
     - Medicine + quantity
     - Reason (if provided)
     - Request date + age (relative time)
     - Status dropdown (change status)
     - Pharmacist notes textarea
     - Action buttons: Approve | Reject | Mark Dispensed
   - Bulk actions: Approve multiple, generate dispensing list (PDF export)

4. **Analytics** (Charts/KPIs)
   - Total requests this month
   - Requests by medicine (bar chart)
   - Request status breakdown (pie chart)
   - Stock levels trend (line chart)

---

### Section 3: Map View

**Purpose**: Geospatial visualization of active users

**Features**:

- **Interactive Map** (Google Maps or Mapbox API)
- **User Markers** on map:
  - Each user's registered address plotted
  - Marker color/icon by verification status (Green: Verified, Yellow: Pending, Red: Rejected)
  - Marker click → User popup (name, phone, pending requests count)
- **Filters**:
  - Show all users | Only verified | Only pending
  - By barangay/municipality (dropdown)
  - By request type (medicine, assistance, all)
- **Heatmap Mode** (optional): Shows request density by area (helpful for resource allocation)
- **User Count by Region** (side panel): Breakdown table

**Benefits**:

- Quick identification of geographic gaps in service
- Allocation of mobile outreach teams
- Identification of clusters for bulk assistance programs

---

### Section 4: Digital ID Management

**Purpose**: Manage & distribute digital senior citizen IDs

**Features**:

1. **Batch ID Generation**
   - Select users: Filter by verification status (auto-select verified users)
   - Generate IDs button → Background job creates IDs for all selected users
   - Each ID assigned unique ID number (format: SC-REGION-YEAR-SEQUENCE)
   - QR code auto-generated (encodes ID number + verification URL)

2. **ID Registry** (Table)
   - Columns: ID Number | User Name | Phone | Issue Date | Expiry Date | Status | Actions
   - Filter: Active | Expired | Revoked
   - Bulk export: CSV of ID numbers + user data (for printing/distribution)
   - Print view: Format-optimized page for batch printing (ID cards or stickers)

3. **Revoke/Renew IDs**
   - Select ID → Revoke button (marks as inactive)
   - Expired IDs: Auto-flag 30 days before expiry
   - Bulk renew: Select expired IDs → Renew → New expiry date + regenerate QR

4. **QR Code Verification**
   - Scanner tool: Click button → Open camera
   - Scan QR on ID → Display user details + verification status
   - Useful for institution staff verifying senior citizens at point-of-service

5. **Analytics**
   - Total IDs issued
   - Active vs. expired
   - IDs by region
   - Print history (who printed, when, how many)

_(Database schema defined in separate `database_erd_and_rls.md` file)_

---

### Section 5: Admin Activity Logs

**Purpose**: Audit trail & system transparency

**Features**:

1. **Comprehensive Logs Table**
   - Columns: Timestamp | Admin | Action | Target | Details | Status
   - Sortable, filterable by action type, date range, admin user

2. **Log Entry Details**
   - Who: Admin name + ID
   - When: Exact timestamp
   - What: Action type (USER_CREATED, USER_VERIFIED, MEDICINE_APPROVED, ID_GENERATED, etc.)
   - Where: Target entity (user ID, medicine ID, etc.)
   - Why: Admin notes (if any reason provided)
   - Status: Success / Error
   - Before/After: Data snapshots for edits (change log)

3. **Filters & Search**
   - Date range picker (last 7 days, 30 days, custom)
   - Action type dropdown (dropdown of all possible actions)
   - Admin filter (dropdown of all admins)
   - Search: Free-text search in logs
   - Export: Download logs as CSV/JSON

4. **Analytics**
   - Actions by type (bar chart)
   - Activity by admin (table)
   - Timeline: Activity trend over time (line chart)

5. **Real-time Notifications** (Optional)
   - Stream live logs in real-time (WebSocket or polling)
   - Highlight errors or critical actions
   - Alert if suspicious pattern detected (e.g., bulk rejections)

_(Database schema defined in separate `database_erd_and_rls.md` file)_

**Loggable Actions**:

- USER_REGISTERED, USER_VERIFIED, USER_REJECTED, USER_DEACTIVATED, USER_UPDATED
- USER_PIN_SET, USER_PIN_RESET, USER_PIN_DISABLED, USER_PIN_LOCKED
- MEDICINE_ADDED, MEDICINE_UPDATED, MEDICINE_DELETED
- MEDICINE_REQUEST_APPROVED, MEDICINE_REQUEST_DISPENSED, MEDICINE_REQUEST_REJECTED
- ASSISTANCE_REQUEST_ASSIGNED, ASSISTANCE_REQUEST_COMPLETED
- DIGITAL_ID_GENERATED, DIGITAL_ID_PRINTED, DIGITAL_ID_REVOKED, DIGITAL_ID_SCANNED
- ADMIN_LOGIN, ADMIN_LOGOUT, ADMIN_PIN_RESET, ADMIN_SETTINGS_CHANGED

---

## 🗄️ Database Schema Summary

**Core Tables**:

1. `users` - Phone, name, address, verification status
2. `verification_codes` - OTP management
3. `user_profiles` - Birthdate, language, preferences
4. `user_addresses` - Detailed geolocation (denormalized for queries)
5. `id_documents` - Uploaded files + status
6. `digital_ids` - Generated ID numbers + QR codes
7. `medicines` - Inventory master
8. `medicine_requests` - User requests + status tracking
9. `assistance_requests` - General help requests
10. `admin_logs` - Audit trail
11. `admin_users` - Admin accounts + permissions

---

## 🔧 Tech Stack Recommendations

### Frontend

- **Framework**: Next.js (App Router) + TypeScript
- **Mobile UI**: Tailwind CSS + Radix UI (accessible components)
- **PWA**: next-pwa, workbox (offline support, installable)
- **Geolocation**: Leaflet or Mapbox GL JS
- **Maps**: Google Maps API or OpenStreetMap
- **SMS Verification**: Manual integration with Twilio/Nexmo SDK
- **QR Code Generation**: `qrcode.react`

### Backend/Database

- **Database**: Supabase (PostgreSQL) with RLS policies
- **SMS Provider**: Twilio, Nexmo, or Infobip (PH-friendly)
- **File Storage**: Supabase Storage (or Cloudinary for image optimization)
- **Geospatial Queries**: PostGIS extension in Postgres
- **Logging**: Structured logs to Supabase or external service (e.g., Datadog)

### Admin Dashboard

- **Same stack as frontend** (co-located, subdomain route)
- **Charts**: Recharts or Chart.js
- **Admin-only pages**: Protected by role-based access control (RLS + middleware)

### DevOps

- **Hosting**: Vercel (auto-deploys from Git)
- **Database Backups**: Supabase automated backups
- **Monitoring**: Vercel Analytics, Sentry (error tracking)
- **SMS Service Monitoring**: Provider dashboards + alerts

---

## 🔒 Security & RLS Strategy

### Supabase Row-Level Security (RLS)

- **Users can only view/edit their own profile**
- **Medicine requests**: Only user + assigned admin can view
- **Admin logs**: Only super admins can access
- **Digital IDs**: Only admin + user can view their own
- **Phone numbers**: Masked in logs/exports (except for admin verification)

### Authentication

- **JWT-based sessions** via Supabase Auth (phone-based)
- **Session expiry**: 30 days with auto-refresh on activity
- **Logout**: Token revocation on server side

### SMS Security

- **OTP rate-limiting**: Max 3 attempts per 10 minutes, then cooldown
- **OTP validation**: Server-side only, never expose code in URL
- **Phone number verification**: Check against national registry (if available)

---

## 📊 Analytics & Metrics

**Key Metrics to Track**:

- User registration rate (daily/weekly)
- Verification completion rate (% of users who complete onboarding)
- Medicine request volume (by type, by region)
- Assistance request fulfillment time (average)
- Geographic distribution of users
- Admin activity patterns
- Error rates (failed OTPs, failed requests)

**Dashboards**:

- Executive summary (for leadership)
- Regional breakdown (for regional coordinators)
- Inventory alerts (for pharmacy managers)
- Activity log (for compliance/audit)

---

## 🚀 Deployment & Rollout Strategy

### Phase 1: Pilot (1-2 months)

- Single barangay or municipality
- Limit to 100-500 users
- Collect feedback on UX, SMS delivery, address capture
- Refine based on feedback

### Phase 2: Regional Expansion (2-3 months)

- Expand to 5-10 municipalities
- Onboard regional admins
- Scale infrastructure (CDN, database optimization)
- Train support team on common issues

### Phase 3: National Scale (3+ months)

- Full rollout across country
- Localized content (regional announcements, benefit info)
- Integration with national databases (if available)
- Advanced features (AI-based needs assessment, predictive outreach)

---

## 📝 Future Enhancements

1. **AI-Powered Features**
   - Medicine interaction checker
   - Needs assessment based on profile + requests
   - Chatbot for common queries (SMS + in-app)

2. **Voice Features**
   - Voice-based request submission (for users with vision impairment)
   - Text-to-speech for announcements
   - Call center integration (800 hotline)

3. **Government Integration**
   - PhilHealth real-time eligibility check
   - SSS pension status sync
   - PAGIBIG loan inquiry
   - Land titles (BIR) verification

4. **Community Features**
   - Connect seniors in same barangay (support groups)
   - Volunteer assignment for assistance requests
   - Feedback/rating system

5. **Analytics & Research**
   - Dashboard for researchers studying senior citizen needs
   - Anonymized data export for policy makers
   - Trend analysis (seasonal health issues, etc.)

---

## 📞 Support & Contact

For questions or clarifications during development:

- Reference this document as the single source of truth
- Clarify ambiguous requirements before implementation
- Test with actual senior citizens (user testing) early and often
- Iterate on UX based on feedback (many seniors have limited digital literacy)

---

**Document Version**: 1.0  
**Last Updated**: July 2026  
**Status**: Ready for Development
