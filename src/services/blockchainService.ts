import { FABRIC_CONFIG, NETWORK_CONFIG, CHAINCODE_FUNCTIONS } from '../config/fabric';
import apiService from './apiService';

class BlockchainService {
  private initialized = false;
  private isBackendAvailable = false;
  private fabricConnected = false;

  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Try to connect to Hyperledger Fabric backend
      const response = await apiService.initializeBlockchain();
      if (response.success) {
        this.isBackendAvailable = true;
        this.fabricConnected = true;
        console.log('✅ Connected to Hyperledger Fabric network via backend');
      } else {
        throw new Error('Hyperledger Fabric backend not available');
      }
    } catch (error) {
      console.log('⚠️  Hyperledger Fabric backend not available, running in demo mode');
      this.isBackendAvailable = false;
      this.fabricConnected = false;
    }

    this.initialized = true;
    return true;
  }

  async createBatch(userAddress: string, batchData: any) {
    try {
      if (this.isBackendAvailable && this.fabricConnected) {
        // Use real Hyperledger Fabric backend
        const response = await fetch(`${apiService['baseUrl']}/api/blockchain/create-batch`, {
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
        return result;
      } else {
        // Demo mode - simulate successful Hyperledger Fabric transaction
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('🎭 Demo mode: Simulating Hyperledger Fabric transaction');
      }
      
      return {
        success: true,
        transactionId: `fabric_tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString(),
        network: 'hyperledger-fabric',
        demo: !this.fabricConnected
      };
    } catch (error) {
      console.error('Error creating batch on Hyperledger Fabric:', error);
      
      // Fallback to demo mode on error
      console.log('🎭 Falling back to demo mode for Hyperledger Fabric transaction');
      return {
        success: true,
        transactionId: `fabric_demo_tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString(),
        network: 'hyperledger-fabric',
        demo: true,
        warning: 'Using demo mode - Hyperledger Fabric network not available'
      };
    }
  }

  async addQualityTestEvent(userAddress: string, eventData: any) {
    try {
      if (this.isBackendAvailable && this.fabricConnected) {
        const response = await fetch(`${apiService['baseUrl']}/api/blockchain/add-quality-test`, {
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
        
        return await response.json();
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('🎭 Demo mode: Simulating Hyperledger Fabric quality test transaction');
      }
      
      return {
        success: true,
        transactionId: `fabric_tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString(),
        network: 'hyperledger-fabric',
        demo: !this.fabricConnected
      };
    } catch (error) {
      console.error('Error adding quality test event to Hyperledger Fabric:', error);
      
      // Fallback to demo mode
      return {
        success: true,
        transactionId: `fabric_demo_tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString(),
        network: 'hyperledger-fabric',
        demo: true,
        warning: 'Using demo mode - Hyperledger Fabric network not available'
      };
    }
  }

  async addProcessingEvent(userAddress: string, eventData: any) {
    try {
      if (this.isBackendAvailable && this.fabricConnected) {
        const response = await fetch(`${apiService['baseUrl']}/api/blockchain/add-processing`, {
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
        
        return await response.json();
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('🎭 Demo mode: Simulating Hyperledger Fabric processing transaction');
      }
      
      return {
        success: true,
        transactionId: `fabric_tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString(),
        network: 'hyperledger-fabric',
        demo: !this.fabricConnected
      };
    } catch (error) {
      console.error('Error adding processing event to Hyperledger Fabric:', error);
      
      // Fallback to demo mode
      return {
        success: true,
        transactionId: `fabric_demo_tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString(),
        network: 'hyperledger-fabric',
        demo: true,
        warning: 'Using demo mode - Hyperledger Fabric network not available'
      };
    }
  }

  async addManufacturingEvent(userAddress: string, eventData: any) {
    try {
      if (this.isBackendAvailable && this.fabricConnected) {
        const response = await fetch(`${apiService['baseUrl']}/api/blockchain/add-manufacturing`, {
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
        
        return await response.json();
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('🎭 Demo mode: Simulating Hyperledger Fabric manufacturing transaction');
      }
      
      return {
        success: true,
        transactionId: `fabric_tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString(),
        network: 'hyperledger-fabric',
        demo: !this.fabricConnected
      };
    } catch (error) {
      console.error('Error adding manufacturing event to Hyperledger Fabric:', error);
      
      // Fallback to demo mode
      return {
        success: true,
        transactionId: `fabric_demo_tx_${Math.random().toString(36).substr(2, 16)}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date().toISOString(),
        network: 'hyperledger-fabric',
        demo: true,
        warning: 'Using demo mode - Hyperledger Fabric network not available'
      };
    }
  }

  async getBatchEvents(batchId: string) {
    try {
      if (this.isBackendAvailable && this.fabricConnected) {
        const response = await apiService.getBatchInfo(batchId);
        return response.data?.events || [];
      } else {
        // Demo mode - return mock events from Hyperledger Fabric
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('🎭 Demo mode: Simulating Hyperledger Fabric query');
      }
      
      return [
        {
          eventId: `COLLECTION-${Date.now()}-1234`,
          eventType: 'COLLECTION',
          collectorName: 'John Collector',
          ipfsHash: 'QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          location: { zone: 'Himalayan Region - Uttarakhand' },
          network: 'hyperledger-fabric'
        }
      ];
    } catch (error) {
      console.error('Error getting batch events from Hyperledger Fabric:', error);
      return [];
    }
  }

  async getAllBatches() {
    try {
      if (this.isBackendAvailable && this.fabricConnected) {
        const response = await apiService.getAllBatches();
        return response.data || [];
      } else {
        // Demo mode - return mock batches from Hyperledger Fabric
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('🎭 Demo mode: Simulating Hyperledger Fabric batch query');
      }
      
      return [
        {
          batchId: 'HERB-1234567890-1234',
          herbSpecies: 'Ashwagandha',
          creationTime: new Date(Date.now() - 86400000).toISOString(),
          eventCount: 1,
          network: 'hyperledger-fabric'
        }
      ];
    } catch (error) {
      console.error('Error getting all batches from Hyperledger Fabric:', error);
      return [];
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