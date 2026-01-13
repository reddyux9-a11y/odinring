# OdinRing Branding Guidelines

## **Brand Identity**

OdinRing is a premium link-in-bio platform with a sophisticated, warm, and approachable brand identity. Our design language reflects elegance, professionalism, and user-centricity.

---

## **Color Palette: Mocha Medley**

The Mocha Medley palette is our primary brand color system, inspired by rich coffee tones that convey warmth, sophistication, and premium quality.

### **Primary Brand Colors**

| Color Name | Hex Code | HSL | Usage |
|------------|----------|-----|-------|
| **Coffee Dark** | `#332820` | `hsl(30, 25%, 18%)` | Primary text, headers, emphasis |
| **Coffee** | `#5A4D40` | `hsl(30, 18%, 30%)` | Secondary text, borders, subtle backgrounds |
| **Taupe** | `#98867B` | `hsl(30, 12%, 52%)` | Tertiary elements, dividers, muted accents |
| **Sand** | `#D0C6BD` | `hsl(30, 18%, 75%)` | Light backgrounds, card surfaces, subtle highlights |
| **Off-White** | `#EFEDEA` | `hsl(30, 10%, 93%)` | Primary backgrounds, page surfaces, clean spaces |

### **Color Psychology**

- **Coffee Dark & Coffee**: Convey trust, stability, and premium quality. Use for primary actions and important content.
- **Taupe**: Provides balance and sophistication. Ideal for secondary information and subtle UI elements.
- **Sand & Off-White**: Create breathing room and clarity. Perfect for backgrounds and content areas.

### **Accessibility**

All color combinations meet WCAG AA standards:
- Coffee Dark on Off-White: **12.5:1** contrast ratio ✅
- Coffee on Off-White: **7.2:1** contrast ratio ✅
- Taupe on Off-White: **3.8:1** contrast ratio (use for non-text elements) ✅

---

## **Design System Integration**

### **CSS Variables**

The Mocha Medley palette is integrated into our design system via CSS variables:

```css
:root {
  /* Brand Colors - Mocha Medley */
  --brand-coffee-dark: 30 25% 18%;    /* #332820 */
  --brand-coffee: 30 18% 30%;          /* #5A4D40 */
  --brand-taupe: 30 12% 52%;          /* #98867B */
  --brand-sand: 30 18% 75%;           /* #D0C6BD */
  --brand-off-white: 30 10% 93%;      /* #EFEDEA */
}
```

### **Tailwind Classes**

Use these Tailwind classes for brand colors:

- `bg-brand-coffee-dark` / `text-brand-coffee-dark`
- `bg-brand-coffee` / `text-brand-coffee`
- `bg-brand-taupe` / `text-brand-taupe`
- `bg-brand-sand` / `text-brand-sand`
- `bg-brand-off-white` / `text-brand-off-white`

---

## **Color Usage Guidelines**

### **Primary Actions**

Use **Coffee Dark** for:
- Primary buttons
- Important CTAs
- Headings (h1, h2)
- Navigation active states
- Brand logo and identity elements

### **Secondary Elements**

Use **Coffee** for:
- Secondary buttons
- Body text on light backgrounds
- Borders and dividers
- Icon colors
- Form labels

### **Tertiary Elements**

Use **Taupe** for:
- Placeholder text
- Disabled states
- Subtle borders
- Secondary information
- Metadata and timestamps

### **Backgrounds**

Use **Sand** for:
- Card backgrounds
- Input fields
- Subtle section backgrounds
- Hover states on light elements

Use **Off-White** for:
- Page backgrounds
- Main content areas
- Modal backgrounds
- Clean, minimal surfaces

---

## **Typography & Color Combinations**

### **Recommended Text Colors**

| Background | Primary Text | Secondary Text | Accent Text |
|------------|--------------|----------------|-------------|
| Off-White | Coffee Dark | Coffee | Coffee Dark |
| Sand | Coffee Dark | Coffee | Coffee |
| Coffee Dark | Off-White | Sand | Sand |
| Coffee | Off-White | Sand | Off-White |

### **Headings**

```css
h1, h2 { color: hsl(var(--brand-coffee-dark)); }
h3, h4 { color: hsl(var(--brand-coffee)); }
```

### **Body Text**

```css
body { color: hsl(var(--brand-coffee)); }
.secondary-text { color: hsl(var(--brand-taupe)); }
```

---

## **Component Color Patterns**

### **Buttons**

**Primary Button:**
- Background: `bg-brand-coffee-dark`
- Text: `text-brand-off-white`
- Hover: Darken by 10%

**Secondary Button:**
- Background: `bg-brand-sand`
- Text: `text-brand-coffee-dark`
- Border: `border-brand-coffee`

**Ghost Button:**
- Background: Transparent
- Text: `text-brand-coffee`
- Hover: `bg-brand-sand`

### **Cards**

**Default Card:**
- Background: `bg-brand-off-white` or `bg-white`
- Border: `border-brand-sand`
- Shadow: Subtle elevation

**Elevated Card:**
- Background: `bg-white`
- Border: `border-brand-taupe`
- Shadow: Medium elevation

### **Input Fields**

- Background: `bg-brand-off-white`
- Border: `border-brand-sand`
- Focus Border: `border-brand-coffee`
- Placeholder: `text-brand-taupe`

### **Links**

- Default: `text-brand-coffee-dark`
- Hover: `text-brand-coffee` with underline
- Visited: `text-brand-taupe`

---

## **Dark Mode Adaptations**

In dark mode, the Mocha Medley palette adapts:

```css
html.dark {
  --brand-coffee-dark: 30 25% 85%;    /* Lightened for dark bg */
  --brand-coffee: 30 18% 70%;         /* Lightened */
  --brand-taupe: 30 12% 60%;          /* Lightened */
  --brand-sand: 30 18% 25%;           /* Darkened for dark bg */
  --brand-off-white: 30 10% 10%;      /* Dark background */
}
```

---

## **Gradients**

### **Brand Gradients**

Use these gradients for special elements:

```css
/* Subtle gradient */
background: linear-gradient(135deg, 
  hsl(var(--brand-off-white)) 0%, 
  hsl(var(--brand-sand)) 100%
);

/* Medium gradient */
background: linear-gradient(135deg, 
  hsl(var(--brand-sand)) 0%, 
  hsl(var(--brand-taupe)) 100%
);

/* Rich gradient */
background: linear-gradient(135deg, 
  hsl(var(--brand-coffee)) 0%, 
  hsl(var(--brand-coffee-dark)) 100%
);
```

---

## **Accent Colors**

While Mocha Medley is our primary palette, we support user-defined accent colors for customization. When using custom accents:

1. Ensure sufficient contrast (WCAG AA minimum)
2. Test against both light and dark backgrounds
3. Provide fallback to brand colors if contrast fails

---

## **Logo & Brand Assets**

### **Logo Usage**

- **Primary**: Use on light backgrounds (Off-White, Sand)
- **Inverted**: Use on dark backgrounds (Coffee Dark, Coffee)
- **Minimum Size**: 24px height for digital use
- **Clear Space**: Equal to logo height on all sides

### **Brand Icon**

The OdinRing logo should maintain:
- Consistent sizing across contexts
- Proper contrast with background
- Respect for clear space requirements

---

## **Implementation Examples**

### **Landing Page**

```jsx
<div className="bg-brand-off-white">
  <h1 className="text-brand-coffee-dark">Welcome to OdinRing</h1>
  <p className="text-brand-coffee">Your link-in-bio platform</p>
  <Button className="bg-brand-coffee-dark text-brand-off-white">
    Get Started
  </Button>
</div>
```

### **Card Component**

```jsx
<Card className="bg-white border-brand-sand">
  <CardHeader>
    <CardTitle className="text-brand-coffee-dark">Title</CardTitle>
  </CardHeader>
  <CardContent className="text-brand-coffee">
    Content here
  </CardContent>
</Card>
```

### **Navigation**

```jsx
<nav className="bg-brand-off-white border-b border-brand-sand">
  <a className="text-brand-coffee-dark hover:text-brand-coffee">
    Link
  </a>
</nav>
```

---

## **Do's and Don'ts**

### **✅ Do**

- Use Coffee Dark for primary actions and important content
- Maintain consistent color usage across components
- Test color combinations for accessibility
- Use Sand and Off-White for backgrounds
- Apply brand colors with appropriate opacity for subtle effects

### **❌ Don't**

- Mix Mocha Medley with unrelated color palettes
- Use Taupe for primary text (insufficient contrast)
- Overuse Coffee Dark (can feel heavy)
- Ignore accessibility contrast requirements
- Create custom color variations outside the palette

---

## **Brand Voice & Visual Language**

The Mocha Medley palette supports our brand voice:

- **Warm & Inviting**: The coffee tones create a welcoming atmosphere
- **Professional**: Darker shades convey trust and reliability
- **Sophisticated**: Balanced neutrals suggest premium quality
- **Approachable**: Light tones ensure accessibility and clarity

---

## **Resources**

- **Primary Palette**: Mocha Medley (5 colors)
- **CSS Variables**: Defined in `index.css`
- **Tailwind Config**: Extended in `tailwind.config.js`
- **Component Library**: shadcn/ui with brand color overrides

---

**Last Updated:** 2025-01-27  
**Version:** 1.0  
**Maintainer:** OdinRing Design Team







