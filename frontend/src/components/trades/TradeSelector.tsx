import React from 'react';
import { useTrade } from '../../contexts/TradeContext';
import { TradeSelectorProps } from '../../types/components';

const TradeSelector: React.FC<TradeSelectorProps> = ({ onTradeChange }) => {
  const { selectedTrade, setSelectedTrade } = useTrade();

  const handleTradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTrade = e.target.value;
    setSelectedTrade(newTrade);
    
    if (onTradeChange) {
      onTradeChange(newTrade);
    }
  };

  return (
    <div className="trade-selector">
      <h3>Select Trade</h3>
      <p className="trade-description">Choose the trade that best matches your blueprint needs:</p>
      
      <select 
        value={selectedTrade} 
        onChange={handleTradeChange}
        className="trade-select"
        aria-label="Select trade type"
      >
        <option value="">-- Select a Trade --</option>
        <option value="carpentry">Carpentry</option>
        <option value="electrical">Electrical</option>
        <option value="plumbing">Plumbing</option>
        <option value="sheathing">Sheathing</option>
        <option value="acoustics">Acoustics</option>
        <option value="finishcarpentry">Finish Carpentry</option>
        <option value="flooring">Flooring</option>
        <option value="ffe">Fixtures, Furniture & Equipment</option>
      </select>
      
      {selectedTrade && (
        <div className="selected-trade-info">
          <h4>Selected: {selectedTrade.charAt(0).toUpperCase() + selectedTrade.slice(1)}</h4>
          <p>
            {getTradeScopeDescription(selectedTrade)}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to get trade descriptions
const getTradeScopeDescription = (trade: string): string => {
  const descriptions: Record<string, string> = {
    carpentry: "Wall and ceiling framing including metal and wood studs, track, and related structural components.",
    electrical: "Electrical installations including wiring, fixtures, outlets, panels, and connections.",
    plumbing: "Plumbing systems including pipes, fixtures, drainage, and water supply components.",
    sheathing: "Wall and roof sheathing materials including drywall, plywood, and specialty panels.",
    acoustics: "Acoustic treatments and sound control systems including ceiling tiles and wall panels.",
    finishcarpentry: "Finish carpentry including trim, cabinetry, millwork, and decorative wood elements.",
    flooring: "Flooring materials and installation including hardwood, tile, carpet, and specialty flooring.",
    ffe: "Fixtures, furniture, and equipment selection and specification for completed spaces."
  };
  
  return descriptions[trade] || "Blueprint analysis and material takeoff for custom construction needs.";
};

export default TradeSelector;
