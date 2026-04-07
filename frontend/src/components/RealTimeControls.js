/**
 * Real-Time Controls Component
 * Shows live data toggle, update status, and refresh button
 */

import React from 'react';

export default function RealTimeControls({
    showRealTime,
    realTimeLoading,
    lastUpdateTime,
    onRefresh,
    realTimeDisastersCount,
    apiErrors
}) {
    return (
        <div className="realtime-controls">
            <div className="realtime-status">
                <span className="toggle-label">🌍 Live Global Disasters (Real-time only)</span>

                {/* Show update info when live is enabled */}
                {showRealTime && (
                    <div className="realtime-info">
                        {/* Status indicator */}
                        <span className={`update-indicator ${realTimeLoading ? 'loading' : 'ready'}`}>
                            {realTimeLoading ? '⏳ Updating...' : '🟢 Live'}
                        </span>

                        {/* Last update time */}
                        {lastUpdateTime && (
                            <span className="update-time">
                                Last: {lastUpdateTime.toLocaleTimeString()}
                            </span>
                        )}

                        {/* Refresh button */}
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={onRefresh}
                            disabled={realTimeLoading}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                )}
            </div>

            {/* Show API errors if they occur */}
            {showRealTime && (apiErrors.usgs || apiErrors.eonet) && (
                <div className="api-errors">
                    {apiErrors.usgs && (
                        <span className="error-tag">⚠️ USGS Earthquakes unavailable</span>
                    )}
                    {apiErrors.eonet && (
                        <span className="error-tag">⚠️ NASA Events unavailable</span>
                    )}
                </div>
            )}

            {/* Show count of global disasters */}
            {showRealTime && realTimeDisastersCount > 0 && (
                <div className="realtime-count">
                    🌍 {realTimeDisastersCount} global disasters detected
                </div>
            )}
        </div>
    );
}
