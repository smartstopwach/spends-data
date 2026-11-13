# GharKaHisaab — Ghar ka Paisa & Spends Tracker

Ek clean, fast aur easy-to-use web app jisme aap **Ghar se aaya paisa (+)** add kar sakte hain aur apne **daily spends / kharche (-)** calculate aur track kar sakte hain.

## Key Features

- **Live Wallet Balance**: `Total Ghar se Aaya - Total Spends` ka automatic hisaab, saath mein **UPI/Bank** aur **Cash** balance split.
- **Ghar Se Paisa Add Karein (+)**: Home allowance (Papa/Mummy), Relatives/Gift, Stipend, ya Refund turant wallet mein add karein.
- **Smart Spend Calculator (-)**:
  - **Inline Math**: Amount box mein seedha `40 + 25 + 60` likhein aur live `= ₹125` calculate karein.
  - **Multi-Item Calculator (Hisaab Jodein)**: Kai chhote kharche (Auto, Chai, Notes, Groceries) ek saath list karke total calculate karein aur 1 combined spend ya alag-alag spends ke roop mein save karein.
- **Monthly Analytics & Budget**:
  - Mahine ka hisaab (`< Month >` filter + `All Time` view)
  - Monthly Budget limit progress bar + bache hue dino ke liye **Safe Daily Spend (`/day`)**
  - Interactive **Category Donut Chart** (Food & Chai, Travel & Auto, Rent & Mess, Study, Recharge, Groceries, etc.)
  - **Roz ka Kharcha** day-by-day bar chart with daily average line
- **100% Browser LocalStorage + Backup**:
  - Koi login ya server setup zaroori nahi — sara data aapke browser mein safe rehta hai.
  - **Excel / CSV Export** aur **JSON Backup / Restore** built-in hai.

## Local Setup

```bash
npm install
npm run dev
```

Production static build banane ke liye (Vercel / Netlify / GitHub Pages ke liye ready):

```bash
npm run build
```
