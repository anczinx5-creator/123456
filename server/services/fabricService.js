const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

class FabricService {
    constructor() {
        this.channelName = 'herbionyx-channel';
        this.chaincodeName = 'herbionyx-chaincode';
        this.mspId = 'Org1MSP';
        this.walletPath = path.join(process.cwd(), 'wallet');
        this.gateway = null;
        this.contract = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (this.isConnected && this.contract) {
                console.log('✅ Already connected to Fabric network');
                return { success: true, demo: false };
            }

            // Check if Fabric network is running
            await this.checkNetworkAvailability();

            // Initialize wallet
            const wallet = await this.initializeWallet();

            // Create gateway
            this.gateway = new Gateway();
            
            // Connect to gateway
            const connectionProfile = this.getConnectionProfile();
            await this.gateway.connect(connectionProfile, {
                wallet,
                identity: 'appUser',
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get network and contract
            const network = await this.gateway.getNetwork(this.channelName);
            this.contract = network.getContract(this.chaincodeName);

            this.isConnected = true;
            console.log('✅ Successfully connected to Hyperledger Fabric network');
            
            return { success: true, demo: false };
        } catch (error) {
            console.error('❌ Failed to connect to Hyperledger Fabric network:', error.message);
            throw new Error(`Hyperledger Fabric network connection failed: ${error.message}. Please ensure the network is running using: cd fabric-network/scripts && ./network.sh up`);
        }
    }

    async checkNetworkAvailability() {
        // Check if required certificate files exist
        const requiredFiles = [
            path.join(__dirname, '../../fabric-network/organizations/peerOrganizations/org1.herbionyx.com/ca/ca.org1.herbionyx.com-cert.pem'),
            path.join(__dirname, '../../fabric-network/organizations/peerOrganizations/org1.herbionyx.com/tlsca/tlsca.org1.herbionyx.com-cert.pem'),
            path.join(__dirname, '../../fabric-network/organizations/ordererOrganizations/herbionyx.com/ca/ca.herbionyx.com-cert.pem')
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required certificate file not found: ${file}. Please start the Fabric network first.`);
            }
        }

        // Test network connectivity by checking if containers are running
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec('docker ps --filter name=peer0.org1.herbionyx.com --format "{{.Names}}"', (error, stdout) => {
                if (error || !stdout.includes('peer0.org1.herbionyx.com')) {
                    reject(new Error('Fabric network containers are not running. Please start the network using: cd fabric-network/scripts && ./network.sh up'));
                } else {
                    resolve(true);
                }
            });
        });
    }

    async initializeWallet() {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Check if admin identity exists
            const adminIdentity = await wallet.get('admin');
            if (!adminIdentity) {
                console.log('Creating admin identity...');
                await this.enrollAdmin(wallet);
            }

            // Check if user identity exists
            const userIdentity = await wallet.get('appUser');
            if (!userIdentity) {
                console.log('Creating user identity...');
                await this.registerUser(wallet);
            }

            return wallet;
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            throw new Error(`Wallet initialization failed: ${error.message}`);
        }
    }

    async enrollAdmin(wallet) {
        try {
            const caInfo = this.getCaInfo();
            const ca = new FabricCAServices(caInfo.url, { 
                trustedRoots: caInfo.tlsCACerts, 
                verify: false 
            }, caInfo.caName);

            const enrollment = await ca.enroll({ 
                enrollmentID: 'admin', 
                enrollmentSecret: 'adminpw' 
            });
            
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put('admin', x509Identity);
            console.log('✅ Successfully enrolled admin user');
        } catch (error) {
            console.error('Failed to enroll admin user:', error);
            throw new Error(`Admin enrollment failed: ${error.message}`);
        }
    }

    async registerUser(wallet) {
        try {
            const caInfo = this.getCaInfo();
            const ca = new FabricCAServices(caInfo.url, { 
                trustedRoots: caInfo.tlsCACerts, 
                verify: false 
            }, caInfo.caName);

            const adminIdentity = await wallet.get('admin');
            if (!adminIdentity) {
                throw new Error('Admin identity not found in wallet');
            }

            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');

            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: 'appUser',
                role: 'client'
            }, adminUser);

            const enrollment = await ca.enroll({
                enrollmentID: 'appUser',
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put('appUser', x509Identity);
            console.log('✅ Successfully registered and enrolled app user');
        } catch (error) {
            console.error('Failed to register user:', error);
            throw new Error(`User registration failed: ${error.message}`);
        }
    }

    getCaInfo() {
        const certPath = path.join(__dirname, '../../fabric-network/organizations/peerOrganizations/org1.herbionyx.com/ca/ca.org1.herbionyx.com-cert.pem');
        
        if (!fs.existsSync(certPath)) {
            throw new Error('Fabric network certificates not found - please start the network first using: cd fabric-network/scripts && ./network.sh up');
        }
        
        return {
            url: 'https://localhost:7054',
            caName: 'ca.org1.herbionyx.com',
            tlsCACerts: fs.readFileSync(certPath)
        };
    }

    getConnectionProfile() {
        const peerCertPath = path.join(__dirname, '../../fabric-network/organizations/peerOrganizations/org1.herbionyx.com/tlsca/tlsca.org1.herbionyx.com-cert.pem');
        const caCertPath = path.join(__dirname, '../../fabric-network/organizations/peerOrganizations/org1.herbionyx.com/ca/ca.org1.herbionyx.com-cert.pem');
        
        if (!fs.existsSync(peerCertPath) || !fs.existsSync(caCertPath)) {
            throw new Error('Fabric network certificates not found - please start the network first using: cd fabric-network/scripts && ./network.sh up');
        }
        
        return {
            name: 'herbionyx-network',
            version: '1.0.0',
            client: {
                organization: 'Org1',
                connection: {
                    timeout: {
                        peer: { endorser: '300' },
                        orderer: '300'
                    }
                }
            },
            organizations: {
                Org1: {
                    mspid: 'Org1MSP',
                    peers: ['peer0.org1.herbionyx.com'],
                    certificateAuthorities: ['ca.org1.herbionyx.com']
                }
            },
            peers: {
                'peer0.org1.herbionyx.com': {
                    url: 'grpcs://localhost:7051',
                    tlsCACerts: {
                        pem: fs.readFileSync(peerCertPath).toString()
                    },
                    grpcOptions: {
                        'ssl-target-name-override': 'peer0.org1.herbionyx.com',
                        'hostnameOverride': 'peer0.org1.herbionyx.com'
                    }
                }
            },
            certificateAuthorities: {
                'ca.org1.herbionyx.com': {
                    url: 'https://localhost:7054',
                    caName: 'ca.org1.herbionyx.com',
                    tlsCACerts: {
                        pem: fs.readFileSync(caCertPath).toString()
                    },
                    httpOptions: {
                        verify: false
                    }
                }
            }
        };
    }

    async createCollectionEvent(batchId, herbSpecies, collectorName, weight, harvestDate, location, qualityGrade, notes, ipfsHash, qrCodeHash) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.submitTransaction(
                'createCollectionEvent',
                batchId,
                herbSpecies,
                collectorName,
                weight.toString(),
                harvestDate,
                JSON.stringify(location),
                qualityGrade,
                notes,
                ipfsHash,
                qrCodeHash
            );

            console.log('✅ Collection event created on Hyperledger Fabric');
            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: `fabric_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                demo: false
            };
        } catch (error) {
            console.error('❌ Error creating collection event on Fabric:', error);
            throw new Error(`Failed to create collection event on Hyperledger Fabric: ${error.message}`);
        }
    }

    async createQualityTestEvent(batchId, parentEventId, testerName, moistureContent, purity, pesticideLevel, testMethod, notes, ipfsHash, qrCodeHash) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.submitTransaction(
                'createQualityTestEvent',
                batchId,
                parentEventId,
                testerName,
                moistureContent.toString(),
                purity.toString(),
                pesticideLevel.toString(),
                testMethod,
                notes,
                ipfsHash,
                qrCodeHash
            );

            console.log('✅ Quality test event created on Hyperledger Fabric');
            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: `fabric_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                demo: false
            };
        } catch (error) {
            console.error('❌ Error creating quality test event on Fabric:', error);
            throw new Error(`Failed to create quality test event on Hyperledger Fabric: ${error.message}`);
        }
    }

    async createProcessingEvent(batchId, parentEventId, processorName, method, temperature, duration, yieldAmount, notes, ipfsHash, qrCodeHash) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.submitTransaction(
                'createProcessingEvent',
                batchId,
                parentEventId,
                processorName,
                method,
                temperature ? temperature.toString() : '',
                duration,
                yieldAmount.toString(),
                notes,
                ipfsHash,
                qrCodeHash
            );

            console.log('✅ Processing event created on Hyperledger Fabric');
            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: `fabric_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                demo: false
            };
        } catch (error) {
            console.error('❌ Error creating processing event on Fabric:', error);
            throw new Error(`Failed to create processing event on Hyperledger Fabric: ${error.message}`);
        }
    }

    async createManufacturingEvent(batchId, parentEventId, manufacturerName, productName, productType, quantity, unit, expiryDate, notes, ipfsHash, qrCodeHash) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.submitTransaction(
                'createManufacturingEvent',
                batchId,
                parentEventId,
                manufacturerName,
                productName,
                productType,
                quantity.toString(),
                unit,
                expiryDate,
                notes,
                ipfsHash,
                qrCodeHash
            );

            console.log('✅ Manufacturing event created on Hyperledger Fabric');
            return {
                success: true,
                data: JSON.parse(result.toString()),
                transactionId: `fabric_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                demo: false
            };
        } catch (error) {
            console.error('❌ Error creating manufacturing event on Fabric:', error);
            throw new Error(`Failed to create manufacturing event on Hyperledger Fabric: ${error.message}`);
        }
    }

    async queryBatch(batchId) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.evaluateTransaction('queryBatch', batchId);
            return {
                success: true,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('❌ Error querying batch from Fabric:', error);
            throw new Error(`Failed to query batch from Hyperledger Fabric: ${error.message}`);
        }
    }

    async getBatchEvents(batchId) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.evaluateTransaction('getBatchEvents', batchId);
            const events = JSON.parse(result.toString());
            
            console.log(`✅ Retrieved ${events.length} events for batch ${batchId} from Hyperledger Fabric`);
            return {
                success: true,
                data: events
            };
        } catch (error) {
            console.error('❌ Error getting batch events from Fabric:', error);
            throw new Error(`Failed to get batch events from Hyperledger Fabric: ${error.message}`);
        }
    }

    async getAllBatches() {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.evaluateTransaction('getAllBatches');
            const batches = JSON.parse(result.toString());
            
            console.log(`✅ Retrieved ${batches.length} batches from Hyperledger Fabric`);
            return {
                success: true,
                data: batches
            };
        } catch (error) {
            console.error('❌ Error getting all batches from Fabric:', error);
            throw new Error(`Failed to get batches from Hyperledger Fabric: ${error.message}`);
        }
    }

    async queryEvent(eventId) {
        try {
            if (!this.contract) {
                await this.connect();
            }

            const result = await this.contract.evaluateTransaction('queryEvent', eventId);
            return {
                success: true,
                data: JSON.parse(result.toString())
            };
        } catch (error) {
            console.error('❌ Error querying event from Fabric:', error);
            throw new Error(`Failed to query event from Hyperledger Fabric: ${error.message}`);
        }
    }

    generateBatchId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `HERB-${timestamp}-${random}`;
    }

    generateEventId(eventType) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${eventType}-${timestamp}-${random}`;
    }

    async disconnect() {
        if (this.gateway) {
            this.gateway.disconnect();
            this.gateway = null;
            this.contract = null;
            this.isConnected = false;
            console.log('✅ Disconnected from Hyperledger Fabric network');
        }
    }
}

module.exports = new FabricService();