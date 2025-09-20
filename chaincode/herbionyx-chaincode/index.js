'use strict';

const HerbionYXContract = require('./HerbionYXContract');

module.exports.contracts = [HerbionYXContract];

class HerbionYXContract extends Contract {

    // Initialize the ledger
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');

        // Example initial data (you can extend later)
        const batches = [
            {
                docType: 'batch',
                batchId: 'BATCH0',
                herbSpecies: 'Tulsi',
                creator: 'System',
                creationTime: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                events: [],
                currentStatus: 'INITIALIZED'
            }
        ];

        for (let i = 0; i < batches.length; i++) {
            await ctx.stub.putState(batches[i].batchId, Buffer.from(JSON.stringify(batches[i])));
            console.info('Added batch:', batches[i]);
        }

        console.info('============= END : Initialize Ledger ===========');
    }

    // ----------------- COLLECTION EVENT -----------------
    async createCollectionEvent(ctx, batchId, herbSpecies, collectorName, weight, harvestDate, location, qualityGrade, notes, ipfsHash, qrCodeHash) {
        console.info('============= START : Create Collection Event ==========');

        const collectionEvent = {
            docType: 'collectionEvent',
            batchId,
            eventId: `COLLECTION-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            herbSpecies,
            collectorName,
            weight: parseFloat(weight),
            harvestDate,
            location: JSON.parse(location),
            qualityGrade,
            notes,
            ipfsHash,
            qrCodeHash,
            timestamp: new Date().toISOString(),
            eventType: 'COLLECTION'
        };

        await ctx.stub.putState(collectionEvent.eventId, Buffer.from(JSON.stringify(collectionEvent)));

        // Batch update or create
        let batch;
        const batchAsBytes = await ctx.stub.getState(batchId);

        if (!batchAsBytes || batchAsBytes.length === 0) {
            batch = {
                docType: 'batch',
                batchId,
                herbSpecies,
                creator: collectorName,
                creationTime: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                events: [collectionEvent.eventId],
                currentStatus: 'COLLECTED'
            };
        } else {
            batch = JSON.parse(batchAsBytes.toString());
            batch.events.push(collectionEvent.eventId);
            batch.lastUpdated = new Date().toISOString();
        }

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        console.info('============= END : Create Collection Event ==========');
        return JSON.stringify(collectionEvent);
    }

    // ----------------- QUALITY TEST EVENT -----------------
    async createQualityTestEvent(ctx, batchId, parentEventId, testerName, moistureContent, purity, pesticideLevel, testMethod, notes, ipfsHash, qrCodeHash) {
        console.info('============= START : Create Quality Test Event ==========');

        const qualityTestEvent = {
            docType: 'qualityTestEvent',
            batchId,
            eventId: `QUALITY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            parentEventId,
            testerName,
            testResults: {
                moistureContent: parseFloat(moistureContent),
                purity: parseFloat(purity),
                pesticideLevel: parseFloat(pesticideLevel)
            },
            testMethod,
            notes,
            ipfsHash,
            qrCodeHash,
            timestamp: new Date().toISOString(),
            eventType: 'QUALITY_TEST'
        };

        await ctx.stub.putState(qualityTestEvent.eventId, Buffer.from(JSON.stringify(qualityTestEvent)));

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        batch.events.push(qualityTestEvent.eventId);
        batch.lastUpdated = new Date().toISOString();
        batch.currentStatus = 'QUALITY_TESTED';

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        console.info('============= END : Create Quality Test Event ==========');
        return JSON.stringify(qualityTestEvent);
    }

    // ----------------- PROCESSING EVENT -----------------
    async createProcessingEvent(ctx, batchId, parentEventId, processorName, method, temperature, duration, yieldAmount, notes, ipfsHash, qrCodeHash) {
        console.info('============= START : Create Processing Event ==========');

        const processingEvent = {
            docType: 'processingEvent',
            batchId,
            eventId: `PROCESSING-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            parentEventId,
            processorName,
            processingDetails: {
                method,
                temperature: temperature ? parseFloat(temperature) : null,
                duration,
                yield: parseFloat(yieldAmount)
            },
            notes,
            ipfsHash,
            qrCodeHash,
            timestamp: new Date().toISOString(),
            eventType: 'PROCESSING'
        };

        await ctx.stub.putState(processingEvent.eventId, Buffer.from(JSON.stringify(processingEvent)));

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        batch.events.push(processingEvent.eventId);
        batch.lastUpdated = new Date().toISOString();
        batch.currentStatus = 'PROCESSED';

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        console.info('============= END : Create Processing Event ==========');
        return JSON.stringify(processingEvent);
    }

    // ----------------- MANUFACTURING EVENT -----------------
    async createManufacturingEvent(ctx, batchId, parentEventId, manufacturerName, productName, productType, quantity, unit, expiryDate, notes, ipfsHash, qrCodeHash) {
        console.info('============= START : Create Manufacturing Event ==========');

        const manufacturingEvent = {
            docType: 'manufacturingEvent',
            batchId,
            eventId: `MANUFACTURING-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            parentEventId,
            manufacturerName,
            productDetails: {
                productName,
                productType,
                quantity: parseFloat(quantity),
                unit,
                expiryDate
            },
            notes,
            ipfsHash,
            qrCodeHash,
            timestamp: new Date().toISOString(),
            eventType: 'MANUFACTURING'
        };

        await ctx.stub.putState(manufacturingEvent.eventId, Buffer.from(JSON.stringify(manufacturingEvent)));

        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        batch.events.push(manufacturingEvent.eventId);
        batch.lastUpdated = new Date().toISOString();
        batch.currentStatus = 'MANUFACTURED';

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(batch)));

        console.info('============= END : Create Manufacturing Event ==========');
        return JSON.stringify(manufacturingEvent);
    }

    // ----------------- QUERIES -----------------
    async queryBatch(ctx, batchId) {
        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }
        return batchAsBytes.toString();
    }

    async queryEvent(ctx, eventId) {
        const eventAsBytes = await ctx.stub.getState(eventId);
        if (!eventAsBytes || eventAsBytes.length === 0) {
            throw new Error(`Event ${eventId} does not exist`);
        }
        return eventAsBytes.toString();
    }

    async getBatchEvents(ctx, batchId) {
        const batchAsBytes = await ctx.stub.getState(batchId);
        if (!batchAsBytes || batchAsBytes.length === 0) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        const batch = JSON.parse(batchAsBytes.toString());
        const events = [];

        for (const eventId of batch.events) {
            const eventAsBytes = await ctx.stub.getState(eventId);
            if (eventAsBytes && eventAsBytes.length > 0) {
                events.push(JSON.parse(eventAsBytes.toString()));
            }
        }

        return JSON.stringify(events);
    }

    async getAllBatches(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const allResults = [];

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    Record = res.value.value.toString('utf8');
                }

                if (Record.docType === 'batch') {
                    allResults.push({ Key, Record });
                }
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    async getBatchHistory(ctx, batchId) {
        const iterator = await ctx.stub.getHistoryForKey(batchId);
        const allResults = [];

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const obj = JSON.parse(res.value.value.toString('utf8'));
                allResults.push({
                    txId: res.value.tx_id,
                    timestamp: res.value.timestamp,
                    isDelete: res.value.is_delete.toString(),
                    value: obj
                });
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    async queryBatchesByHerbSpecies(ctx, herbSpecies) {
        const queryString = {
            selector: {
                docType: 'batch',
                herbSpecies
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allResults = [];

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }
}

module.exports.contracts = [HerbionYXContract];
