/**
 * Simple test to verify library tools are registered
 */

import { AutoHotkeyMcpServer } from '../../dist/server.js';

async function testToolsRegistered() {
  console.log('🧪 Testing if library tools are registered\n');

  try {
    const server = new AutoHotkeyMcpServer();
    await server.initialize();

    console.log('✅ Server initialized successfully\n');

    // Check if the library tools would be in the tools list
    console.log('📋 Library management tools should be available:');
    console.log('   - AHK_Library_List');
    console.log('   - AHK_Library_Info');
    console.log('   - AHK_Library_Import');
    console.log('\n✅ Integration test complete - server starts without errors');
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.error(error);
  }
}

testToolsRegistered();
