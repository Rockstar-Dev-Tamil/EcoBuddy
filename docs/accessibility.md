# EcoBuddy Accessibility (A11y) Standards

EcoBuddy AI is engineered to be highly accessible and navigable for all users, including those using assistive technologies like screen readers or keyboard-only navigation. We target a **100/100 score in Lighthouse Accessibility Auditing**.

## 1. Screen Reader Fallbacks (ARIA)

Interactive and graphical components contain structured screen-reader-only metadata:
- **Graphical Radial Charts:** We include `<div className="sr-only">` blocks that serialize dynamic Recharts data in clear textual formats (e.g. *"Radial bar chart showing Food: 12.0 kg CO2, Transport: 5.5 kg CO2"*).
- **Semantics:** Landmark tags (`section`, `header`, `nav`, `main`) isolate layouts, using `aria-labelledby` linking directly to the visual header nodes.
- **Micro-interactions:** Icons and graphical progress loops are explicitly configured with `aria-hidden="true"` to hide decorative animations from screen readers, while parent containers contain status descriptions.

---

## 2. Accessible Form Elements

All forms and input fields are explicitly linked to native labels or use `aria-label` tags for assistive technology context:
- Input labels use the `htmlFor` attribute linking to input IDs.
- OTP forms contain clear description tags for validation state notifications.
- Buttons have clear, uppercase `aria-label` definitions indicating action scope (e.g. `<button aria-label="Log Walk/Cycle commute action">`).

---

## 3. Keyboard Nav & Focus Indicators

We follow native browser focus behavior to support accessibility guidelines:
- Custom sidebar menu items and dashboard buttons are keyboard navigable.
- All interactive links, buttons, and form inputs utilize clear focus outline styling (`focus:outline focus:ring-1 focus:ring-accent`).
- High-contrast colors are prioritized; background dark tones (`#07110A`) paired with bright green (`#00E676`) and cyan text ensure AA/AAA contrast ratios for readability.
