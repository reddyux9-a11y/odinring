# OdinRing UI Guidelines & Design System

## **Overview**

This document defines the UI/UX guidelines for the OdinRing project, ensuring consistent design patterns across all components.

> **📘 Brand Guidelines**: For comprehensive branding information including the Mocha Medley color palette, see [BRANDING_GUIDELINES.md](./BRANDING_GUIDELINES.md)

---

## **Core Design Principles**

### **1. Card-Based Layouts**
- Use `rounded-2xl` for main card containers
- Apply `bg-muted` for card backgrounds in dark mode
- Use `p-6` for consistent padding
- `max-w-md mx-auto` for centered, constrained width cards

### **2. Spacing System**
- **Padding:** `p-6` for card content, `p-3` for tight spacing
- **Gap:** `gap-6` for grid layouts, `gap-4` for flex containers
- **Margin:** `mb-4` for vertical spacing between sections

### **3. Typography**
- **Headings:** `text-xl font-bold` for main titles
- **Body:** `text-sm` for descriptions, `text-xs` for metadata
- **Font families:** `font-serif` for names, `font-sans` for body text

### **4. Color System**

#### **Brand Colors (Mocha Medley)**
The primary brand palette is integrated into the design system:

- **Coffee Dark** (`brand-coffee-dark`): Primary text, headers, emphasis, CTAs
- **Coffee** (`brand-coffee`): Secondary text, borders, subtle elements
- **Taupe** (`brand-taupe`): Tertiary elements, dividers, muted accents
- **Sand** (`brand-sand`): Light backgrounds, card surfaces, subtle highlights
- **Off-White** (`brand-off-white`): Primary backgrounds, page surfaces

**Usage:**
```jsx
// Tailwind classes
<div className="bg-brand-off-white text-brand-coffee-dark">
  <h1 className="text-brand-coffee-dark">Title</h1>
  <p className="text-brand-coffee">Body text</p>
</div>

// Or use the utility functions
import { getBrandColor, getTextColorForBackground } from '../lib/brandColors';
```

#### **Theme Colors**
- **Background:** Dynamic based on user theme, with fallback to `#ffffff` or `brand-off-white`
- **Text:** Adaptive based on background brightness (white for dark, black for light)
- **Accent:** User-defined accent color with fallback to `brand-coffee-dark`
- **Secondary text:** `text-muted-foreground` or `text-brand-taupe`

---

## **Component Patterns**

### **Profile Preview Component** (Reference Design)

```jsx
// Main container pattern
<div className="bg-muted rounded-2xl p-6 max-w-md mx-auto">
  {/* Content */}
</div>

// Mobile frame pattern
<div className="bg-black rounded-[2.5rem] p-3 shadow-xl">
  <div className="rounded-[2rem] min-h-[500px] overflow-hidden">
    {/* Preview content */}
  </div>
</div>
```

**Key Classes:**
- Container: `bg-muted rounded-2xl p-6 max-w-md mx-auto`
- Mobile frame: `bg-black rounded-[2.5rem] p-3 shadow-xl`
- Inner content: `rounded-[2rem] min-h-[500px] overflow-hidden`

---

## **Standard Component Classes**

### **Cards**
```jsx
// Main card
<Card className="shadow-lg">
  <CardHeader className="pb-2">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    {/* Content */}
  </CardContent>
</Card>

// Muted background card
<div className="bg-muted rounded-2xl p-6">
  {/* Content */}
</div>
```

### **Buttons**
```jsx
// Primary button
<Button className="w-full justify-start text-left font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">

// Icon button
<Button variant="ghost" size="sm" className="h-5 w-5 p-0">
```

### **Avatars**
```jsx
<Avatar className="w-24 h-24 mx-auto mb-4 border-2">
  <AvatarImage src={profile.avatar} />
  <AvatarFallback className="text-xl font-bold">
    {initials}
  </AvatarFallback>
</Avatar>
```

### **Link Items**
```jsx
<Button
  className="w-full justify-start text-left font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
  size="sm"
>
  <div className="flex items-center space-x-2 w-full">
    {/* Icon */}
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
      {/* Icon component */}
    </div>
    {/* Text */}
    <div className="flex-1 text-left min-w-0">
      <div className="font-semibold text-xs truncate">Title</div>
      <div className="text-[10px] opacity-70 truncate">Description</div>
    </div>
    {/* External link icon */}
    <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
  </div>
</Button>
```

---

## **Responsive Design**

### **Breakpoints**
- **Mobile:** `< 768px` - Full width, stacked layout
- **Tablet:** `768px - 1024px` - Two column layout
- **Desktop:** `> 1024px` - Multi-column grid layout

### **Grid Layouts**
```jsx
// Dashboard grid
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
  {/* Sidebar: lg:col-span-2 */}
  {/* Main content: lg:col-span-3 */}
</div>

// Two column
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Items */}
</div>
```

---

## **Animation & Transitions**

### **Hover Effects**
```jsx
// Scale on hover
className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"

// Shadow on hover
className="hover:shadow-lg transition-shadow duration-200"
```

### **Framer Motion**
```jsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

---

## **Color Usage**

### **Theme-Aware Colors**

#### **Brand Color Utilities** (Recommended)
Use the brand color utility functions for consistent color handling:

```jsx
import { 
  getBrandColor, 
  isDarkColor, 
  getTextColorForBackground,
  getSecondaryTextColorForBackground,
  getBrandGradient 
} from '../lib/brandColors';

// Get brand colors
const primaryColor = getBrandColor('coffeeDark');
const textColor = getTextColorForBackground(backgroundColor);
const secondaryText = getSecondaryTextColorForBackground(backgroundColor);

// Use gradients
<div style={{ background: getBrandGradient('subtle') }}>
```

#### **Manual Color Detection** (if needed)
```jsx
// Determine if background is dark
const isDarkBackground = (color) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness < 128;
};

// Apply colors (prefer using utility functions)
const textColor = isBackgroundDark ? "#ffffff" : "#000000";
const secondaryTextColor = isBackgroundDark ? "#e5e7eb" : "#6b7280";
```

### **Button Styles**

#### **Brand-Aligned Buttons**
- **Primary:** `bg-brand-coffee-dark text-brand-off-white` - Main CTAs
- **Secondary:** `bg-brand-sand text-brand-coffee-dark` - Secondary actions
- **Ghost:** `bg-transparent text-brand-coffee` - Subtle actions

#### **Custom Button Styles**
- **Default:** Subtle background with hover effect
- **Filled:** Full accent color background (or `brand-coffee-dark`)
- **Outlined:** Transparent with accent border (or `brand-coffee`)
- **Glass:** Backdrop blur with transparency
- **Gradient:** Linear gradient with accent colors or brand gradient

**Example:**
```jsx
// Primary brand button
<Button className="bg-brand-coffee-dark text-brand-off-white hover:opacity-90">
  Get Started
</Button>

// Secondary brand button
<Button className="bg-brand-sand text-brand-coffee-dark border-brand-coffee">
  Learn More
</Button>
```

---

## **Icon Usage**

### **Standard Sizes**
- **Small:** `w-3 h-3` or `w-2.5 h-2.5` (for inline text)
- **Medium:** `w-4 h-4` or `w-5 h-5` (for buttons)
- **Large:** `w-6 h-6` or `w-7 h-7` (for feature icons)

### **Icon Placement**
```jsx
// Left side of button
<Icon className="w-4 h-4 mr-1" />
<Text>Label</Text>

// Right side of button (external link)
<Text>Label</Text>
<ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
```

---

## **Form Elements**

### **Input Fields**
```jsx
<Label>Label Text</Label>
<Input 
  className="w-full"
  placeholder="Placeholder text"
/>
```

### **Select/Dropdown**
```jsx
<Select>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

---

## **Empty States**

### **Pattern**
```jsx
<div className="text-center py-8">
  <div className="text-3xl mb-2">🔗</div>
  <p className="text-xs" style={{ color: secondaryTextColor }}>
    No active links
  </p>
</div>
```

---

## **Footer Pattern**

```jsx
{profile.show_footer !== false && (
  <div className="text-center pb-6 flex items-center justify-center gap-2">
    <span className="text-xs" style={{ color: secondaryTextColor }}>
      Powered by
    </span>
    <img 
      src="/OdinRingLogo.png" 
      alt="OdinRing" 
      className="h-4 w-4 object-contain opacity-70"
    />
    <span className="text-xs font-semibold" style={{ color: accentColor }}>
      OdinRing
    </span>
  </div>
)}
```

---

## **Accessibility**

### **Color Contrast**
- Ensure WCAG AA compliance (4.5:1 for normal text)
- Use opacity for secondary text: `opacity-70`
- Provide alternative text for icons and images

### **Keyboard Navigation**
- All interactive elements should be keyboard accessible
- Use `tabIndex` appropriately
- Provide focus indicators

### **Screen Readers**
- Use semantic HTML (`<button>`, `<nav>`, etc.)
- Provide `aria-label` for icon-only buttons
- Use `alt` text for images

---

## **Best Practices**

### **1. Consistency**
- Use the same spacing values across components
- Maintain consistent border radius (`rounded-2xl`, `rounded-lg`, etc.)
- Use shadcn/ui components where possible

### **2. Performance**
- Lazy load images
- Use `truncate` for long text
- Minimize re-renders with proper React patterns

### **3. Responsiveness**
- Always test on mobile, tablet, and desktop
- Use responsive classes (`sm:`, `md:`, `lg:`, etc.)
- Hide/show elements based on screen size when appropriate

### **4. Theme Support**
- Always support both light and dark themes
- Use theme-aware colors (via `isDarkBackground` function)
- Test with various user-defined accent colors

---

## **Component Checklist**

When creating or updating a component, ensure:

- [ ] Uses consistent spacing (`p-6`, `gap-6`, etc.)
- [ ] Follows card pattern if applicable (`bg-muted rounded-2xl`)
- [ ] Implements hover/active states with transitions
- [ ] Supports theme-aware colors
- [ ] Is responsive (mobile, tablet, desktop)
- [ ] Has proper empty states
- [ ] Uses appropriate icon sizes
- [ ] Follows accessibility guidelines
- [ ] Uses shadcn/ui components where possible
- [ ] Matches ProfilePreview component styling for consistency

---

## **Reference Components**

- **ProfilePreview.jsx** - Main reference for card layouts and mobile preview
- **SimpleLinkManager.jsx** - Link list patterns
- **ItemManager.jsx** - Item/product display patterns
- **PremiumSidebar.jsx** - Navigation patterns

---

## **Brand Color Quick Reference**

### **Tailwind Classes**
```jsx
// Backgrounds
bg-brand-coffee-dark    // Primary dark background
bg-brand-coffee          // Secondary dark background
bg-brand-taupe          // Tertiary background
bg-brand-sand           // Light background
bg-brand-off-white      // Primary light background

// Text
text-brand-coffee-dark  // Primary text
text-brand-coffee       // Secondary text
text-brand-taupe        // Tertiary/muted text
```

### **CSS Variables**
```css
/* Use in custom CSS */
.my-element {
  background-color: hsl(var(--brand-coffee-dark));
  color: hsl(var(--brand-off-white));
}
```

### **JavaScript Utilities**
```jsx
import brandColors, { 
  getBrandColor, 
  getBrandGradient,
  isDarkColor 
} from '../lib/brandColors';

// Get colors
const color = getBrandColor('coffeeDark');
const gradient = getBrandGradient('subtle');
```

---

## **Related Documentation**

- **[BRANDING_GUIDELINES.md](./BRANDING_GUIDELINES.md)** - Complete brand identity and color system
- **[brandColors.js](./frontend/src/lib/brandColors.js)** - Brand color utility functions

---

**Last Updated:** 2025-01-27  
**Version:** 2.0  
**Maintainer:** OdinRing Development Team

