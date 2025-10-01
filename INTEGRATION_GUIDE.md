# Integration Guide: Rating System for WIGG App

## Step 1: Install Dependencies

Add the required Chart.js packages to your project:

```bash
npm install chart.js react-chartjs-2 chartjs-plugin-annotation
# or
yarn add chart.js react-chartjs-2 chartjs-plugin-annotation
```

## Step 2: Place the Component

Copy `RatingSystem.tsx` to your components directory:

```
src/
  components/
    RatingSystem.tsx  ← Place the component here
```

## Step 3: Add Routing (if needed)

### Option A: Add as a new page
If using React Router, add a route to your router configuration:

```tsx
// In your router file (e.g., App.tsx or routes.tsx)
import RatingSystem from './components/RatingSystem';

// Add to your routes:
<Route path="/rate" element={<RatingSystem />} />
```

### Option B: Embed in existing page
Import and use directly in any component:

```tsx
import RatingSystem from './components/RatingSystem';

function MyPage() {
  return (
    <div>
      <RatingSystem />
    </div>
  );
}
```

## Step 4: Add Animation to Tailwind Config

Add the fade-in animation to your `tailwind.config.ts`:

```ts
export default {
  // ... existing config
  theme: {
    extend: {
      // ... existing extensions
      keyframes: {
        'fade-in': {
          from: {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        // ... other keyframes
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        // ... other animations
      }
    }
  }
} satisfies Config;
```

## Step 5: State Persistence (Optional)

### Option A: Local Storage
To persist ratings across sessions, add this to the component:

```tsx
// Add to RatingSystem component
useEffect(() => {
  // Load from localStorage on mount
  const saved = localStorage.getItem('wigg-ratings');
  if (saved) {
    setRatingHistory(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  // Save to localStorage whenever history changes
  if (ratingHistory.length > 0) {
    localStorage.setItem('wigg-ratings', JSON.stringify(ratingHistory));
  }
}, [ratingHistory]);
```

### Option B: Database Integration
To save ratings to your backend:

```tsx
// Add this function to the component
const saveRatingToBackend = async (rating: RatingHistoryItem) => {
  try {
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rating)
    });
  } catch (error) {
    console.error('Failed to save rating:', error);
  }
};

// Call it in handleRatingClick after adding to state
const handleRatingClick = (ratingId: number) => {
  // ... existing code
  
  const newRating = { /* ... */ };
  setRatingHistory(prev => [...prev, newRating]);
  
  // Save to backend
  saveRatingToBackend(newRating);
};
```

## Step 6: Connect to Media Items (Optional)

To associate ratings with specific media (movies, shows, etc.):

```tsx
interface RatingSystemProps {
  mediaId?: string;
  mediaTitle?: string;
  mediaType?: 'movie' | 'tv' | 'game' | 'book';
}

export default function RatingSystem({ mediaId, mediaTitle, mediaType }: RatingSystemProps) {
  // Use mediaId to load/save ratings for specific items
  // ...
}
```

## Step 7: Navigation Integration

Add a link to the rating system in your navigation:

```tsx
// In your navigation component
import { Link } from 'react-router-dom';

<Link 
  to="/rate" 
  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-accent"
>
  <span>⭐</span>
  <span>Rate</span>
</Link>
```

## Usage Examples

### Basic Usage
```tsx
import RatingSystem from '@/components/RatingSystem';

function App() {
  return <RatingSystem />;
}
```

### With Media Context
```tsx
<RatingSystem 
  mediaId="movie-123"
  mediaTitle="Inception"
  mediaType="movie"
/>
```

## Customization

### Change Colors
The component uses your WIGG design tokens from `index.css`. To customize:

```tsx
// Change rating colors in the ratings array
const ratings: Rating[] = [
  {
    id: 1,
    color: '#YOUR_COLOR', // Change this
    // ...
  }
];
```

### Change Rating Labels
```tsx
const ratings: Rating[] = [
  { id: 1, label: 'Meh', emoji: '😐', /* ... */ },
  { id: 2, label: 'Decent', emoji: '👌', /* ... */ },
  { id: 3, label: 'Amazing', emoji: '🤩', /* ... */ },
  { id: 4, label: 'Masterpiece', emoji: '🏆', /* ... */ }
];
```

## Troubleshooting

### Chart not rendering?
Make sure Chart.js is properly registered:
```tsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);
```

### Styles not applying?
Ensure your Tailwind config includes the component directory:
```ts
content: [
  "./src/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
]
```

### Dark mode not working?
The component uses your existing design tokens (background, foreground, etc.) which should automatically adapt to dark mode via your theme system.

## Next Steps

1. ✅ Install dependencies
2. ✅ Copy component file
3. ✅ Add routing
4. ✅ Test the component
5. 📊 Add analytics (optional)
6. 💾 Add persistence (optional)
7. 🔗 Connect to media items (optional)

Need help? The component follows your existing WIGG patterns and should integrate seamlessly!
