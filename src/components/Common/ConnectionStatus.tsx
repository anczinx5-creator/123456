import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Server, AlertTriangle, Link } from 'lucide-react';
import blockchainService from '../../services/blockchainService';

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      await blockchainService.initialize();
      const connectionStatus = blockchainService.getConnectionStatus();
      const fabricInfo = blockchainService.getFabricNetworkInfo();
      setStatus(connectionStatus);
    } catch (error) {
      setStatus({
        initialized: false,
        fabricInfo, // ✅ added missing comma here
        backendAvailable: false,
        fabricConnected: false,
        mode: 'offline',
        network: 'hyperledger-fabric',
        error: (error as Error).message,
      });
    }
  };

  if (!status) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`p-3 rounded-lg shadow-lg border cursor-pointer transition-all duration-200 ${
          status.fabricConnected 
            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
            : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          {status.fabricConnected ? (
            <Link className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          <span className={`text-sm font-medium ${
            status.fabricConnected ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {status.fabricConnected ? 'Hyperledger Fabric Connected' : 'Demo Mode'}
          </span>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Backend:</span>
              <span className={status.backendAvailable ? 'text-green-600' : 'text-red-600'}>
                {status.backendAvailable ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hyperledger Fabric:</span>
              <span className={status.fabricConnected ? 'text-green-600' : 'text-yellow-600'}>
                {status.fabricConnected ? 'Connected' : 'Demo'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Network:</span>
              <span className="text-blue-600">{status.network}</span>
            </div>
            {status.fabricInfo && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Channel:</span>
                <span className="text-purple-600">{status.fabricInfo.channelName}</span>
              </div>
            )}
            {!status.fabricConnected && (
              <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Start Hyperledger Fabric network for full functionality</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
