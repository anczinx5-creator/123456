import QRCode from 'qrcode';

class QRService {
  private baseUrl = window.location.origin;

  async generateQR(data: any, title: string): Promise<{ success: boolean; dataURL?: string; trackingUrl?: string; qrHash?: string; error?: string }> {
    try {
      // Create a real tracking URL with the event ID
      const trackingUrl = `${this.baseUrl}/track/${data.eventId}`;
      
      // Create QR data with real tracking information
      const qrData = {
        url: trackingUrl,
        batchId: data.batchId,
        eventId: data.eventId,
        type: data.type,
        timestamp: Date.now(),
        version: '1.0',
        network: 'hyperledger-fabric'
      };

      // Use the tracking URL as QR content for real scanning
      const qrString = trackingUrl;
      const qrHash = await this.generateHash(JSON.stringify(qrData));
      
      // Generate real QR code that can be scanned by any QR scanner
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#2D5A27',
          light: '#FFFFFF'
        },
        width: 400,
        scale: 8
      });

      console.log(`✅ Real QR code generated for ${data.type}: ${trackingUrl}`);

      return {
        success: true,
        dataURL: qrCodeDataURL,
        trackingUrl,
        qrHash
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async generateCollectionQR(batchId: string, eventId: string, herbSpecies: string, collectorName: string) {
    const data = {
      type: 'collection',
      batchId,
      eventId,
      herbSpecies,
      collector: collectorName
    };

    return await this.generateQR(data, `Collection-${batchId}`);
  }

  async generateQualityTestQR(batchId: string, eventId: string, testerName: string) {
    const data = {
      type: 'quality_test',
      batchId,
      eventId,
      tester: testerName
    };

    return await this.generateQR(data, `QualityTest-${eventId}`);
  }

  async generateProcessingQR(batchId: string, eventId: string, processorName: string, method: string) {
    const data = {
      type: 'processing',
      batchId,
      eventId,
      processor: processorName,
      method
    };

    return await this.generateQR(data, `Processing-${eventId}`);
  }

  async generateManufacturingQR(batchId: string, eventId: string, manufacturerName: string, productName: string) {
    const data = {
      type: 'manufacturing',
      batchId,
      eventId,
      manufacturer: manufacturerName,
      productName
    };

    return await this.generateQR(data, `Manufacturing-${eventId}`);
  }

  parseQRData(qrString: string) {
    try {
      let qrData;
      
      // Check if it's a tracking URL
      if (qrString.includes('/track/')) {
        const eventId = qrString.split('/track/')[1];
        qrData = {
          eventId: eventId,
          type: 'tracking_url',
          trackingUrl: qrString
        };
      } else {
        // Try to parse as JSON
        try {
          qrData = JSON.parse(qrString);
        } catch {
          // If not JSON, treat as direct event ID
          qrData = {
            eventId: qrString.trim(),
            type: 'direct_id'
          };
        }
      }
      
      if (!qrData.eventId) {
        throw new Error('Invalid QR code format - missing event ID');
      }

      return {
        success: true,
        data: qrData
      };
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Generate QR for physical printing with batch info
  async generatePrintableQR(batchId: string, eventId: string, additionalInfo: any) {
    const trackingUrl = `${this.baseUrl}/track/${eventId}`;
    
    return await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 1.0,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 600,
      scale: 10
    });
  }
}

export const qrService = new QRService();
export default qrService;