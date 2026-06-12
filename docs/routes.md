# Route Documentation

The application utilizes the Next.js App Router. Pages are mapped directly to directories inside `src/app/`.

## Pages

| Route | Purpose | Components |
| --- | --- | --- |
| `/` | The main landing page. Introduces the concept of EcoBuddy AI and provides authentication entry points. | `src/app/page.tsx` |
| `/dashboard` | The user's primary hub. Displays the personalized 3D Planet (React Three Fiber), current XP, green score, and daily challenges. | `src/app/dashboard/page.tsx` |
| `/carbon-tracker` | The Carbon Tracker Hub. A production-grade tracking interface with interactive widgets and Recharts data visualizations. | `src/app/carbon-tracker/page.tsx` |
| `/simulator` | The Earth 2050 timeline tool. Allows users to visually compare Business-As-Usual (BAU) vs Sustainable trajectories. | `src/app/simulator/page.tsx` |
| `/twin` | The conversational interface for Sprig. A chat-like layout optimized for reading AI insights. | `src/app/twin/page.tsx` |

## Layouts

- `src/app/layout.tsx`: The root layout. Includes the main navigation bar, global font configurations (Geist Sans/Mono), and the master CSS imports.
- `src/app/loading.tsx`: A global loading state utilizing the `LeafLoader` component for smooth page transitions.
