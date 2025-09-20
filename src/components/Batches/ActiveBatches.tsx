import React, { useState, useEffect } from 'react';
import { Package, Eye, QrCode, Calendar, User, MapPin, Download } from 'lucide-react';
import blockchainService from '../../services/blockchainService';
import QRCodeDisplay from '../Common/QRCodeDisplay';

interface Batch {
  batchId: string;
  herbSpecies: string;
  creator: string;
  creationTime: string;
  lastUpdated: string;
  currentStatus: string;
  eventCount: number;
  events: any[];
}

const ActiveBatches: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveBatches();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveBatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveBatches = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tracking/batches', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch batches from server`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch batches');
      }
      
      // Transform the data for display
      const transformedBatches = data.batches.map((batch: any) => ({
        batchId: batch.batchId,
        herbSpecies: batch.herbSpecies || 'Unknown',
        creator: batch.creator || 'Unknown',
        creationTime: batch.creationTime || new Date().toISOString(),
        lastUpdated: batch.lastUpdated || new Date().toISOString(),
        currentStatus: batch.currentStatus || 'Unknown',
        eventCount: batch.eventCount || 0,
        events: batch.events || []
      }));
      
      setBatches(transformedBatches);
    } catch (error) {
      console.error('Error fetching active batches:', error);
      setError('Failed to connect to Hyperledger Fabric backend. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COLLECTED': return 'bg-green-100 text-green-800';
      case 'QUALITY_TESTED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSED': return 'bg-purple-100 text-purple-800';
      case 'MANUFACTURED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLatestQRCode = (events: any[]) => {
    if (events.length === 0) return null;
    const latestEvent = events[events.length - 1];
    return {
      eventId: latestEvent.eventId,
      dataURL: `data:image/png;base64,${generateQRDataURL(latestEvent)}`,
      trackingUrl: `${window.location.origin}/track/${latestEvent.eventId}`
    };
  };

  const generateQRDataURL = (event: any) => {
    // This would normally come from the QR service, but for now we'll use a placeholder
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  };

  const viewBatchDetails = (batch: Batch) => {
    setSelectedBatch(batch);
  };

  const showBatchQR = (batchId: string) => {
    setShowQR(batchId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchActiveBatches}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800">Active Batches</h2>
              <p className="text-green-600">View all batches recorded on Hyperledger Fabric</p>
            </div>
          </div>
          <button
            onClick={fetchActiveBatches}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Batches</h3>
            <p className="text-gray-600">No batches found on the Hyperledger Fabric network</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <div key={batch.batchId} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 truncate">{batch.herbSpecies}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.currentStatus)}`}>
                    {batch.currentStatus}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    <span className="font-mono text-xs">{batch.batchId}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>{batch.creator}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(batch.creationTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>{batch.eventCount} events</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewBatchDetails(batch)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center justify-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => showBatchQR(batch.batchId)}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center justify-center space-x-1"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Batch Details Modal */}
        {selectedBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Batch Details</h3>
                  <button
                    onClick={() => setSelectedBatch(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="font-medium text-gray-600">Batch ID:</span>
                    <p className="font-mono text-sm">{selectedBatch.batchId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Herb Species:</span>
                    <p>{selectedBatch.herbSpecies}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Creator:</span>
                    <p>{selectedBatch.creator}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBatch.currentStatus)}`}>
                      {selectedBatch.currentStatus}
                    </span>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-4">Events Timeline</h4>
                <div className="space-y-4">
                  {selectedBatch.events.map((event, index) => (
                    <div key={event.eventId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{event.eventType}</h5>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Event ID: {event.eventId}</p>
                      <p className="text-sm text-gray-600">
                        Participant: {event.collectorName || event.testerName || event.processorName || event.manufacturerName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Batch QR Code</h3>
                  <button
                    onClick={() => setShowQR(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">Batch ID: {showQR}</p>
                  <button
                    onClick={() => setShowQR(null)}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveBatches;