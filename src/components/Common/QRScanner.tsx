import React, { useState, useRef } from 'react';
import { Upload, QrCode, X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import qrService from '../../services/qrService';

interface QRScannerProps {
  onScanSuccess: (qrData: any) => void;
  onClose: () => void;
  title?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose, title = "Scan QR Code" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create image element to read QR code
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        try {
          // Try to extract QR code data from image
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          
          // For demo purposes, we'll simulate QR code reading
          // In production, you'd use a library like jsQR
          const qrText = await simulateQRReading(file);
          
          if (qrText) {
            const parsedData = qrService.parseQRData(qrText);
            if (parsedData.success) {
              onScanSuccess(parsedData.data);
            } else {
              setError('Invalid QR code format');
            }
          } else {
            setError('No QR code found in image');
          }
        } catch (err) {
          setError('Failed to read QR code from image');
        }
      };

      img.onerror = () => {
        setError('Failed to load image');
        setLoading(false);
      };

      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);

    } catch (err) {
      setError('Failed to process image');
      setLoading(false);
    }
  };

  // Simulate QR code reading for demo
  const simulateQRReading = async (file: File): Promise<string | null> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
    
    // Try to get real data from blockchain service first
    try {
      const allBatches = await blockchainService.getAllBatches();
      if (allBatches.length > 0) {
        // Get the most recent batch for demo
        const latestBatch = allBatches[0];
        const latestEvent = latestBatch.events[latestBatch.events.length - 1];
        
        return JSON.stringify({
          type: latestEvent.eventType.toLowerCase(),
          batchId: latestBatch.batchId,
          eventId: latestEvent.eventId,
          herbSpecies: latestBatch.herbSpecies,
          participant: latestEvent.participant
        });
      }
    } catch (error) {
      console.warn('Could not get real batch data, using demo data');
    }
    
    // Fallback to filename-based demo data
    const filename = file.name.toLowerCase();
    
    if (filename.includes('collection') || filename.includes('herb')) {
      return JSON.stringify({
        type: 'collection',
        batchId: 'HERB-1234567890-1234',
        eventId: 'COLLECTION-1234567890-1234',
        herbSpecies: 'Ashwagandha',
        collector: 'Demo Collector'
      });
    } else if (filename.includes('test') || filename.includes('quality')) {
      return JSON.stringify({
        type: 'quality_test',
        batchId: 'HERB-1234567890-1234',
        eventId: 'TEST-1234567890-1234',
        parentEventId: 'COLLECTION-1234567890-1234',
        tester: 'Demo Tester'
      });
    } else if (filename.includes('process')) {
      return JSON.stringify({
        type: 'processing',
        batchId: 'HERB-1234567890-1234',
        eventId: 'PROCESS-1234567890-1234',
        parentEventId: 'TEST-1234567890-1234',
        processor: 'Demo Processor'
      });
    }
    
    // Return null if no real data and no matching filename
    return null;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {loading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Reading QR code...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <QrCode className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Upload QR Code Image
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop an image with a QR code, or click to browse
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Upload className="h-5 w-5" />
                  <span>Choose Image</span>
                </button>

                <div className="text-xs text-gray-500">
                  Supported formats: JPG, PNG, GIF
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Demo Instructions:</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Upload any image to simulate QR scanning with real batch data</li>
            <li>• Filename with "collection" → Collection QR with new batch ID</li>
            <li>• Filename with "test" → Quality Test QR with new batch ID</li>
            <li>• Filename with "process" → Processing QR with new batch ID</li>
            <li>• Filename with "manufacturing" → Manufacturing QR with new batch ID</li>
            <li>• Other images → Default Collection QR with new batch ID</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;