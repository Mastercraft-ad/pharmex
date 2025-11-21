# PharmaBlock Systems - Design Guidelines

## Design Approach

**System-Based with Custom Enhancement**: Medical/pharmaceutical application requiring trust, clarity, and professional credibility. Drawing inspiration from healthcare platforms like Epic MyChart and pharmaceutical tracking systems, with clean Material Design principles for data-dense interfaces.

## Core Design Principles

1. **Trust & Credibility**: Professional medical aesthetic that conveys security and authenticity
2. **Clarity Over Complexity**: Information hierarchy optimized for quick decision-making
3. **Role-Appropriate UX**: Distinct interfaces for Manufacturers, Distributors, Pharmacies, and Consumers
4. **Verification-First**: Prominent, accessible verification flows as primary interaction

## Typography

**Font Family**: Inter (via Google Fonts CDN)
- **Headings**: 700 weight, sizes: text-3xl (dashboard titles), text-2xl (section headers), text-xl (card titles)
- **Body**: 400 weight, text-base for primary content
- **Metadata/Labels**: 500 weight, text-sm for labels, text-xs for timestamps
- **Status Text**: 600 weight, text-lg for verification results

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Cards: p-6 for content padding
- Sections: space-y-6 for vertical rhythm
- Grid gaps: gap-4 for tight layouts, gap-6 for dashboards
- Container: max-w-7xl with mx-auto for content width

**Dashboard Structure**:
- Fixed header (h-16) with logo, user info, notifications
- Sidebar (w-64) on desktop, collapsible on tablet, bottom nav on mobile
- Main content area: p-6 on desktop, p-4 on mobile
- Statistics cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Data tables below statistics with full-width layout

## Color Palette (Medical Professional)

**Primary Colors**:
- Blue: #2563eb (primary actions, headers, authenticated state)
- Purple: #7c3aed (secondary actions, premium features)

**Status Colors**:
- Success/Verified: #10b981 (authentic drugs, completed transfers)
- Warning/Expiring: #f59e0b (near-expiry, pending actions)
- Danger/Counterfeit: #ef4444 (rejected, counterfeit, critical alerts)

**Neutrals**:
- Background: #f9fafb
- Cards/Surfaces: #ffffff
- Borders: #e5e7eb
- Text Primary: #111827
- Text Secondary: #6b7280

## Component Library

### Statistics Cards
- White background (bg-white) with subtle shadow (shadow-sm)
- Border: border border-gray-200
- Rounded corners: rounded-lg
- Large metric number: text-3xl font-bold
- Icon in colored circle: h-12 w-12 rounded-full
- Trend indicators: Small up/down arrows with percentage
- Layout: p-6 with flex justify-between items-start

### Data Tables
- Header: bg-gray-50 with font-semibold text-xs uppercase text-gray-600
- Rows: Alternating white/gray-50 (striped)
- Cell padding: px-6 py-4
- Borders: border-b border-gray-200
- Actions column: Right-aligned with icon buttons
- Empty state: Centered icon + text in muted colors
- Pagination: Bottom-right with page numbers and arrows

### Forms
- Labels: text-sm font-medium text-gray-700 mb-1
- Inputs: border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500
- Required indicators: Red asterisk after label
- Error messages: text-red-600 text-sm mt-1
- Submit buttons: Large (px-6 py-3), primary color, full-width on mobile
- Multi-step forms: Progress indicator at top with numbered steps

### Verification Result Display
- Full-screen modal on mobile, centered card on desktop
- Large status icon: 128px check/X circle
- Background color fills entire card based on status
- Status message: text-2xl font-bold mb-4
- Drug details: Grid layout with label-value pairs
- Transfer timeline: Vertical line with nodes
- Action buttons: Fixed at bottom on mobile

### QR Scanner Interface
- Full viewport camera view
- Overlay guide: White border square in center
- Flashlight toggle: Floating button top-right
- Manual entry link: Bottom of screen
- "Scanning..." indicator: Centered spinner with text

### Transfer History Timeline
- Vertical line (border-l-2 border-blue-500) on left
- Nodes: Circles with role icons
- Timestamp: text-xs text-gray-500
- Location/notes: text-sm text-gray-600 italic
- Status badges: Inline colored pills

### Navigation
- **Desktop Sidebar**: Fixed left, icons + text labels, active state with blue background
- **Mobile**: Bottom tab bar (h-16) with 4-5 icons, labels below icons
- **Header**: Logo left, user avatar + name right, notification bell with badge

### Modals & Overlays
- Backdrop: bg-black/50
- Modal: max-w-2xl centered, bg-white rounded-lg
- Header: border-b with title and close button
- Content: p-6 with scrollable area if needed
- Footer: border-t with action buttons right-aligned

## Role-Specific Dashboards

### Manufacturer Dashboard
- Hero stats: 4 cards (Total Batches, Active, Transferred, Recalled)
- Primary action: Large "Register New Batch" button (bg-blue-600)
- Recent batches table with inline transfer actions
- Batch detail modal with QR code preview

### Distributor Dashboard  
- Split view: Incoming (left) and Outbound (right) transfers
- Accept/Reject actions prominent with green/red colors
- Inventory list with search and filter dropdowns
- Transfer initiation form in slide-over panel

### Pharmacy Verification Terminal
- Large centered "Scan to Verify" button (h-24, w-full on mobile)
- Recent verifications list below with color-coded results
- Verification modal: Full-screen with dismissible backdrop
- Statistics: Small cards showing daily/weekly verification counts

### Consumer Public Page
- Minimal header: Logo + "Verify Medicine" text only
- Hero: Large heading "Verify Your Medicine" with scan button
- Two-column layout: QR scan (left) + Manual entry (right)
- Educational section: "Why Verify?" with icons
- Footer: Report suspicious link only

## Images

**Hero Section**: Large pharmaceutical-themed image
- Desktop: 600px height, showing medicine bottles, pills, or laboratory
- Mobile: 400px height, cropped to focus on product
- Overlay: Semi-transparent blue gradient (from-blue-600/80 to-transparent)
- Buttons on hero: Backdrop blur (backdrop-blur-sm bg-white/20)

**Dashboard Icons**: Use Heroicons (outline style) via CDN
- Verification: CheckBadgeIcon
- Transfer: ArrowsRightLeftIcon  
- Batch: CubeIcon
- QR: QrCodeIcon
- Alert: ExclamationTriangleIcon

**Empty States**: Centered illustrations (via placeholder comments)
- No batches: Box icon with "No batches registered yet"
- No transfers: Truck icon with "No pending transfers"
- No verifications: Shield icon with "Start verifying products"

## Accessibility

- Form inputs: Consistent border-2 on focus with ring offset
- Color contrast: All text meets WCAG AA standards
- Interactive elements: Minimum 44px touch target
- Status indicators: Icons + text, never color alone
- Skip navigation link for keyboard users

## Responsive Breakpoints

- Mobile-first approach
- sm (640px): Stack to 2-column grids
- md (768px): Show sidebar, 2-column forms
- lg (1024px): 3-4 column grids, full dashboard layout
- xl (1280px): Max content width, comfortable spacing