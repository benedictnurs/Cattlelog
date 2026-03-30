# Project Structure

This project is organized in a modular component/page separation.

```
.
├── components/             # UI and logic components separated by page
│   ├── cooked_class/       # CookedClass.tsx
│   ├── grade_distribution/ # GradeDistPage.tsx and LandingGradeDistPage.tsx
│   ├── home/               # Home.tsx
│   ├── landing_page/       # LandingPage.tsx
│   ├── professor_page/     # ProfessorPage.tsx
│   ├── types/              # Shared TypeScript types and interfaces
│   └── ui/
│
├── pages/                  # Route-level components used in React Router
│   ├── About.tsx
│   ├── CookedClass.tsx
│   ├── FavoritesPage.tsx
│   ├── GiveEmail.tsx
│   ├── GradeDistBlog.tsx
│   ├── GradeDistPage.tsx
│   ├── Home.tsx
│   ├── LandingGradeDistPage.tsx
│   ├── LandingPage.tsx
│   ├── ProfessorPage.tsx
│   ├── QRInternalPage.tsx
│   └── WriteReview.tsx
│
├── utils/                  # Utility functions and helpers
│
├── App.tsx                 # Main App component
├── main.tsx                # App entry point for ReactDOM
```

## Key Conventions

- **`components/`** is split into folders by feature or page for better organization.
- **`pages/`** contains top-level views used in routing (`<Route path=... />`), see `App.tsx`.
