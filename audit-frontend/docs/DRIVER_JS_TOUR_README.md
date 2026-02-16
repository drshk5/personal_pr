# Driver.js Tour Implementation

This document describes the implementation of guided tours using Driver.js in the audit frontend application.

## Overview

Driver.js is a lightweight, no-dependency JavaScript library for creating interactive guided tours for web applications. It provides a simple API to highlight elements and display helpful information.

## Components

### AppTour Component

Located at `src/components/shared/app-tour.tsx`, this is a React wrapper around Driver.js.

**Props:**

- `steps`: Array of tour steps with element selectors and popover content
- `startTour`: Boolean to control when the tour starts
- `onTourComplete`: Callback function called when the tour ends

**Usage Example:**

```tsx
import { AppTour } from "@/components/shared/app-tour";

const tourSteps = [
  {
    element: ".welcome-header",
    popover: {
      title: "Welcome Message",
      description: "This shows your personalized greeting.",
      side: "bottom",
    },
  },
];

function MyComponent() {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <button onClick={() => setShowTour(true)}>Start Tour</button>
      <AppTour
        steps={tourSteps}
        startTour={showTour}
        onTourComplete={() => setShowTour(false)}
      />
    </>
  );
}
```

## Implementation in UserWelcome Page

The UserWelcome page (`src/pages/UserWelcome.tsx`) includes a basic tour that highlights:

1. Welcome header with greeting and time
2. Account information card
3. Calendar section

### Features Added:

- "Take Tour" button in the header next to the clock
- Tour steps targeting key UI elements with class names:
  - `.welcome-header`
  - `.account-info`
  - `.calendar-section`

## Customization

To create tours for other pages:

1. Add class names to elements you want to highlight
2. Define tour steps with element selectors and popover content
3. Add state to control tour visibility
4. Include the AppTour component in your JSX
5. Add a button or trigger to start the tour

## Styling

Driver.js includes its own CSS which is imported in the AppTour component. The tour popovers have a modern, clean appearance that matches most UI themes.

## Dependencies

- `driver.js`: The core tour library
- React hooks for state management

## Future Enhancements

- Add tour persistence (remember if user has seen tours)
- Create reusable tour configurations for different user roles
- Add analytics tracking for tour completion
- Support for dynamic content in tour steps
