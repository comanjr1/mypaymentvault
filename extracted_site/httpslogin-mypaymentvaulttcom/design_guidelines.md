# MyPaymentVault Login Application - Design Guidelines

## Design Approach
**Selected Approach:** Hybrid - Custom branded design with Material Design principles for form interactions and feedback states. The application requires a professional, secure appearance that inspires trust while maintaining modern UX patterns for authentication flows.

**Key Design Principles:**
- Security-first visual language conveying trust and professionalism
- Minimal cognitive load during authentication process
- Progressive disclosure for verification steps
- Accessibility-compliant contrast and interaction patterns

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**
- Primary Brand: 0 0% 13% (equivalent to #212121)
- Background Base: 0 0% 100% (white)
- Background Gradient End: 0 0% 13%
- Text Primary: 0 0% 13% (on light backgrounds)
- Text Secondary: 0 0% 100% (on dark backgrounds)
- Error/Danger: 355 70% 54% (#dc3545)
- Success/Valid: 142 71% 45% (#228C22)
- Border Default: 0 0% 80%
- Border Focus: 0 0% 13%

**Interactive States**
- Input Focus: 0 0% 13% border with subtle shadow
- Button Hover: 0 0% 20%
- Modal Overlay: 0 0% 0% at 50% opacity
- Disabled: 0 0% 70%

### B. Typography

**Font Stack:** System fonts for optimal performance and readability
- Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- Fallback: sans-serif

**Type Scale**
- Page Title: 24px, font-weight 600, line-height 1.3
- Section Heading (H5): 18px, font-weight 500, line-height 1.4
- Body Text: 14px, font-weight 400, line-height 1.6
- Input Labels: 14px, font-weight 400, transforms on focus
- Button Text: 15px, font-weight 500
- Helper Text/Errors: 13px, font-weight 400
- Footer Links: 12px, font-weight 400

### C. Layout System

**Spacing Primitives:** Use Tailwind units 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32
- Section padding: py-20 (desktop), py-12 (mobile)
- Component spacing: gap-6 to gap-8
- Form field margins: mb-6
- Button padding: px-6 py-3

**Grid Structure**
- Main container: max-w-7xl with horizontal padding px-4
- Two-column layout on desktop (5/12 form, 6/12 image with offset)
- Single column stack on mobile with image first, form second
- Form container: max-w-md centered on its column

**Responsive Breakpoints**
- Mobile: < 768px (single column, image hero at top)
- Tablet: 768px - 1024px (maintain split layout, adjust proportions)
- Desktop: > 1024px (full split layout with generous spacing)

### D. Component Library

**Header Navigation**
- Full-width with max-w-7xl container
- Logo left-aligned (height 40px)
- Language selector right-aligned with globe icon + dropdown
- Background: transparent over main content
- Mobile: Compressed to essentials, hamburger if needed

**Floating Label Inputs**
- Border: 1px solid #ccc, border-radius 8px
- Padding: 12px 16px
- Label animates up and scales to 12px on focus/filled
- Focus state: border changes to #212121 with 0 0 0 3px shadow at 10% opacity
- Error state: border #dc3545, error text below in 13px
- Success state: border #228C22 (for validated fields)

**Primary Button**
- Background: #212121
- Text: white, 15px, font-weight 500
- Padding: 12px 24px
- Border-radius: 8px
- Full width on mobile
- Hover: background #333 with smooth 200ms transition
- Disabled: opacity 0.6, cursor not-allowed

**Modal Overlays**
- Full viewport overlay with rgba(0,0,0,0.5) backdrop
- Modal card: white background, border-radius 12px, max-width 360px
- Padding: 24px
- Box-shadow: 0 6px 18px rgba(0,0,0,0.25)
- Animation: fadeIn 200ms for overlay, slideUp 250ms for content
- Close button or Cancel action clearly visible

**OTP Input Field**
- Specialized input: letter-spacing 4px, text-align center
- Width: 100%, padding 10px 12px
- Font-size: 16px for mobile compatibility
- Border states: default gray, valid green, invalid red
- Real-time validation feedback

**Footer**
- Background: transparent or subtle gray
- Horizontal list of links with separators
- Text: 12px, color #666
- Links: underline on hover
- Padding: py-8
- Mobile: Stack links vertically or wrap

**Error/Success Messages**
- Font-size: 13-14px
- Margin-top: 8px, margin-left: 7px
- Icons optional but recommended for quick scanning
- Error: #dc3545, Success: #228C22

### E. Visual Treatments

**Background Treatment**
- Login form section: White background
- Image/brand section: Linear gradient from white (top 5%) to #212121
- Smooth transition creating depth and brand presence
- No distracting patterns or textures

**Split Layout Design**
- Left (or top on mobile): Clean white background for form legibility
- Right (or bottom on mobile): Dark branded section with gradient
- Visual balance: 40% form, 60% brand image/gradient

**Images**
- Hero/Brand Image: Full-height image on right side showing MyPaymentVault branding or secure payment visual
- Logo: Clean SVG in header, height 40px, maintains aspect ratio
- Image description: Professional financial/payment imagery with modern aesthetic, conveying security and reliability

**Interactive Feedback**
- Input focus: Smooth border color transition (200ms)
- Button interactions: Subtle background darkening on hover
- Modal entrance: Coordinated fade + slide animations
- Loading states: Subtle spinner or skeleton screens for async operations
- No excessive animations - security applications should feel stable

**Accessibility Features**
- WCAG AA contrast ratios minimum (4.5:1 for text)
- Focus indicators clearly visible with 3px outlines
- Keyboard navigation fully supported
- ARIA labels for screen readers on all interactive elements
- Error messages programmatically associated with inputs

**Anti-Copy Protection Indicators**
- Subtle visual cues that protection is active (optional small icon)
- Non-intrusive alert styling for "Not allowed" messages
- Maintain user trust while enforcing security

## Special Considerations

**Security Visual Language**
- Clean, professional aesthetic free from gaming or casual elements
- Trust indicators: SSL badges, copyright notice, official links visible
- No flashy animations that might suggest unprofessionalism
- Muted, serious color palette reinforcing financial security

**Progressive Disclosure Flow**
1. Initial login form (username, password)
2. Email verification modal (on submit)
3. OTP verification modal (after email submission)
4. Each step clearly communicated with headings and instructions

**Mobile Optimization**
- Touch-friendly targets (minimum 44px height)
- Prevent zoom on input focus with font-size: 16px minimum
- Stack layout with image hero creating immediate brand recognition
- Simplified navigation retaining essential elements

This design creates a trustworthy, modern authentication experience that balances security requirements with user-friendly interactions, suitable for a payment vault application handling sensitive financial access.