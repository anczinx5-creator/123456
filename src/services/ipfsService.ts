import { API_CONFIG } from '../config/api';

class IPFSService {
  private isBackendAvailable = false;
  private baseUrl = API_CONFIG.BASE_URL;

  constructor() {
    this.checkBackendAvailability();
  }

  private async checkBackendAvailability() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
      this.isBackendAvailable = true;
      }
    } catch {
      this.isBackendAvailable = false;
    }
  }

  async uploadJSON(jsonData: any, name: string) {
    try {
      if (!this.isBackendAvailable) {
        throw new Error('Backend not available');
      }
      
      const response = await fetch(`${this.baseUrl}/api/ipfs/upload-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ jsonData, name })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      throw error;
    }
  }

  async uploadFile(file: File) {
    try {
      if (!this.isBackendAvailable) {
        throw new Error('Backend not available');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${this.baseUrl}/api/ipfs/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw error;
    }
  }

  async getFile(ipfsHash: string) {
    try {
      if (!this.isBackendAvailable) {
        throw new Error('Backend not available');
      }
      
      const response = await fetch(`${this.baseUrl}/api/ipfs/get-file/${ipfsHash}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error retrieving file from IPFS:', error);
      throw error;
    }
  }

  async createCollectionMetadata(collectionData: any) {
    const metadata = {
      type: 'collection',
      timestamp: new Date().toISOString(),
      ...collectionData
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/api/ipfs/create-collection-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ collectionData: metadata })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating collection metadata:', error);
      throw error;
    }
  }

  async createQualityTestMetadata(testData: any) {
    const metadata = {
      type: 'quality_test',
      timestamp: new Date().toISOString(),
      ...testData
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/api/ipfs/create-quality-test-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ testData: metadata })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating quality test metadata:', error);
      throw error;
    }
  }

  async createProcessingMetadata(processData: any) {
    const metadata = {
      type: 'processing',
      timestamp: new Date().toISOString(),
      ...processData
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/api/ipfs/create-processing-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ processData: metadata })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating processing metadata:', error);
      throw error;
    }
  }

  async createManufacturingMetadata(mfgData: any) {
    const metadata = {
      type: 'manufacturing',
      timestamp: new Date().toISOString(),
      ...mfgData
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/api/ipfs/create-manufacturing-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ mfgData: metadata })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating manufacturing metadata:', error);
      throw error;
    }
  }
}

export const ipfsService = new IPFSService();
export default ipfsService;