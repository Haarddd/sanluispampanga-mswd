interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isCompleted || isActive
                  ? "bg-foreground"
                  : "bg-border"
              } ${isActive ? "w-6" : "w-4"}`}
            />
          </div>
        );
      })}
    </div>
  );
}
