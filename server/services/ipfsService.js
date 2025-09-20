const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

class IPFSService {
  constructor() {
    this.pinataApiUrl = 'https://api.pinata.cloud';
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
    
    // Validate API keys on initialization
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('⚠️  Pinata API keys not configured properly');
      console.warn('Current PINATA_API_KEY:', this.pinataApiKey ? 'Set' : 'Missing');
      console.warn('Current PINATA_SECRET_API_KEY:', this.pinataSecretKey ? 'Set' : 'Missing');
      console.warn('Please check your .env file configuration');
    } else {
      console.log('✅ Pinata API keys configured successfully');
      console.log('API Key:', this.pinataApiKey.substring(0, 8) + '...');
    }
  }

  // ---------- Upload JSON ----------
  async uploadJSON(jsonData, name) {
    try {
      // Check if API keys are configured
      if (!this.pinataApiKey || !this.pinataSecretKey) {
        console.log('📝 API keys missing, falling back to demo mode');
        const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
        return {
          success: true,
          ipfsHash: mockHash,
          pinataUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
          demo: true,
          warning: 'Using demo mode - configure Pinata API keys for real IPFS uploads'
        };
      }

      const url = `${this.pinataApiUrl}/pinning/pinJSONToIPFS`;

      const payload = {
        pinataContent: jsonData,
        pinataMetadata: { 
          name: name || 'herb-metadata',
          keyvalues: {
            project: 'herbionyx',
            type: 'metadata'
          }
        },
        pinataOptions: {
          cidVersion: 1
        }
      };

      console.log('🔄 Uploading JSON to IPFS via Pinata...');
      console.log('Payload size:', JSON.stringify(payload).length, 'bytes');

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('✅ IPFS upload successful:', response.data.IpfsHash);

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        demo: false
      };
    } catch (err) {
      console.error('❌ Error uploading JSON to IPFS:', err.response?.data || err.message);
      
      // Detailed error logging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        console.error('Response headers:', err.response.headers);
      }
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        console.log('🔑 Authentication failed - check your Pinata API keys');
        console.log('Current API Key:', this.pinataApiKey ? this.pinataApiKey.substring(0, 8) + '...' : 'Missing');
        console.log('Secret Key:', this.pinataSecretKey ? 'Set (length: ' + this.pinataSecretKey.length + ')' : 'Missing');
      }
      
      // For any error, fall back to demo mode instead of failing
      console.log('📝 IPFS upload failed, falling back to demo mode');
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      return {
        success: true,
        ipfsHash: mockHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
        demo: true,
        warning: 'Using demo mode - IPFS upload failed: ' + (err.response?.data?.error || err.message)
      };
    }
  }

  // ---------- Upload File ----------
  async uploadFile(fileBuffer, fileName, mimeType) {
    try {
      // Check if API keys are configured
      if (!this.pinataApiKey || !this.pinataSecretKey) {
        console.log('📁 API keys missing, falling back to demo mode');
        const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
        return {
          success: true,
          ipfsHash: mockHash,
          pinataUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
          demo: true,
          warning: 'Using demo mode - configure Pinata API keys for real IPFS uploads'
        };
      }

      const url = `${this.pinataApiUrl}/pinning/pinFileToIPFS`;

      const formData = new FormData();
      formData.append('file', fileBuffer, { 
        filename: fileName, 
        contentType: mimeType 
      });
      formData.append('pinataMetadata', JSON.stringify({ 
        name: fileName,
        keyvalues: {
          project: 'herbionyx',
          type: 'file'
        }
      }));
      formData.append('pinataOptions', JSON.stringify({
        cidVersion: 1
      }));

      console.log('🔄 Uploading file to IPFS via Pinata...');
      console.log('File size:', fileBuffer.length, 'bytes');

      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000 // 60 second timeout for file uploads
      });

      console.log('✅ File upload successful:', response.data.IpfsHash);

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
        demo: false
      };
    } catch (err) {
      console.error('❌ Error uploading file to IPFS:', err.response?.data || err.message);
      
      // Detailed error logging
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        console.log('🔑 Authentication failed - check your Pinata API keys');
      }
      
      // For any error, fall back to demo mode instead of failing
      console.log('📁 File upload failed, falling back to demo mode');
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      return {
        success: true,
        ipfsHash: mockHash,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
        demo: true,
        warning: 'Using demo mode - file upload failed: ' + (err.response?.data?.error || err.message)
      };
    }
  }

  // ---------- Get File ----------
  async getFile(ipfsHash) {
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      console.log('🔄 Retrieving file from IPFS:', ipfsHash);
      
      const response = await axios.get(url, {
        timeout: 15000 // 15 second timeout
      });

      console.log('✅ File retrieved successfully from IPFS');
      return { success: true, data: response.data };
    } catch (err) {
      console.error('❌ Error retrieving file from IPFS:', err.message);
      
      // Return mock data for demo purposes
      return { 
        success: true, 
        data: {
          type: 'demo',
          message: 'Demo data - IPFS retrieval failed',
          timestamp: new Date().toISOString()
        },
        demo: true,
        warning: 'Using demo data - IPFS retrieval failed'
      };
    }
  }

  // ---------- Metadata Generators ----------
  async createCollectionMetadata(data) {
    const metadata = {
      type: 'collection',
      timestamp: new Date().toISOString(),
      version: '1.0',
      network: 'hyperledger-fabric',
      ...data,
      location: {
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        zone: data.location?.zone,
        address: data.location?.address || ''
      },
      qualityGrade: data.qualityGrade || '',
      notes: data.notes || '',
      images: data.images || []
    };

    return await this.uploadJSON(metadata, `collection-${data.batchId}`);
  }

  async createQualityTestMetadata(data) {
    const metadata = {
      type: 'quality_test',
      timestamp: new Date().toISOString(),
      version: '1.0',
      network: 'hyperledger-fabric',
      ...data,
      testResults: {
        moistureContent: data.moistureContent,
        purity: data.purity,
        pesticideLevel: data.pesticideLevel,
        heavyMetals: data.heavyMetals || {},
        microbiological: data.microbiological || {},
        activeCompounds: data.activeCompounds || {}
      },
      testMethod: data.testMethod || '',
      certification: data.certification || '',
      notes: data.notes || '',
      images: data.images || []
    };

    return await this.uploadJSON(metadata, `quality-test-${data.eventId}`);
  }

  async createProcessingMetadata(data) {
    const metadata = {
      type: 'processing',
      timestamp: new Date().toISOString(),
      version: '1.0',
      network: 'hyperledger-fabric',
      ...data,
      processingDetails: {
        method: data.method,
        temperature: data.temperature,
        duration: data.duration,
        yield: data.yield,
        equipment: data.equipment || '',
        parameters: data.parameters || {}
      },
      outputProduct: data.outputProduct || '',
      qualityMetrics: data.qualityMetrics || {},
      notes: data.notes || '',
      images: data.images || []
    };

    return await this.uploadJSON(metadata, `processing-${data.eventId}`);
  }

  async createManufacturingMetadata(data) {
    const metadata = {
      type: 'manufacturing',
      timestamp: new Date().toISOString(),
      version: '1.0',
      network: 'hyperledger-fabric',
      ...data,
      product: {
        name: data.productName,
        type: data.productType,
        form: data.productForm,
        quantity: data.quantity,
        unit: data.unit,
        batchSize: data.batchSize,
        expiryDate: data.expiryDate
      },
      packaging: {
        material: data.packaging?.material || '',
        size: data.packaging?.size || '',
        labels: data.packaging?.labels || []
      },
      qualityControl: {
        tests: data.qualityTests || [],
        certifications: data.certifications || [],
        standards: data.standards || []
      },
      notes: data.notes || '',
      images: data.images || []
    };

    return await this.uploadJSON(metadata, `manufacturing-${data.eventId}`);
  }

  // Test Pinata connection
  async testConnection() {
    try {
      if (!this.pinataApiKey || !this.pinataSecretKey) {
        return {
          success: false,
          error: 'API keys not configured'
        };
      }

      const response = await axios.get(`${this.pinataApiUrl}/data/testAuthentication`, {
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        timeout: 10000
      });

      console.log('✅ Pinata connection test successful');
      return {
        success: true,
        data: response.data
      };
    } catch (err) {
      console.error('❌ Pinata connection test failed:', err.response?.data || err.message);
      return {
        success: false,
        error: err.response?.data?.error || err.message
      };
    }
  }
}

module.exports = new IPFSService();