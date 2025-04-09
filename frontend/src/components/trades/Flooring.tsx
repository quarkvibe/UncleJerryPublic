import React from 'react';

interface FlooringProps {
  blueprints: File[];
  onAnalysisComplete: (result: any) => void;
}

const Flooring: React.FC<FlooringProps> = ({ blueprints, onAnalysisComplete }) => {
  return (
    <div className="flooring-analyzer">
      <h2>Flooring Analysis</h2>
      <p>Analyzing {blueprints.length} blueprints for flooring requirements...</p>
      <button 
        onClick={() => {
          // Simulate analysis completion
          onAnalysisComplete({
            materials: [
              { name: 'Hardwood Flooring', quantity: 800, unit: 'sq ft', cost: 6400 },
              { name: 'Underlayment', quantity: 800, unit: 'sq ft', cost: 1200 },
              { name: 'Trim', quantity: 240, unit: 'ln ft', cost: 480 },
              { name: 'Adhesive', quantity: 6, unit: 'buckets', cost: 350 }
            ],
            totalMaterialCost: 8430,
            labor: [
              { task: 'Floor Prep', hours: 16, rate: 60, cost: 960 },
              { task: 'Flooring Installation', hours: 40, rate: 60, cost: 2400 },
              { task: 'Trim Installation', hours: 12, rate: 60, cost: 720 }
            ],
            totalLaborCost: 4080,
            totalCost: 12510,
            notes: 'Flooring analysis completed for hardwood installation.'
          });
        }}
      >
        Complete Analysis
      </button>
    </div>
  );
};

export default Flooring;