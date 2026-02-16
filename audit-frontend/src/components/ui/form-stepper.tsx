"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  isStepComplete?: (step: number) => boolean;
}

export const FormStepper = React.forwardRef<HTMLDivElement, FormStepperProps>(
  ({ steps, currentStep, onStepChange, isStepComplete }, ref) => {
    return (
      <div ref={ref} className="w-full mt-2 pb-8">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted =
              index < currentStep || (isStepComplete && isStepComplete(index));
            const isAccessible =
              index <= currentStep || (isStepComplete && isStepComplete(index));
            const showConnector = index < steps.length - 1;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (isAccessible && onStepChange) {
                      onStepChange(index);
                    }
                  }}
                  disabled={!isAccessible}
                  className={cn(
                    "group flex items-center gap-3 transition-all duration-200",
                    isAccessible && "cursor-pointer"
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 w-9 h-9 rounded-full border flex items-center justify-center text-sm font-semibold transition-all duration-200",
                      isActive &&
                        "bg-primary text-primary-foreground border-primary shadow-sm",
                      !isActive &&
                        isCompleted &&
                        "border-primary text-primary bg-primary/10",
                      !isActive &&
                        !isCompleted &&
                        "border-muted-foreground/40 text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex flex-col text-left">
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isActive && "text-primary",
                        !isActive && isCompleted && "text-foreground",
                        !isActive && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    {step.description && (
                      <span className="text-xs text-muted-foreground/80">
                        {step.description}
                      </span>
                    )}
                  </div>
                </button>

                {showConnector && (
                  <span className="h-px w-8 sm:w-12 bg-border" aria-hidden />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

FormStepper.displayName = "FormStepper";

interface FormStepperFooterProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  canNavigateNext?: boolean;
  canNavigatePrevious?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  submitLabel?: string;
  showSubmit?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
  className?: string;
}

export const FormStepperFooter = React.forwardRef<
  HTMLDivElement,
  FormStepperFooterProps
>(
  (
    {
      currentStep,
      totalSteps,
      onNext,
      onPrevious,
      isLoading = false,
      canNavigateNext = true,
      canNavigatePrevious = true,
      nextLabel = "Next",
      previousLabel = "Previous",
      submitLabel = "Create",
      showSubmit = false,
      showDelete = false,
      onDelete,
      isDeleting = false,
      className,
    },
    ref
  ) => {
    const isLastStep = currentStep === totalSteps - 1;
    const isFirstStep = currentStep === 0;

    return (
      <div
        ref={ref}
        className={cn(
          "border-t border-border-color rounded-b-md bg-muted/20 px-6 py-4",
          className
        )}
      >
        <div className="flex justify-between items-center gap-4">
          <div>
            {showDelete && (
              <Button
                variant="destructive"
                type="button"
                onClick={onDelete}
                disabled={isDeleting || isLoading}
                className="px-5 shadow-sm transition-all duration-150"
              >
                {isDeleting ? "Deleting..." : <>Delete</>}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isFirstStep && (
              <Button
                variant="outline"
                type="button"
                onClick={onPrevious}
                disabled={!canNavigatePrevious || isLoading}
              >
                {previousLabel}
              </Button>
            )}

            {!isLastStep && (
              <Button
                type="button"
                onClick={onNext}
                disabled={!canNavigateNext || isLoading}
              >
                {nextLabel}
              </Button>
            )}

            {isLastStep && showSubmit && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : submitLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FormStepperFooter.displayName = "FormStepperFooter";
