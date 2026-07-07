import React from "react";
import "./StepsTracker.css";

function StepsTracker({ steps = [], currentStep = 0 }) {
  return (
    <div className="steps-tracker">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div
            key={index}
            className={`step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
          >
            <div className="step-number">{index + 1}</div>

            <div className="step-label">{step}</div>

            {index < steps.length - 1 && <div className="step-line"></div>}
          </div>
        );
      })}
    </div>
  );
}

export default StepsTracker;