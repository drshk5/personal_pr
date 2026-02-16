# Floating Task Widget

A draggable, minimizable floating task widget built with React and Framer Motion that persists its position across sessions.

## Features

- ✅ **Draggable**: Click and drag from the header to move anywhere on screen
- ✅ **Position Persistence**: Automatically saves and restores position using localStorage
- ✅ **Minimize/Maximize**: Toggle between expanded and collapsed states
- ✅ **Smooth Animations**: Powered by Framer Motion for fluid transitions
- ✅ **Drag Constraints**: Automatically prevents dragging outside viewport bounds
- ✅ **Fixed Positioning**: Stays on top of other content with proper z-index
- ✅ **Responsive**: Adapts to window resize events

## Installation

Ensure you have the required dependencies:

```bash
npm install framer-motion lucide-react
```

## Usage

### Basic Implementation

```tsx
import { useState } from "react";
import FloatingTaskWidget from "./components/FloatingTaskWidget";

function App() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);

  return (
    <div>
      {/* Toggle button */}
      <button onClick={() => setIsWidgetOpen(true)}>Open Tasks</button>

      {/* Widget */}
      {isWidgetOpen && (
        <FloatingTaskWidget
          onClose={() => setIsWidgetOpen(false)}
          initialMinimized={false}
        />
      )}
    </div>
  );
}
```

### Props

| Prop               | Type         | Default     | Description                                          |
| ------------------ | ------------ | ----------- | ---------------------------------------------------- |
| `onClose`          | `() => void` | `undefined` | Callback function when close button is clicked       |
| `initialMinimized` | `boolean`    | `false`     | Initial minimized state (overridden by localStorage) |

## Architecture

### Component Structure

```
FloatingTaskWidget/
├── FloatingTaskWidget.tsx    # Main component logic
├── FloatingTaskWidget.css    # Styling
├── index.ts                  # Barrel export
├── FloatingTaskWidget.example.tsx  # Usage example
└── README.md                 # Documentation
```

### Key Technical Details

#### 1. Position Persistence Logic

The widget uses localStorage to remember its position across sessions:

```typescript
const STORAGE_KEY = "floating-task-widget-position";

// On mount: Load saved position
useEffect(() => {
  const savedPosition = localStorage.getItem(STORAGE_KEY);
  if (savedPosition) {
    const parsed = JSON.parse(savedPosition);
    setPosition(parsed);
  } else {
    // Default to bottom-right corner with padding
    setPosition({
      x: window.innerWidth - 420,
      y: window.innerHeight - 520,
    });
  }
}, []);

// On drag end: Save new position
const handleDragEnd = (_event, info) => {
  const newPosition = {
    x: position.x + info.offset.x,
    y: position.y + info.offset.y,
  };
  setPosition(newPosition);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosition));
};
```

**How it works:**

1. On component mount, checks localStorage for saved position
2. If found, restores the saved position; otherwise uses default (bottom-right)
3. On every drag end, calculates the new absolute position
4. Saves the new position to localStorage for next session

#### 2. Drag Constraints

Drag constraints prevent the widget from being dragged outside the viewport:

```typescript
useEffect(() => {
  const updateConstraints = () => {
    const widgetWidth = widgetRef.current.offsetWidth;
    const widgetHeight = isMinimized ? 60 : widgetRef.current.offsetHeight;

    setDragConstraints({
      left: 0,
      right: window.innerWidth - widgetWidth,
      top: 0,
      bottom: window.innerHeight - widgetHeight,
    });
  };

  updateConstraints();
  window.addEventListener("resize", updateConstraints);

  return () => window.removeEventListener("resize", updateConstraints);
}, [isMinimized]);
```

**How constraints work:**

- `left: 0` - Widget can't go past the left edge of viewport
- `right: window.innerWidth - widgetWidth` - Widget's left edge can't exceed this point (keeps right edge visible)
- `top: 0` - Widget can't go past the top edge
- `bottom: window.innerHeight - widgetHeight` - Widget's top edge can't exceed this point (keeps bottom visible)

**Dynamic updates:**

- Recalculates on window resize to maintain valid bounds
- Adjusts when widget is minimized/maximized (different heights)
- Ensures saved position is clamped within bounds

#### 3. Framer Motion Integration

```typescript
<motion.div
  drag
  dragMomentum={false}
  dragElastic={0}
  dragConstraints={dragConstraints}
  onDragEnd={handleDragEnd}
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.8 }}
  transition={{ duration: 0.2 }}
>
```

**Key properties:**

- `drag` - Enables dragging
- `dragMomentum={false}` - Stops immediately on release (no sliding)
- `dragElastic={0}` - No elastic bounce at boundaries
- `dragConstraints` - Applies calculated viewport boundaries
- `onDragEnd` - Triggers position persistence
- Animation properties provide smooth open/close transitions

## Customization

### Styling

Modify `FloatingTaskWidget.css` to customize appearance:

```css
/* Change widget size */
.floating-task-widget {
  width: 400px; /* Adjust width */
}

/* Customize header gradient */
.widget-header {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}

/* Adjust z-index for layering */
.floating-task-widget {
  z-index: 9999; /* Increase to ensure it stays on top */
}
```

### Adding Custom Content

Replace the task list section with your own content:

```tsx
<motion.div className="widget-content">
  <div className="widget-content-inner">
    {/* Your custom content here */}
    <YourCustomComponent />
  </div>
</motion.div>
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 11.3+)
- **localStorage**: Required for position persistence

## Performance Considerations

1. **Drag Performance**: Uses `dragMomentum={false}` to prevent expensive momentum calculations
2. **Constraint Updates**: Only recalculates on window resize and minimize/maximize
3. **Storage**: Only writes to localStorage on drag end (not during drag)
4. **Animations**: Uses CSS transforms for GPU acceleration

## Accessibility

- Header buttons include `aria-label` attributes
- Keyboard navigation supported for interactive elements
- Focus states styled for visibility

## License

MIT

## Contributing

Feel free to customize and extend this component for your specific needs!
