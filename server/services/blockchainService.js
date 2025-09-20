const fabricService = require('./fabricService');

class BlockchainService {
    constructor() {
        this.fabricService = fabricService;
    }

    async initialize() {
        try {
            const result = await this.fabricService.connect();
            if (!result.success) {
                throw new Error('Failed to connect to Hyperledger Fabric network');
            }
            return result;
        } catch (error) {
            console.error('Blockchain service initialization failed:', error);
            throw error;
        }
    }

    async createBatch(userAddress, batchData) {
        try {
            const result = await this.fabricService.createCollectionEvent(
                batchData.batchId,
                batchData.herbSpecies,
                batchData.collectorName || 'Unknown',
                batchData.weight || 0,
                batchData.harvestDate || new Date().toISOString().split('T')[0],
                batchData.location || {},
                batchData.qualityGrade || '',
                batchData.notes || '',
                batchData.ipfsHash || '',
                batchData.qrCodeHash || ''
            );

            return {
                success: result.success,
                data: result.data,
                transactionId: result.transactionId,
                network: 'hyperledger-fabric'
            };
        } catch (error) {
            console.error('Error creating batch:', error);
            throw error;
        }
    }

    async addQualityTestEvent(userAddress, eventData) {
        try {
            const result = await this.fabricService.createQualityTestEvent(
                eventData.batchId,
                eventData.parentEventId,
                eventData.testerName || 'Unknown',
                eventData.moistureContent || 0,
                eventData.purity || 0,
                eventData.pesticideLevel || 0,
                eventData.testMethod || 'Standard Test',
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );

            return {
                success: result.success,
                data: result.data,
                transactionId: result.transactionId,
                network: 'hyperledger-fabric'
            };
        } catch (error) {
            console.error('Error adding quality test event:', error);
            throw error;
        }
    }

    async addProcessingEvent(userAddress, eventData) {
        try {
            const result = await this.fabricService.createProcessingEvent(
                eventData.batchId,
                eventData.parentEventId,
                eventData.processorName || 'Unknown',
                eventData.method || 'Standard Processing',
                eventData.temperature || null,
                eventData.duration || '',
                eventData.yield || 0,
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );

            return {
                success: result.success,
                data: result.data,
                transactionId: result.transactionId,
                network: 'hyperledger-fabric'
            };
        } catch (error) {
            console.error('Error adding processing event:', error);
            throw error;
        }
    }

    async addManufacturingEvent(userAddress, eventData) {
        try {
            const result = await this.fabricService.createManufacturingEvent(
                eventData.batchId,
                eventData.parentEventId,
                eventData.manufacturerName || 'Unknown',
                eventData.productName || 'Herbal Product',
                eventData.productType || 'Capsules',
                eventData.quantity || 0,
                eventData.unit || 'units',
                eventData.expiryDate || '',
                eventData.notes || '',
                eventData.ipfsHash || '',
                eventData.qrCodeHash || ''
            );

            return {
                success: result.success,
                data: result.data,
                transactionId: result.transactionId,
                network: 'hyperledger-fabric'
            };
        } catch (error) {
            console.error('Error adding manufacturing event:', error);
            throw error;
        }
    }

    async getBatchEvents(batchId) {
        try {
            const result = await this.fabricService.getBatchEvents(batchId);
            return {
                success: result.success,
                data: result.data
            };
        } catch (error) {
            console.error('Error getting batch events:', error);
            throw error;
        }
    }

    async getAllBatches() {
        try {
            const result = await this.fabricService.getAllBatches();
            return {
                success: result.success,
                data: result.data
            };
        } catch (error) {
            console.error('Error getting all batches:', error);
            throw error;
        }
    }

    async getUserInfo(userAddress) {
        // Return user info from our user system
        return {
            address: userAddress,
            isActive: true,
            role: 1,
            registrationTime: Date.now()
        };
    }

    async registerUser(address, role, name, organization) {
        // User registration is handled by auth system
        return {
            success: true,
            transactionId: `fabric_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    generateBatchId() {
        return this.fabricService.generateBatchId();
    }

    generateEventId(eventType) {
        return this.fabricService.generateEventId(eventType);
    }

    getConnectionStatus() {
        return {
            initialized: this.fabricService.isConnected,
            backendAvailable: true,
            fabricConnected: this.fabricService.isConnected,
            mode: this.fabricService.isConnected ? 'production' : 'disconnected',
            network: 'hyperledger-fabric'
        };
    }

    getFabricNetworkInfo() {
        return {
            name: 'HerbionYX Hyperledger Fabric Network',
            type: 'Hyperledger Fabric',
            version: '2.5.4',
            channelName: this.fabricService.channelName,
            chaincodeName: this.fabricService.chaincodeName,
            mspId: this.fabricService.mspId,
            connected: this.fabricService.isConnected
        };
    }

    async disconnect() {
        await this.fabricService.disconnect();
    }
}

module.exports = new BlockchainService();