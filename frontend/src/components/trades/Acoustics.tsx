import React from 'react';

interface AcousticsProps {
  blueprints: File[];
  onAnalysisComplete: (result: any) => void;
}

const Acoustics: React.FC<AcousticsProps> = ({ blueprints, onAnalysisComplete }) => {
  return (
    <div className="acoustics-analyzer">
      <h2>Acoustical Analysis</h2>
      <p>Analyzing {blueprints.length} blueprints for acoustical requirements...</p>
      <button 
        onClick={() => {
          // Simulate analysis completion
          onAnalysisComplete({
            materials: [
              { name: 'Acoustic Ceiling Tiles', quantity: 120, unit: 'pcs', cost: 480 },
              { name: 'Main Runners', quantity: 40, unit: 'pcs', cost: 160 },
              { name: 'Cross Tees', quantity: 80, unit: 'pcs', cost: 120 }
            ],
            totalMaterialCost: 760,
            notes: 'Acoustic analysis completed for ceiling system.'
          });
        }}
      >
        Complete Analysis
      </button>
    </div>
  );
};

export default Acoustics;