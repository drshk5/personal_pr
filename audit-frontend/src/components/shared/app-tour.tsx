import * as React from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface TourStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
  };
}

interface AppTourProps {
  steps: TourStep[];
  startTour?: boolean;
  onTourComplete?: () => void;
}

/**
 * AppTour component that provides an interactive guided tour using driver.js
 */
export const AppTour: React.FC<AppTourProps> = ({
  steps,
  startTour = false,
  onTourComplete,
}) => {
  const driverRef = React.useRef<ReturnType<typeof driver> | null>(null);
  const onTourCompleteRef = React.useRef(onTourComplete);
  const isTourActiveRef = React.useRef(false);

  // Update the callback ref when it changes
  onTourCompleteRef.current = onTourComplete;

  // Destroy driver instance on unmount
  React.useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (startTour && driverRef.current) {
      // No-op; driver will be created below when startTour changes
    }
  }, [startTour]);

  React.useEffect(() => {
    if (!startTour) return;

    // Filter steps to only those with existing elements
    const availableSteps = steps.filter((step) =>
      document.querySelector(step.element)
    );

    if (availableSteps.length === 0) {
      console.warn(
        "No tour steps could be started because target elements are missing:",
        steps.map((step) => step.element)
      );
      onTourCompleteRef.current?.();
      return;
    }

    const missingElements = steps
      .filter((step) => !document.querySelector(step.element))
      .map((step) => step.element);

    if (missingElements.length > 0) {
      console.warn("Some tour elements not found, skipping:", missingElements);
    }

    // Recreate driver with the filtered steps to allow partial tours
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }

    driverRef.current = driver({
      showProgress: true,
      steps: availableSteps.map((step) => ({
        element: step.element,
        popover: {
          title: step.popover.title,
          description: step.popover.description,
          side: step.popover.side || "bottom",
        },
      })),
      onDestroyed: () => {
        if (isTourActiveRef.current) {
          isTourActiveRef.current = false;
          onTourCompleteRef.current?.();
        }
      },
    });

    // Slight delay to ensure DOM/layout is ready
    setTimeout(() => {
      if (!driverRef.current) return;

      try {
        isTourActiveRef.current = true;
        driverRef.current.drive();
      } catch (error) {
        console.error("Error starting tour:", error);
        isTourActiveRef.current = false;
        onTourCompleteRef.current?.();
      }
    }, 500);
  }, [startTour, steps]);

  return null; // This component doesn't render anything
};
