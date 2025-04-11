import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TradeSelector from '../TradeSelector';
import { renderWithProviders } from '../../../utils/test-utils';
import * as TradeContext from '../../../contexts/TradeContext';

// Mock the context hook
jest.mock('../../../contexts/TradeContext', () => ({
  __esModule: true,
  ...jest.requireActual('../../../contexts/TradeContext'),
  useTrade: jest.fn(),
}));

describe('TradeSelector', () => {
  // Mock context data and functions
  const mockSetSelectedTrade = jest.fn();
  const mockOnTradeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup the mock implementation for useTrade
    (TradeContext.useTrade as jest.Mock).mockReturnValue({
      selectedTrade: '',
      setSelectedTrade: mockSetSelectedTrade,
    });
  });

  test('renders with default state', () => {
    renderWithProviders(<TradeSelector />);
    
    // Check if component renders correctly
    expect(screen.getByText('Select Trade')).toBeInTheDocument();
    expect(screen.getByText('Choose the trade that best matches your blueprint needs:')).toBeInTheDocument();
    expect(screen.getByLabelText('Select trade type')).toBeInTheDocument();
    
    // Should have options
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    
    // Should include specific trades
    expect(screen.getByText('Electrical')).toBeInTheDocument();
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
  });

  test('calls context setSelectedTrade when value changes', () => {
    renderWithProviders(<TradeSelector />);
    
    // Get the select element
    const select = screen.getByLabelText('Select trade type');
    
    // Change the value
    fireEvent.change(select, { target: { value: 'electrical' } });
    
    // Check if the context function was called
    expect(mockSetSelectedTrade).toHaveBeenCalledWith('electrical');
  });

  test('calls onTradeChange prop when provided', () => {
    renderWithProviders(<TradeSelector onTradeChange={mockOnTradeChange} />);
    
    // Get the select element
    const select = screen.getByLabelText('Select trade type');
    
    // Change the value
    fireEvent.change(select, { target: { value: 'plumbing' } });
    
    // Check if both the context function and prop function were called
    expect(mockSetSelectedTrade).toHaveBeenCalledWith('plumbing');
    expect(mockOnTradeChange).toHaveBeenCalledWith('plumbing');
  });

  test('shows selected trade info when trade is selected', () => {
    // Update the mock to have a selected trade
    (TradeContext.useTrade as jest.Mock).mockReturnValue({
      selectedTrade: 'electrical',
      setSelectedTrade: mockSetSelectedTrade,
    });
    
    renderWithProviders(<TradeSelector />);
    
    // Check if the selected trade info is shown
    expect(screen.getByText('Selected: Electrical')).toBeInTheDocument();
    
    // Check if description is shown
    const description = screen.getByText(/Electrical installations including wiring/i);
    expect(description).toBeInTheDocument();
  });

  test('does not show selected trade info when no trade is selected', () => {
    // Update the mock to have no selected trade
    (TradeContext.useTrade as jest.Mock).mockReturnValue({
      selectedTrade: '',
      setSelectedTrade: mockSetSelectedTrade,
    });
    
    renderWithProviders(<TradeSelector />);
    
    // Selected trade info should not be present
    expect(screen.queryByText(/selected:/i)).not.toBeInTheDocument();
  });

  test('shows correct description for each trade', () => {
    // Test with different trades
    const trades = [
      { value: 'carpentry', expected: /wall and ceiling framing/i },
      { value: 'electrical', expected: /electrical installations/i },
      { value: 'plumbing', expected: /plumbing systems/i },
      { value: 'sheathing', expected: /wall and roof sheathing/i },
    ];
    
    for (const trade of trades) {
      // Update the mock with current trade
      (TradeContext.useTrade as jest.Mock).mockReturnValue({
        selectedTrade: trade.value,
        setSelectedTrade: mockSetSelectedTrade,
      });
      
      const { unmount } = renderWithProviders(<TradeSelector />);
      
      // Check if the description matches
      const description = screen.getByText(trade.expected);
      expect(description).toBeInTheDocument();
      
      // Cleanup after each test
      unmount();
    }
  });
});