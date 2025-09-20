import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Package, TrendingUp, Activity, MessageSquare, Database, Wifi } from 'lucide-react';
import mockBlockchainService from '../../services/mockBlockchainService';
import mockSMSService from '../../services/mockSMSService';
import mockIPFSService from '../../services/mockIPFSService';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const batches = await mockBlockchainService.getAllBatches();
      const auditTrail = mockBlockchainService.getAuditTrail();
      const smsStats = mockSMSService.getNotificationStats();
      const ipfsStats = mockIPFSService.getStorageStats();

      // Calculate statistics
      const eventsByType = auditTrail.reduce((acc: any, event: any) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {});

      const participantCount = new Set(auditTrail.map((event: any) => event.participant)).size;
      const activeBatches = batches.filter((batch: any) => {
        const daysSinceCreation = (Date.now() - new Date(batch.creationTime).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation <= 7; // Active in last 7 days
      }).length;

      setStats({
        overview: {
          totalBatches: batches.length,
          totalEvents: auditTrail.length,
          totalParticipants: participantCount,
          activeBatches
        },
        events: eventsByType,
        sms: smsStats,
        ipfs: ipfsStats,
        recentActivity: batches
          .sort((a: any, b: any) => new Date(b.creationTime).getTime() - new Date(a.creationTime).getTime())
          .slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all demo data? This will clear all batches, events, and notifications.')) {
      mockBlockchainService.clearAllData();
      localStorage.removeItem('herbionyx_sms_notifications');
      localStorage.removeItem('herbionyx_ipfs_storage');
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-800">Simulation Dashboard</h2>
            <p className="text-green-600">Real-time prototype analytics and system monitoring</p>
          </div>
        </div>
        <button
          onClick={handleResetData}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Reset Demo Data
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Batches</p>
              <p className="text-3xl font-bold text-green-800">{stats?.overview?.totalBatches || 0}</p>
            </div>
            <Package className="h-12 w-12 text-green-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
            <span className="text-emerald-600">{stats?.overview?.activeBatches || 0} active this week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Blockchain Events</p>
              <p className="text-3xl font-bold text-blue-800">{stats?.overview?.totalEvents || 0}</p>
            </div>
            <Activity className="h-12 w-12 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-600">Simulated Fabric transactions</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">SMS Notifications</p>
              <p className="text-3xl font-bold text-purple-800">{stats?.sms?.total || 0}</p>
            </div>
            <MessageSquare className="h-12 w-12 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600">{stats?.sms?.successRate || 0}% delivery rate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">IPFS Storage</p>
              <p className="text-3xl font-bold text-orange-800">{stats?.ipfs?.totalFiles || 0}</p>
            </div>
            <Database className="h-12 w-12 text-orange-500" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-orange-600">{stats?.ipfs?.storageUsed || '0 MB'} used</span>
          </div>
        </div>
      </div>

      {/* Event Types and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Events by Type</h3>
          <div className="space-y-4">
            {stats?.events && Object.entries(stats.events).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    type === 'COLLECTION' ? 'bg-green-500' :
                    type === 'QUALITY_TEST' ? 'bg-blue-500' :
                    type === 'PROCESSING' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Hyperledger Fabric</span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                SIMULATED
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">IPFS Storage</span>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                LOCAL STORAGE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">SMS Gateway</span>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                SIMULATED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {stats?.recentActivity?.map((batch: any, index: number) => (
            <div key={batch.batchId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{batch.herbSpecies}</p>
                <p className="text-sm text-gray-600 font-mono">{batch.batchId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{batch.eventCount} events</p>
                <p className="text-xs text-gray-500">
                  {new Date(batch.creationTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;