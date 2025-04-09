import React from 'react';

interface FinishCarpentryProps {
  blueprints: File[];
  onAnalysisComplete: (result: any) => void;
}

const FinishCarpentry: React.FC<FinishCarpentryProps> = ({ blueprints, onAnalysisComplete }) => {
  return (
    <div className="finish-carpentry-analyzer">
      <h2>Finish Carpentry Analysis</h2>
      <p>Analyzing {blueprints.length} blueprints for finish carpentry requirements...</p>
      <button 
        onClick={() => {
          // Simulate analysis completion
          onAnalysisComplete({
            materials: [
              { name: 'Baseboard', quantity: 240, unit: 'ln ft', cost: 480 },
              { name: 'Crown Molding', quantity: 180, unit: 'ln ft', cost: 450 },
              { name: 'Door Casings', quantity: 12, unit: 'sets', cost: 360 }
            ],
            totalMaterialCost: 1290,
            labor: [
              { task: 'Baseboard Installation', hours: 8, rate: 65, cost: 520 },
              { task: 'Crown Installation', hours: 10, rate: 65, cost: 650 },
              { task: 'Door Trim', hours: 6, rate: 65, cost: 390 }
            ],
            totalLaborCost: 1560,
            totalCost: 2850,
            notes: 'Finish carpentry analysis completed.'
          });
        }}
      >
        Complete Analysis
      </button>
    </div>
  );
};

export default FinishCarpentry;