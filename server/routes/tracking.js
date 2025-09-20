const express = require('express');
const fabricService = require('../services/fabricService');
const ipfsService = require('../services/ipfsService');
const { users } = require('./auth');

const router = express.Router();

// Get batch provenance by event ID
router.get('/batch/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID is required'
      });
    }

    // Ensure Fabric connection
    await fabricService.connect();

    // Try to find the batch containing this event
    let targetBatch = null;
    let batchEvents = [];
    
    try {
      // First try treating eventId as batchId
      const directResult = await fabricService.getBatchEvents(eventId);
      if (directResult.success && directResult.data.length > 0) {
        batchEvents = directResult.data;
        targetBatch = {
          batchId: eventId,
          herbSpecies: batchEvents[0]?.herbSpecies || 'Unknown',
          creator: batchEvents[0]?.collectorName || 'Unknown',
          creationTime: batchEvents[0]?.timestamp || new Date().toISOString(),
          currentStatus: batchEvents[batchEvents.length - 1]?.eventType || 'Unknown'
        };
      } else {
        // If that fails, search through all batches
        const batchesResult = await fabricService.getAllBatches();
        if (batchesResult.success) {
          const batches = batchesResult.data || [];
          
          for (const batch of batches) {
            const batchRecord = batch.Record || batch;
            try {
              const eventsResult = await fabricService.getBatchEvents(batchRecord.batchId);
              if (eventsResult.success && eventsResult.data.find(event => event.eventId === eventId)) {
                targetBatch = batchRecord;
                batchEvents = eventsResult.data;
                break;
              }
            } catch (error) {
              console.warn(`Failed to get events for batch ${batchRecord.batchId}:`, error);
              continue;
            }
          }
        }
      }
    } catch (fabricError) {
      console.error('Hyperledger Fabric service error:', fabricError);
      return res.status(500).json({
        success: false,
        error: 'Failed to connect to Hyperledger Fabric network',
        details: fabricError.message,
        instruction: 'Please ensure the Fabric network is running: cd fabric-network/scripts && ./network.sh up'
      });
    }

    if (!targetBatch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found for this event ID'
      });
    }
    
    // Enhance events with IPFS metadata and user information
    const enhancedEvents = await Promise.all(
      batchEvents.map(async (event) => {
        let metadata = null;
        if (event.ipfsHash) {
          try {
            const metadataResult = await ipfsService.getFile(event.ipfsHash);
            metadata = metadataResult.success ? metadataResult.data : null;
          } catch (error) {
            console.warn('Failed to fetch IPFS metadata:', error);
          }
        }
        
        // Get participant information from users map
        let participantInfo = null;
        for (const [address, user] of users.entries()) {
          const participantName = event.collectorName || event.testerName || event.processorName || event.manufacturerName;
          if (user.name === participantName) {
            participantInfo = {
              name: user.name,
              organization: user.organization,
              role: user.role
            };
            break;
          }
        }

        return {
          ...event,
          metadata,
          participant: {
            address: event.participant || 'unknown',
            info: participantInfo
          }
        };
      })
    );

    // Build provenance tree
    const provenanceTree = buildProvenanceTree(enhancedEvents);

    res.json({
      success: true,
      batch: {
        ...targetBatch,
        events: enhancedEvents,
        provenanceTree
      }
    });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch tracking information from Hyperledger Fabric',
      details: error.message,
      instruction: 'Please ensure the Fabric network is running: cd fabric-network/scripts && ./network.sh up'
    });
  }
});

// Get provenance path from collection to specific event
router.get('/path/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Ensure Fabric connection
    await fabricService.connect();

    // Get all batches to find the target event
    const batchesResult = await fabricService.getAllBatches();
    if (!batchesResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batches from Hyperledger Fabric network',
        instruction: 'Please ensure the Fabric network is running: cd fabric-network/scripts && ./network.sh up'
      });
    }
    
    const batches = batchesResult.data;
    let targetBatch = null;
    let targetEvent = null;

    for (const batch of batches) {
      const batchRecord = batch.Record || batch;
      try {
        const eventsResult = await fabricService.getBatchEvents(batchRecord.batchId);
        if (!eventsResult.success) continue;
        
        const foundEvent = eventsResult.data.find(event => event.eventId === eventId);
        if (foundEvent) {
          targetBatch = batchRecord;
          targetEvent = foundEvent;
          break;
        }
      } catch (error) {
        console.warn(`Failed to get events for batch ${batchRecord.batchId}:`, error);
        continue;
      }
    }

    if (!targetBatch || !targetEvent) {
      return res.status(404).json({
        success: false,
        error: 'Event not found in Hyperledger Fabric network'
      });
    }

    // Get all events for the batch
    const eventsResult = await fabricService.getBatchEvents(targetBatch.batchId);
    if (!eventsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batch events from Hyperledger Fabric network'
      });
    }
    
    const allEvents = eventsResult.data;
    
    // Find the path from collection to target event
    const path = findEventPath(allEvents, eventId);
    
    // Enhance path events with metadata
    const enhancedPath = await Promise.all(
      path.map(async (event) => {
        let metadata = null;
        if (event.ipfsHash) {
          try {
            const metadataResult = await ipfsService.getFile(event.ipfsHash);
            metadata = metadataResult.success ? metadataResult.data : null;
          } catch (error) {
            console.warn('Failed to fetch IPFS metadata:', error);
          }
        }
        
        // Get participant information
        let participantInfo = null;
        for (const [address, user] of users.entries()) {
          const participantName = event.collectorName || event.testerName || event.processorName || event.manufacturerName;
          if (user.name === participantName) {
            participantInfo = {
              name: user.name,
              organization: user.organization,
              role: user.role
            };
            break;
          }
        }

        return {
          ...event,
          metadata,
          participant: {
            address: event.participant || 'unknown',
            info: participantInfo
          }
        };
      })
    );

    res.json({
      success: true,
      batch: targetBatch,
      targetEvent: {
        ...targetEvent,
        metadata: enhancedPath[enhancedPath.length - 1]?.metadata
      },
      path: enhancedPath
    });
  } catch (error) {
    console.error('Path tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event path from Hyperledger Fabric',
      details: error.message,
      instruction: 'Please ensure the Fabric network is running: cd fabric-network/scripts && ./network.sh up'
    });
  }
});

// Get batch statistics
router.get('/stats/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    // Ensure Fabric connection
    await fabricService.connect();

    const eventsResult = await fabricService.getBatchEvents(batchId);
    if (!eventsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batch events from Hyperledger Fabric network',
        instruction: 'Please ensure the Fabric network is running: cd fabric-network/scripts && ./network.sh up'
      });
    }
    
    const events = eventsResult.data;
    if (!events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found in Hyperledger Fabric network'
      });
    }

    // Calculate statistics
    const eventTypes = events.reduce((acc, event) => {
      const type = getEventTypeName(event.eventType);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const participants = [...new Set(events.map(event => 
      event.collectorName || event.testerName || event.processorName || event.manufacturerName
    ))];
    
    const timestamps = events.map(event => new Date(event.timestamp).getTime());
    const timeSpan = {
      start: Math.min(...timestamps),
      end: Math.max(...timestamps),
      duration: Math.max(...timestamps) - Math.min(...timestamps)
    };

    // Build branching statistics
    const branches = calculateBranches(events);

    res.json({
      success: true,
      batchId,
      statistics: {
        totalEvents: events.length,
        eventTypes,
        participants: participants.length,
        timeSpan,
        branches
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch statistics from Hyperledger Fabric',
      details: error.message,
      instruction: 'Please ensure the Fabric network is running: cd fabric-network/scripts && ./network.sh up'
    });
  }
});

// Get all active batches
router.get('/batches', async (req, res) => {
  try {
    // Ensure Fabric connection
    await fabricService.connect();

    const batchesResult = await fabricService.getAllBatches();
    if (!batchesResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batches from Hyperledger Fabric network',
        instruction: 'Please ensure the Fabric network is running: cd fabric-network/scripts && ./network.sh up'
      });
    }
    
    const batches = batchesResult.data || [];
    
    // Enhance with basic event statistics
    const enhancedBatches = await Promise.all(
      batches.map(async (batch) => {
        const batchRecord = batch.Record || batch;
        const batchId = batchRecord.batchId;
        
        let events = [];
        try {
          const eventsResult = await fabricService.getBatchEvents(batchId);
          events = eventsResult.success ? eventsResult.data : [];
        } catch (error) {
          console.warn(`Failed to get events for batch ${batchId}:`, error);
        }
        
        return {
          batchId: batchId,
          herbSpecies: batchRecord.herbSpecies || 'Unknown',
          creator: batchRecord.creator || 'Unknown',
          creationTime: batchRecord.creationTime || new Date().toISOString(),
          lastUpdated: batchRecord.lastUpdated || new Date().toISOString(),
          currentStatus: batchRecord.currentStatus || 'Unknown',
          eventCount: events.length,
          events: events,
          participants: [...new Set(events.map(event => 
            event.collectorName || event.testerName || event.processorName || event.manufacturerName || 'Unknown'
          ))].length
        };
      })
    );

    res.json({
      success: true,
      batches: enhancedBatches
    });
  } catch (error) {
    console.error('Batches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batches from Hyperledger Fabric',
      details: error.message,
      instruction: 'Please ensure the Fabric network is running: cd fabric-network/scripts && ./network.sh up'
    });
  }
});

// Helper function to build provenance tree structure
function buildProvenanceTree(events) {
  const eventMap = new Map(events.map(event => [event.eventId, event]));
  const roots = [];
  const children = new Map();

  // Initialize children map
  events.forEach(event => {
    children.set(event.eventId, []);
  });

  // Build parent-child relationships
  events.forEach(event => {
    if (event.parentEventId && event.parentEventId !== '') {
      if (children.has(event.parentEventId)) {
        children.get(event.parentEventId).push(event.eventId);
      }
    } else {
      roots.push(event.eventId);
    }
  });

  // Build tree structure
  function buildNode(eventId) {
    const event = eventMap.get(eventId);
    const childNodes = children.get(eventId).map(childId => buildNode(childId));
    
    return {
      ...event,
      children: childNodes
    };
  }

  return roots.map(rootId => buildNode(rootId));
}

// Helper function to find path from root to target event
function findEventPath(events, targetEventId) {
  const eventMap = new Map(events.map(event => [event.eventId, event]));
  const path = [];
  
  let currentEventId = targetEventId;
  
  while (currentEventId) {
    const event = eventMap.get(currentEventId);
    if (!event) break;
    
    path.unshift(event);
    currentEventId = event.parentEventId && event.parentEventId !== '' ? 
                    event.parentEventId : null;
  }
  
  return path;
}

// Helper function to get event type name
function getEventTypeName(eventType) {
  const types = {
    'COLLECTION': 'Collection',
    'QUALITY_TEST': 'Quality Test',
    'PROCESSING': 'Processing',
    'MANUFACTURING': 'Manufacturing'
  };
  return types[eventType] || 'Unknown';
}

// Helper function to calculate branch statistics
function calculateBranches(events) {
  const parentCount = {};
  
  events.forEach(event => {
    if (event.parentEventId && event.parentEventId !== '') {
      parentCount[event.parentEventId] = (parentCount[event.parentEventId] || 0) + 1;
    }
  });

  return {
    totalBranches: Object.keys(parentCount).length,
    maxBranchingFactor: Math.max(...Object.values(parentCount), 0),
    branchingPoints: parentCount
  };
}

module.exports = router;