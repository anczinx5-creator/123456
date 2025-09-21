import React, { useState } from 'react';
import { Package, Calendar, MapPin, Users, AlertCircle } from 'lucide-react';

interface ProcessingFormData {
  batchId: string;
  processingDate: string;
  location: string;
  processedBy: string;
  processingMethod: string;
  temperature: string;
  humidity: string;
  duration: string;
  notes: string;
}

interface ProcessingFormProps {
  onSubmit: (data: ProcessingFormData) => void;
  onCancel: () => void;
}

export const ProcessingForm: React.FC<ProcessingFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ProcessingFormData>({
    batchId: '',
    processingDate: '',
    location: '',
    processedBy: '',
    processingMethod: '',
    temperature: '',
    humidity: '',
    duration: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<ProcessingFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ProcessingFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProcessingFormData> = {};

    if (!formData.batchId.trim()) {
      newErrors.batchId = 'Batch ID is required';
    }
    if (!formData.processingDate) {
      newErrors.processingDate = 'Processing date is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.processedBy.trim()) {
      newErrors.processedBy = 'Processed by field is required';
    }
    if (!formData.processingMethod) {
      newErrors.processingMethod = 'Processing method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Package className="w-6 h-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">Processing Form</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-2">
              Batch ID *
            </label>
            <input
              type="text"
              id="batchId"
              name="batchId"
              value={formData.batchId}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.batchId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter batch ID"
            />
            {errors.batchId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.batchId}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="processingDate" className="block text-sm font-medium text-gray-700 mb-2">
              Processing Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="date"
                id="processingDate"
                name="processingDate"
                value={formData.processingDate}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.processingDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.processingDate && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.processingDate}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Processing Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter processing location"
              />
            </div>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.location}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="processedBy" className="block text-sm font-medium text-gray-700 mb-2">
              Processed By *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="processedBy"
                name="processedBy"
                value={formData.processedBy}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.processedBy ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter processor name"
              />
            </div>
            {errors.processedBy && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.processedBy}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="processingMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Processing Method *
            </label>
            <select
              id="processingMethod"
              name="processingMethod"
              value={formData.processingMethod}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.processingMethod ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select processing method</option>
              <option value="drying">Drying</option>
              <option value="grinding">Grinding</option>
              <option value="extraction">Extraction</option>
              <option value="distillation">Distillation</option>
              <option value="fermentation">Fermentation</option>
            </select>
            {errors.processingMethod && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.processingMethod}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
              Temperature (°C)
            </label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter temperature"
            />
          </div>

          <div>
            <label htmlFor="humidity" className="block text-sm font-medium text-gray-700 mb-2">
              Humidity (%)
            </label>
            <input
              type="number"
              id="humidity"
              name="humidity"
              value={formData.humidity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter humidity"
              min="0"
              max="100"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration (hours)
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter duration"
              min="0"
              step="0.5"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Processing Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional notes about the processing..."
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Submit Processing Data
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProcessingForm;