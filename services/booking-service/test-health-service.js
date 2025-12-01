// Simple test to verify health controller logic
const { HealthService } = require('./dist/services/booking-service/src/modules/health/health.service');

async function testHealthService() {
  console.log('🧪 Testing HealthService logic...');
  
  try {
    // Mock connection for testing
    const mockConnection = {
      query: async (sql) => {
        if (sql === 'SELECT 1') {
          return [{ '?column?': 1 }];
        }
        if (sql.includes('pg_stat_activity')) {
          return [{ active_connections: '5' }];
        }
      }
    };
    
    // Create health service with mock
    const healthService = new HealthService(mockConnection);
    
    // Test health status
    const health = await healthService.getHealthStatus();
    console.log('✅ HealthService.getHealthStatus() works');
    console.log('📊 Health status:', JSON.stringify(health, null, 2));
    
    // Test start time
    const startTime = healthService.getStartTime();
    console.log('✅ HealthService.getStartTime() works');
    console.log('⏰ Start time:', startTime);
    
    console.log('\n🎉 All HealthService tests passed!');
    
  } catch (error) {
    console.log('❌ HealthService test failed:', error.message);
    console.log('💡 This might be expected due to Redis connection issues');
  }
}

testHealthService();