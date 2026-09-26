# Smart Campus AI Design System

## Foundation

### Color System
- **Primary**: #F21722 (Institutional Red)
- **Secondary**: #2563EB (Blue)
- **Accent**: #10B981 (Emerald)
- **Background**: #FFFFFF (White)
- **Surface**: #F8FAFC (Slate 50)
- **Border**: #E2E8F0 (Slate 200)
- **Text Primary**: #1E293B (Slate 800)
- **Text Secondary**: #64748B (Slate 500)
- **Text Muted**: #94A3B8 (Slate 400)
- **Success**: #10B981 (Emerald)
- **Warning**: #F59E0B (Amber)
- **Error**: #EF4444 (Red)
- **Info**: #3B82F6 (Blue)

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Display**: 3rem / 3.5rem, 700
- **H1**: 2.25rem / 2.5rem, 700
- **H2**: 1.875rem / 2.25rem, 600
- **H3**: 1.5rem / 2rem, 600
- **H4**: 1.25rem / 1.75rem, 600
- **Body**: 1rem / 1.5rem, 400
- **Small**: 0.875rem / 1.25rem, 400
- **Caption**: 0.75rem / 1rem, 400
- **Label**: 0.75rem / 1rem, 500

### Spacing System (4px grid)
- 0px, 4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, 36px, 40px, 44px, 48px, 52px, 56px, 60px, 64px, 72px, 80px, 96px, 128px

### Border Radius
- None: 0px
- Sm: 4px
- Md: 8px
- Lg: 12px
- Xl: 16px
- Full: 9999px

### Shadows
- Sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- Md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- Lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.08)
- Xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)

## Components

### Button Variants
- **Primary**: bg-primary text-white hover:bg-primary/90
- **Secondary**: bg-white text-primary border border-primary hover:bg-primary/50
- **Outline**: border border-primary text-primary hover:bg-primary/50
- **Ghost**: text-primary hover:bg-primary/50
- **Danger**: bg-error text-white hover:bg-error/90
- **Success**: bg-success text-white hover:bg-success/90

### Input Fields
- Border: border border-input focus:border-primary focus:ring-2 focus:ring-primary/20
- Background: bg-white
- Text: text-primary
- Placeholder: text-muted
- Radius: rounded-md
- Padding: px-4 py-3
- Font: text-base

### Cards
- Background: bg-white
- Border: border border-border
- Radius: rounded-lg
- Shadow: shadow-md
- Padding: p-6

### Navigation
- Sidebar: bg-white border-r border-border
- Navbar: bg-white border-b border-border
- Active Item: bg-primary/50 text-primary
- Hover Item: bg-primary/25

### Tables
- Header: bg-border text-left text-label font-medium
- Body: bg-white
- Row: hover:bg-primary/10
- Border: border-b border-border

## Usage Guidelines

### Do's
- Use consistent spacing (4px grid)
- Maintain visual hierarchy
- Provide clear feedback for all interactions
- Use semantic color meanings consistently
- Ensure adequate contrast (WCAG AA minimum)
- Design for mobile-first
- Keep forms simple and focused
- Use progressive disclosure for complex information

### Don'ts
- Don't use more than 2-3 typefaces
- Don't use inconsistent spacing
- Don't rely on color alone to convey meaning
- Don't use low contrast text
- Don't overcomplicate forms
- Don't use excessive animations
- Don't break established patterns without reason