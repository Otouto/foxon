'use client';

import { SessionConnection } from '@/lib/utils/sessionPatterns';

interface SessionConnectorProps {
  connection: SessionConnection;
}

export function SessionConnector({ connection }: SessionConnectorProps) {
  if (!connection.showConnector) {
    return null;
  }

  const { restAnalysis } = connection;

  return (
    <div className="relative h-12 flex items-center">
      {/* Vertical connector line extending from previous session card to next session card */}
      <div 
        className="absolute w-px bg-gray-300" 
        style={{ 
          left: '36px', // Position to align with center of devotion circle (12px margin + 24px circle center)
          height: '48px',
          top: '0'
        }}
      />
      
      {/* Narrative content */}
      <div className="flex flex-col" style={{ marginLeft: '50px' }}>
        <span 
          className="text-gray-600" 
          style={{ 
            fontSize: '12px', 
            color: '#666',
            lineHeight: '1.2'
          }}
        >
          {restAnalysis.narrative}
        </span>
      </div>
    </div>
  );
}