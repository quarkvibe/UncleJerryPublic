import React from 'react';

interface FFEProps {
  blueprints: File[];
  onAnalysisComplete: (result: any) => void;
}

const FFE: React.FC<FFEProps> = ({ blueprints, onAnalysisComplete }) => {
  return (
    <div className="ffe-analyzer">
      <h2>Furniture, Fixtures & Equipment Analysis</h2>
      <p>Analyzing {blueprints.length} blueprints for FFE requirements...</p>
      <button 
        onClick={() => {
          // Simulate analysis completion
          onAnalysisComplete({
            materials: [
              { name: 'Desk Chairs', quantity: 8, unit: 'pcs', cost: 1600 },
              { name: 'Conference Table', quantity: 1, unit: 'pcs', cost: 2200 },
              { name: 'Reception Desk', quantity: 1, unit: 'pcs', cost: 3500 },
              { name: 'Filing Cabinets', quantity: 4, unit: 'pcs', cost: 1200 }
            ],
            totalMaterialCost: 8500,
            labor: [
              { task: 'Furniture Assembly', hours: 16, rate: 45, cost: 720 },
              { task: 'Installation', hours: 8, rate: 45, cost: 360 }
            ],
            totalLaborCost: 1080,
            totalCost: 9580,
            notes: 'FFE analysis completed for office space.'
          });
        }}
      >
        Complete Analysis
      </button>
    </div>
  );
};

export default FFE;