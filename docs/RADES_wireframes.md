# Low-Fidelity Desktop & Mobile Wireframe Guide for RADES

ASCII wireframe layouts, desktop (wide view) first, with notes on how each screen adapts to mobile. Covers every RADES screen defined in the SRS.

## 1. Authentication & User Profile Screens

### 1.1 Sign-Up Screen (/signup)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES (Logo)                                                  [ Sign In ]  [ Help ]     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                                     Create Account                                      |
|                             Sign up with your IBA Email                                 |
|                                                                                         |
|         +---------------------------------------------------------------------+         |
|         | Full Name                                                           |         |
|         | [_________________________________________________________________] |         |
|         |                                                                     |         |
|         | IBA Email Address                                                   |         |
|         | [_________________________________________________________________] |         |
|         |                                                                     |         |
|         | Password                                 Confirm Password           |         |
|         | [_______________________]                [_______________________]  |         |
|         |                                                                     |         |
|         | ERP / Student ID                         Phone Number               |         |
|         | [_______________________]                [_______________________]  |         |
|         |                                                                     |         |
|         | [                     Create Account                      ]         |         |
|         +---------------------------------------------------------------------+         |
|                                                                                         |
|                             Already have an account? [Sign In]                          |
+-----------------------------------------------------------------------------------------+
```

*Mobile: stack all inputs vertically into a single column.*

### 1.2 Sign-In Screen (/signin)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES (Logo)                                                                            |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                                      Welcome Back                                       |
|                                                                                         |
|         +---------------------------------------------------------------------+         |
|         | IBA Email Address                                                   |         |
|         | [_________________________________________________________________] |         |
|         |                                                                     |         |
|         | Password                                                            |         |
|         | [_________________________________________________________________] |         |
|         |                                                                     |         |
|         | [x] Remember me for 30 days                      [Forgot Password?] |         |
|         |                                                                     |         |
|         | [                       Sign In                           ]         |         |
|         +---------------------------------------------------------------------+         |
|                                                                                         |
|                            Don't have an account? [Sign Up]                             |
+-----------------------------------------------------------------------------------------+
```

### 1.3 Forgot / Reset Password Screen (/forgot-password)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES (Logo)                                                         [ Back to Sign In ] |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                                     Reset Password                                      |
|               Enter your institutional email to receive a password reset link.          |
|                                                                                         |
|         +---------------------------------------------------------------------+         |
|         | Institutional Email Address                                         |         |
|         | [_________________________________________________________________] |         |
|         |                                                                     |         |
|         | [                    Send Reset Link                      ]         |         |
|         +---------------------------------------------------------------------+         |
+-----------------------------------------------------------------------------------------+
```

### 1.4 Student Profile & Registration History (/profile)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES   [Explore] [My Tickets] [Societies]                [ Notifications (3) ] [User v]|
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-------------------------------+  +-------------------------------------------------+ |
|  | [ Profile Picture ]           |  | Registration History                            | |
|  |                               |  | [ All ]  [ Upcoming ]  [ Attended ]  [ Canceled]| |
|  | Abdullah Tariq                |  +-------------------------------------------------+ |
|  | ERP: 24981                    |  | Event Name     | Date     | Type | Status|Action| |
|  | Dept: BS Computer Science     |  |----------------+----------+------+-------+------| |
|  | Email: a.tariq@khi.iba.edu.pk |  | Coding Olympiad| Nov 12   | Team | Active|[Ticket]| |
|  | Phone: [ +923001234567      ] |  | Music Fest '26 | Dec 02   | Solo | Active|[Ticket]| |
|  |                               |  | Tech Talk      | Oct 10   | Solo | Done  |[Review]| |
|  | [ Save Profile Details ]      |  +-------------------------------------------------+ |
|  +-------------------------------+                                                      |
+-----------------------------------------------------------------------------------------+
```

*Mobile: stack the profile card on top of the history table; turn table rows into cards.*

## 2. Event Discovery & Browsing Screens

### 2.1 Event Browse / Search Page (/events)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES   [Explore Events] [My Tickets]                     [ Search...           ] [User]|
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  FILTERS                      UPCOMING CAMPUS EVENTS                                    |
|  +-------------------------+  +-------------------+ +-------------------+ +-----------+ |
|  | Category                |  | [ Image ]         | | [ Image ]         | | [ Image ] | |
|  | [x] Technology          |  | CS Society        | | Music Society     | | Sports  | |
|  | [ ] Music & Arts        |  | Hackathon 2026    | | Battle of Bands   | | Futsal  | |
|  | [ ] Sports              |  | Nov 15 | Auditorium | Nov 20 | Lawn     | | Dec 01  | |
|  |                         |  | Seats: 45 left    | | PKR 500           | | FREE    | |
|  | Society                 |  | [ View Details ]  | | [ View Details ]  | | [Details] | |
|  | [ Select Society   v ]  |  +-------------------+ +-------------------+ +-----------+ |
|  |                         |  +-------------------+ +-------------------+ +-----------+ |
|  | Registration Type       |  | [ Image ]         | | [ Image ]         | | [ Image ] | |
|  | (o) All ( ) Free ( ) Paid|  | Debating Society  | | Entrepreneurship  | | Gaming  | |
|  |                         |  | Annual MUN        | | Pitch Night       | | LAN Party | |
|  | [ Clear All Filters ]   |  | Dec 05            | | Dec 12            | | Dec 18  | |
|  +-------------------------+  +-------------------+ +-------------------+ +-----------+ |
+-----------------------------------------------------------------------------------------+
```

*Mobile: collapse the filter sidebar into a drawer or 'Filters' button; show events in one column.*

### 2.2 Event Detail Page (/events/[id])

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES   [ < Back to Events ]                              [ Share ] [ Bookmark ] [User] |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-----------------------------------------------+ +----------------------------------+ |
|  |                                               | | IBA Hackathon 2026               | |
|  |                                               | | Hosted by: CS Society            | |
|  |           BANNER / EVENT ARTWORK              | | Faculty: Dr. Shakeel Khoja       | |
|  |                                               | |                                  | |
|  |                                               | | Date: Nov 15, 2026 | 09:00 AM   | |
|  |                                               | | Venue: Main Campus Auditorium    | |
|  |                                               | | Capacity: 155 / 200 Registered  | |
|  |                                               | | Price: FREE                      | |
|  |                                               | |                                  | |
|  |                                               | | [ Register (Team) ]              | |
|  |                                               | | [ + Google Calendar ]            | |
|  +-----------------------------------------------+ +----------------------------------+ |
|                                                                                         |
|  About Event                                                                            |
|  +------------------------------------------------------------------------------------+ |
|  | Join us for a 12-hour coding marathon addressing real-world challenges facing IBA. | |
|  | Cash prizes worth PKR 100,000 to be won. Teams of 3 to 4 members are required.     | |
|  +------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------+
```

## 3. Registration & Ticketing Screens

### 3.1 Solo Registration Interface (/events/[id]/register-solo)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES   [ < Back to Event Details ]                                                     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                                Solo Event Registration                                  |
|                                                                                         |
|         +---------------------------------------------------------------------+         |
|         | Event: Annual Tech Talk 2026 | Date: Nov 10, 2026 | Fee: Free           |         |
|         |---------------------------------------------------------------------|         |
|         | Student Name: Abdullah Tariq               ERP ID: 24981            |         |
|         | Email: a.tariq@khi.iba.edu.pk                                       |         |
|         |                                                                     |         |
|         | Contact Number for Venue SMS Updates                                |         |
|         | [ +923001234567                                                   ] |         |
|         |                                                                     |         |
|         | [x] I confirm I do not have schedule conflicts during this time.    |         |
|         |                                                                     |         |
|         | [ Confirm Solo Registration ]                                       |         |
|         +---------------------------------------------------------------------+         |
+-----------------------------------------------------------------------------------------+
```

### 3.2 Team Registration Interface (/events/[id]/register-team)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES   [ < Back to Event Details ]                                                     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                                Team Event Registration                                  |
|                                                                                         |
|         +---------------------------------------------------------------------+         |
|         | Event: IBA Hackathon 2026 | Team Size: 3-4 Members                     |         |
|         |---------------------------------------------------------------------|         |
|         | Team Name                                                           |         |
|         | [ Code Ninjas                                                     ] |         |
|         |                                                                     |         |
|         | Leader (You): Abdullah Tariq (a.tariq@khi.iba.edu.pk)               |         |
|         |                                                                     |         |
|         | Member 2 Institutional Email                                        |         |
|         | [ duaa.naz@khi.iba.edu.pk                                         ] |         |
|         |                                                                     |         |
|         | Member 3 Institutional Email                                        |         |
|         | [ emad.khan@khi.iba.edu.pk                                        ] |         |
|         |                                                                     |         |
|         | Member 4 Institutional Email (Optional)                             |         |
|         | [ rayyan.hassan@khi.iba.edu.pk                                    ] |         |
|         |                                                                     |         |
|         | [ Submit Team Registration ]                                        |         |
|         +---------------------------------------------------------------------+         |
+-----------------------------------------------------------------------------------------+
```

### 3.3 Payment / Checkout Screen (/checkout)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES Checkout                                                     [ Cancel & Exit ]    |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +---------------------------------------+ +------------------------------------------+ |
|  | Order Summary                         | | Payment Details (Stripe Test Mode)       | |
|  |                                       | |                                          | |
|  | Event: Battle of Bands 2026           | | Card Number                              | |
|  | Quantity: 1 Ticket                    | | [ 4242  4242  4242  4242               ] | |
|  | Ticket Holder: Abdullah Tariq         | |                                          | |
|  |                                       | | Expiry               CVC                 | |
|  | Ticket Price:         PKR 500.00      | | [ MM / YY ]          [ ___ ]             | |
|  | Processing Fee:       PKR   0.00      | |                                          | |
|  |---------------------------------------| | Name on Card                             | |
|  | Total Due:            PKR 500.00      | | [ Abdullah Tariq                       ] | |
|  |                                       | |                                          | |
|  |                                       | | [ Pay PKR 500.00 ]                      | |
|  +---------------------------------------+ +------------------------------------------+ |
+-----------------------------------------------------------------------------------------+
```

### 3.4 Ticket & QR-Code Display Screen (/tickets/[id])

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES   [ < Back to My Profile ]                                      [ Download PDF ]  |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|         +---------------------------------------------------------------------+         |
|         | RADES OFFICIAL EVENT PASS                              TICKET #8941 |         |
|         |---------------------------------------------------------------------|         |
|         |                                                                     |         |
|         |  IBA Hackathon 2026                         +-----------------+     |         |
|         |  Date: Nov 15, 2026                         |  +-----------+  |     |         |
|         |  Time: 09:00 AM - 06:00 PM                  |  | QR CODE   |  |     |         |
|         |  Venue: Main Campus Auditorium              |  | SCAN TARGET| |     |         |
|         |                                             |  +-----------+  |     |         |
|         |  Holder: Abdullah Tariq                     +-----------------+     |         |
|         |  ERP: 24981                                                         |         |
|         |                                             Scan at gate entrance   |         |
|         +---------------------------------------------------------------------+         |
|                                                                                         |
|                       [ Send Ticket Copy to Email ]                                     |
+-----------------------------------------------------------------------------------------+
```

## 4. Society Administration & Management Screens

### 4.1 Society Public Profile Page (/societies/[id])

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES   [Explore] [Societies]                                            [ Sign In ]    |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | [ LOGO ]  Computer Science Society (CSS)                                          |  |
|  |           Empowering technical innovation at IBA Karachi.                         |  |
|  |           Email: css@khi.iba.edu.pk | Office: Student Center 2nd Floor              |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|  Published Events by CSS                                                                |
|  +-----------------------+ +-----------------------+ +-------------------------------+  |
|  | IBA Hackathon 2026    | | AI Workshop 2026      | | Web Dev Bootcamp             |  |
|  | Nov 15, 2026          | | Dec 10, 2026          | | Jan 05, 2027                 |  |
|  | [ View Event ]        | | [ View Event ]        | | [ View Event ]                |  |
|  +-----------------------+ +-----------------------+ +-------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

### 4.2 Society Administration Dashboard (/admin/dashboard)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES Admin | Computer Science Society                              [ Switch Portal v ] |
+-----------------------------------------------------------------------------------------+
|  NAVIGATION      | MANAGED SOCIETY EVENTS                                               |
|  +-------------+ | [ + Create Event ]                       [ Filter: All v ]           |
|  | [x] Dashboard | +------------------------------------------------------------------+ |
|  | [ ] Events    | | Event Title       | Date   | Type | Capacity | Status  | Action  | |
|  | [ ] Analytics | |-------------------+--------+------+----------+---------+---------| |
|  | [ ] Scanner   | | Hackathon 2026    | Nov 15 | Team | 155/200  | Active  | [Manage]| |
|  | [ ] Panel     | | AI Seminar        | Dec 10 | Solo | 45/80    | Draft   | [Edit]  | |
|  |               | | Tech Talk 2026    | Oct 10 | Solo | 100/100  | Finished| [Stats] | |
|  | [ Settings ]  | +------------------------------------------------------------------+ |
|  +-------------+                                                                        |
+-----------------------------------------------------------------------------------------+
```

### 4.3 Event Creation & Editing Screen (/admin/events/new)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES Admin | Create New Event                                      [ Cancel / Exit ]   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +---------------------------------------+ +------------------------------------------+ |
|  | Basic Details                         | | Logistics & Configuration                | |
|  |                                       | |                                          | |
|  | Event Title                           | | Venue                                    | |
|  | [___________________________________] | | [ Select Venue                      v ]  | |
|  |                                       | |                                          | |
|  | Category                              | | Start Date & Time        End Time        | |
|  | [ Select Category                 v ] | | [ Date ] [ Time ]        [ Time ]        | |
|  |                                       | |                                          | |
|  | Event Description                     | | Capacity Limit           Ticket Price    | |
|  | [___________________________________] | | [ 200 ]                  [ PKR 0        ] | |
|  | [___________________________________] | |                                          | |
|  |                                       | | Participation Mode                       | |
|  | Event Banner Asset                    | | (o) Solo Registration  ( ) Team          | |
|  | [ Upload Image File...              ] | |                                          | |
|  +---------------------------------------+ +------------------------------------------+ |
|                                                                                         |
|  [ Save Draft ]                                                   [ Publish Event ]     |
+-----------------------------------------------------------------------------------------+
```

### 4.4 Event Analytics Dashboard (/admin/events/[id]/analytics)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES Admin | Analytics: IBA Hackathon 2026                         [ Export CSV ]      |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +---------------------+ +---------------------+ +-----------------+ +------------------+ |
|  | Total Registrations | | Total Check-Ins     | | Attendance %    | | Ticket Revenue   | |
|  | 155 / 200           | | 132                 | | 85.1%           | | PKR 0.00 (Free) | |
|  +---------------------+ +---------------------+ +-----------------+ +------------------+ |
|                                                                                         |
|  Attendance Rate Visual                                                                 |
|  +------------------------------------------------------------------------------------+ |
|  | Checked In: [====================================================.......] 85%       | |
|  | No-Show:    [========...............................................] 15%       | |
|  +------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------+
```

### 4.5 Event Cancellation & Refund Status (/admin/events/[id]/cancel)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES Admin | Cancel Event                                                              |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|         +---------------------------------------------------------------------+         |
|         | CONFIRM EVENT CANCELLATION                                          |         |
|         | Event: Battle of Bands 2026                                         |         |
|         | Affected Participants: 120 Registered Students                      |         |
|         |---------------------------------------------------------------------|         |
|         | Reason for Cancellation                                             |         |
|         | [_________________________________________________________________] |         |
|         |                                                                     |         |
|         | Financial Refund Summary                                            |         |
|         | Total Ticket Revenue to Refund: PKR 60,000                            |         |
|         |                                                                     |         |
|         | [x] Automatically issue refunds to original payment methods (Stripe)|         |
|         | [x] Send cancellation email alerts via Resend to all participants.  |         |
|         |                                                                     |         |
|         | [ Abort / Keep Event ]            [ Confirm & Cancel Event ]        |         |
|         +---------------------------------------------------------------------+         |
+-----------------------------------------------------------------------------------------+
```

### 4.6 Society Member / Panel Management (/admin/members)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES Admin | Society Panel Management                                                  |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  Panel Roster                                 Add New Admin Member                      |
|  +-----------------------------------------+  +---------------------------------------+ |
|  | Name            | Email        | Role   |  | Student IBA Email                     | |
|  |-----------------+--------------+--------|  | [___________________________________] | |
|  | Shahzaib Kazmi  | s.kazmi@...  | Head   |  |                                       | |
|  | Duaa Naz        | d.naz@...    | Admin  |  | Select Administrative Role            | |
|  | Rayyan Hassan   | r.hassan@... | Officer|  | [ Select Role                     v ] | |
|  |                 |              |        |  |                                       | |
|  |                 |              |        |  | [ Grant Admin Access ]                | |
|  +-----------------------------------------+  +---------------------------------------+ |
+-----------------------------------------------------------------------------------------+
```

## 5. On-Site Operations & Post-Event Screens

### 5.1 QR Scanner / Check-In Screen (/admin/checkin)

**Mobile View (primary device for scanners)**

```text
+-------------------------------------------------+
| RADES Check-In       [ Event: Hackathon 2026 v ]|
+-------------------------------------------------+
|                                                 |
|          +---------------------------+          |
|          |                           |          |
|          |     [ CAMERA VIEWFINDER ] |          |
|          |                           |          |
|          |         +-------+         |          |
|          |         | Scan  |         |          |
|          |         +-------+         |          |
|          |                           |          |
|          +---------------------------+          |
|                                                 |
|  LAST SCAN STATUS                               |
|  +-------------------------------------------+  |
|  | [ STATUS: VALID TICKET ]                  |  |
|  | Name: Abdullah Tariq                      |  |
|  | ERP: 24981                                |  |
|  | Check-in Time: 09:02 AM                   |  |
|  +-------------------------------------------+  |
|                                                 |
|  [ Scan Next ]         [ Manual ID Entry ]      |
+-------------------------------------------------+
```

*Desktop: camera stream in a central module with an attendee log feed on the right.*

### 5.2 Feedback Form Screen (/events/[id]/feedback)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES | Post-Event Feedback Submission                                                  |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|         +---------------------------------------------------------------------+         |
|         | Event: Guest Tech Talk 2026 | Host: CS Society                      |         |
|         |---------------------------------------------------------------------|         |
|         | Overall Rating                                                      |         |
|         | [ * ]  [ * ]  [ * ]  [ * ]  [   ]   (4 / 5 Stars)                   |         |
|         |                                                                     |         |
|         | Detailed Written Feedback                                           |         |
|         | [ Great presentation and Q&A session.                             ] |         |
|         | [_________________________________________________________________] |         |
|         |                                                                     |         |
|         | [ Submit Feedback ]                                                 |         |
|         +---------------------------------------------------------------------+         |
+-----------------------------------------------------------------------------------------+
```

## 6. Institutional Oversight Screen

### 6.1 Student Societies Office Oversight Dashboard (/sso/dashboard)

**Desktop View**

```text
+-----------------------------------------------------------------------------------------+
| RADES | Office of Student Societies Oversight                                  [User v] |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  CAMPUS-WIDE METRICS                                                                    |
|  +-------------------+ +-------------------+ +-------------------+ +------------------+ |
|  | Active Societies  | | Published Events  | | Total Check-Ins   | | Capacity Usage % | |
|  | 18                | | 42                | | 3,450             | | 78.4%            | |
|  +-------------------+ +-------------------+ +-------------------+ +------------------+ |
|                                                                                         |
|  ALL SOCIETIES EVENT DIRECTORY                                                          |
|  Filter by Society: [ All v ]   Filter Status: [ All v ]       [ Export Full Report ]   |
|  +------------------------------------------------------------------------------------+ |
|  | Event Name        | Society      | Date     | Registered | Attendance Rate | Status| |
|  |-------------------+--------------+----------+------------+-----------------+-------| |
|  | Hackathon 2026    | CS Society   | Nov 15   | 155 / 200  | 85.1%           | Active| |
|  | Battle of Bands   | Music Soc    | Dec 02   | 300 / 300  | --              | Active| |
|  | Annual MUN        | Debating Soc | Dec 15   | 210 / 250  | --              | Active| |
|  +------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------+
```
