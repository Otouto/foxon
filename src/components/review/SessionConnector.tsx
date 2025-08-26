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
    <div className="relative" style={{ marginBottom: '8px', marginTop: '8px' }}>
      {/* Vertical connector line extending from previous session to next */}
      <div 
        className="absolute left-6 w-px" 
        style={{ 
          backgroundColor: '#E0E0E0',
          height: '100%',
          top: 0
        }}
      />
      
      {/* Narrative content */}
      <div className="flex flex-col" style={{ marginLeft: '24px' }}>
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