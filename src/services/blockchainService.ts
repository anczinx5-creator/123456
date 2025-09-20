import { FABRIC_CONFIG, NETWORK_CONFIG, CHAINCODE_FUNCTIONS } from '../config/fabric';
import { API_CONFIG } from '../config/api';

class BlockchainService {
  private initialized = false;
  private isBackendAvailable = false;
  private fabricConnected = false;
  private baseUrl = API_CONFIG.BASE_URL;

  async initialize() {
    if (this.initialized) return true;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/blockchain/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isBackendAvailable = true;
        this.fabricConnected = data.success && data.fabricConnected;
        console.log('✅ Connected to Hyperledger Fabric network via backend');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Hyperledger Fabric backend not available');
      }
    } catch (error) {
      console.error('❌ Hyperledger Fabric backend not available:', error);
      this.isBackendAvailable = false;
      this.fabricConnected = false;
      throw error;
    }

    this.initialized = true;
    return true;
  }

  async createBatch(userAddress: string, batchData: any) {
    try {
      await this.initialize();
      
      const response = await fetch(`${this.baseUrl}/api/blockchain/create-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userAddress, batchData })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        success: result.success,
        data: result.data,
        transactionId: result.transactionId || `fabric_tx_${Date.now()}`,
        network: 'hyperledger-fabric',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating batch on Hyperledger Fabric:', error);
      throw error;
    }
  }

  async addQualityTestEvent(userAddress: string, eventData: any) {
    try {
      await this.initialize();
      
      const response = await fetch(`${this.baseUrl}/api/blockchain/add-quality-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userAddress, eventData })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        success: result.success,
        data: result.data,
        transactionId: result.transactionId || `fabric_tx_${Date.now()}`,
        network: 'hyperledger-fabric',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding quality test event to Hyperledger Fabric:', error);
      throw error;
    }
  }

  async addProcessingEvent(userAddress: string, eventData: any) {
    try {
      await this.initialize();
      
      const response = await fetch(`${this.baseUrl}/api/blockchain/add-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userAddress, eventData })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        success: result.success,
        data: result.data,
        transactionId: result.transactionId || `fabric_tx_${Date.now()}`,
        network: 'hyperledger-fabric',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding processing event to Hyperledger Fabric:', error);
      throw error;
    }
  }

  async addManufacturingEvent(userAddress: string, eventData: any) {
    try {
      await this.initialize();
      
      const response = await fetch(`${this.baseUrl}/api/blockchain/add-manufacturing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userAddress, eventData })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        success: result.success,
        data: result.data,
        transactionId: result.transactionId || `fabric_tx_${Date.now()}`,
        network: 'hyperledger-fabric',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding manufacturing event to Hyperledger Fabric:', error);
      throw error;
    }
  }

  async getBatchEvents(batchId: string) {
    try {
      await this.initialize();
      
      const response = await fetch(`${this.baseUrl}/api/tracking/batch/${batchId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success ? result.batch.events : [];
    } catch (error) {
      console.error('Error getting batch events from Hyperledger Fabric:', error);
      throw error;
    }
  }

  async getAllBatches() {
    try {
      await this.initialize();
      
      const response = await fetch(`${this.baseUrl}/api/tracking/batches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success ? result.batches : [];
    } catch (error) {
      console.error('Error getting all batches from Hyperledger Fabric:', error);
      throw error;
    }
  }

  generateBatchId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `HERB-${timestamp}-${random}`;
  }

  generateEventId(eventType: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${eventType}-${timestamp}-${random}`;
  }

  getConnectionStatus() {
    return {
      initialized: this.initialized,
      backendAvailable: this.isBackendAvailable,
      fabricConnected: this.fabricConnected,
      mode: this.fabricConnected ? 'production' : 'demo',
      network: 'hyperledger-fabric'
    };
  }

  getFabricNetworkInfo() {
    return {
      ...NETWORK_CONFIG,
      channelName: FABRIC_CONFIG.CHANNEL_NAME,
      chaincodeName: FABRIC_CONFIG.CHAINCODE_NAME,
      mspId: FABRIC_CONFIG.ORG_MSP_ID,
      connected: this.fabricConnected
    };
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;