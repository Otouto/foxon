'use client';

import { SessionConnection } from '@/lib/utils/sessionPatterns';

interface ProportionalConnectorProps {
  connection: SessionConnection;
}

export function ProportionalConnector({ connection }: ProportionalConnectorProps) {
  if (!connection.showConnector) {
    return null;
  }

  const { restAnalysis } = connection;
  const restDays = restAnalysis.restDays;

  // Calculate dynamic height and visual state
  const getConnectorVisuals = () => {
    if (restDays <= 1) {
      // Connected sessions (0-1 days): Single solid line
      return {
        height: 40, // Minimum connector height
        type: 'connected' as const
      };
    } else if (restDays <= 7) {
      // Standard gaps (2-7 days): Individual dots
      return {
        height: 40 + (restDays * 14), // Base + 14px per rest day
        type: 'dots' as const
      };
    } else if (restDays <= 14) {
      // Long gaps (8-14 days): Compressed with badge
      return {
        height: 80, // Fixed height for compressed view
        type: 'compressed' as const
      };
    } else {
      // Extended breaks (15+ days): Complete break
      return {
        height: 60, // Fixed height for break indicator
        type: 'extended' as const
      };
    }
  };

  const visuals = getConnectorVisuals();

  const renderConnectedState = () => (
    <div className="relative" style={{ height: `${visuals.height}px` }}>
      {/* Single solid line aligned with devotion circle */}
      <div 
        className="absolute w-px bg-gray-300" 
        style={{ 
          left: '36px', // Align with devotion circle center (12px margin + 24px circle center)
          height: '40px',
          top: '0'
        }}
      />
      {/* Narrative text */}
      <div className="flex items-center h-full" style={{ marginLeft: '50px' }}>
        <span className="text-xs text-gray-600">
          {restAnalysis.narrative}
        </span>
      </div>
    </div>
  );

  const renderDotsState = () => {
    return (
      <div className="relative" style={{ height: `${visuals.height}px` }}>
        {/* Continuous connector line through entire height */}
        <div 
          className="absolute w-px bg-gray-300" 
          style={{ 
            left: '36px', // Align with devotion circle center
            height: '100%',
            top: '0'
          }}
        />
        
        {/* Rest day dots positioned on the line */}
        {Array.from({ length: restDays }, (_, index) => (
          <div
            key={index}
            className="rest-day-dot absolute"
            title={`Rest day ${index + 1}`}
            style={{
              left: '32.5px',
              top: `${8 + (index + 1) * 14}px` // Start after initial padding, space by 14px
            }}
          />
        ))}
        
        {/* Narrative text positioned to the side */}
        <div className="absolute top-1/2 transform -translate-y-1/2" style={{ marginLeft: '50px' }}>
          <span className="text-xs text-gray-600">
            {restAnalysis.narrative}
          </span>
        </div>
      </div>
    );
  };

  const renderCompressedState = () => (
    <div className="relative" style={{ height: `${visuals.height}px` }}>
      {/* Continuous connector line */}
      <div 
        className="absolute w-px bg-gray-300" 
        style={{ 
          left: '36px', // Align with devotion circle center
          height: '100%',
          top: '0'
        }}
      />
      
      {/* Dotted line overlay for visual effect */}
      <div 
        className="absolute long-gap-line"
        style={{ 
          left: '36px',
          top: '10px'
        }}
      />
      
      {/* Day count badge */}
      <div 
        className="absolute day-count-badge"
        style={{
          left: '50px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      >
        {restDays} days
      </div>
      
      {/* Second dotted line */}
      <div 
        className="absolute long-gap-line"
        style={{ 
          left: '36px',
          bottom: '10px'
        }}
      />
    </div>
  );

  const renderExtendedState = () => (
    <div className="relative py-4" style={{ height: `${visuals.height}px` }}>
      {/* Horizontal separator centered */}
      <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
        <div className="flex items-center">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="px-4 text-xs text-gray-500">
            {restDays} day break
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
        
        {/* Welcome back message */}
        <div className="text-center mt-2">
          <span className="text-xs text-gray-600 italic">
            Welcome back
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {visuals.type === 'connected' && renderConnectedState()}
      {visuals.type === 'dots' && renderDotsState()}
      {visuals.type === 'compressed' && renderCompressedState()}
      {visuals.type === 'extended' && renderExtendedState()}
    </div>
  );
}