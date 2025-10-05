#!/usr/bin/env node

/**
 * PM2 Management Script for Chat Application
 * Provides utilities for managing PM2 processes with Redis clustering support
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PM2Manager {
  constructor() {
    this.ecosystemFile = path.join(__dirname, '../ecosystem.config.js');
    this.logDir = path.join(__dirname, '../logs');
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
      console.log('✅ Created logs directory');
    }
  }

  /**
   * Start the application in cluster mode
   */
  start() {
    console.log('🚀 Starting Chat Application in cluster mode...');
    this.ensureLogsDirectory();
    
    try {
      execSync(`pm2 start "${this.ecosystemFile}"`, { stdio: 'inherit' });
      console.log('✅ Application started successfully');
      this.showStatus();
    } catch (error) {
      console.error('❌ Failed to start application:', error.message);
      process.exit(1);
    }
  }

  /**
   * Stop the application
   */
  stop() {
    console.log('🛑 Stopping Chat Application...');
    
    try {
      execSync('pm2 stop chat-app-backend', { stdio: 'inherit' });
      console.log('✅ Application stopped successfully');
    } catch (error) {
      console.error('❌ Failed to stop application:', error.message);
    }
  }

  /**
   * Restart the application
   */
  restart() {
    console.log('🔄 Restarting Chat Application...');
    
    try {
      execSync(`pm2 restart "${this.ecosystemFile}"`, { stdio: 'inherit' });
      console.log('✅ Application restarted successfully');
      this.showStatus();
    } catch (error) {
      console.error('❌ Failed to restart application:', error.message);
    }
  }

  /**
   * Reload the application (zero-downtime restart)
   */
  reload() {
    console.log('🔄 Reloading Chat Application (zero-downtime)...');
    
    try {
      execSync('pm2 reload chat-app-backend', { stdio: 'inherit' });
      console.log('✅ Application reloaded successfully');
      this.showStatus();
    } catch (error) {
      console.error('❌ Failed to reload application:', error.message);
    }
  }

  /**
   * Delete the application from PM2
   */
  delete() {
    console.log('🗑️ Deleting Chat Application from PM2...');
    
    try {
      execSync('pm2 delete chat-app-backend', { stdio: 'inherit' });
      console.log('✅ Application deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete application:', error.message);
    }
  }

  /**
   * Show application status
   */
  showStatus() {
    console.log('\n📊 Application Status:');
    try {
      execSync('pm2 status', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
    }
  }

  /**
   * Show application logs
   */
  showLogs(lines = 50) {
    console.log(`\n📋 Application Logs (last ${lines} lines):`);
    try {
      execSync(`pm2 logs chat-app-backend --lines ${lines}`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to get logs:', error.message);
    }
  }

  /**
   * Monitor application in real-time
   */
  monitor() {
    console.log('📊 Starting PM2 Monitor...');
    try {
      execSync('pm2 monit', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to start monitor:', error.message);
    }
  }

  /**
   * Save PM2 configuration
   */
  save() {
    console.log('💾 Saving PM2 configuration...');
    try {
      execSync('pm2 save', { stdio: 'inherit' });
      console.log('✅ PM2 configuration saved');
    } catch (error) {
      console.error('❌ Failed to save configuration:', error.message);
    }
  }

  /**
   * Setup PM2 startup script
   */
  setupStartup() {
    console.log('🔧 Setting up PM2 startup script...');
    try {
      execSync('pm2 startup', { stdio: 'inherit' });
      console.log('✅ PM2 startup script configured');
      console.log('💡 Run the command shown above to enable auto-startup');
    } catch (error) {
      console.error('❌ Failed to setup startup:', error.message);
    }
  }

  /**
   * Check Redis connection
   */
  checkRedis() {
    console.log('🔍 Checking Redis connection...');
    try {
      const redisTestScript = path.join(__dirname, 'setup-redis.js');
      execSync(`node "${redisTestScript}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Redis connection check failed:', error.message);
    }
  }

  /**
   * Show cluster information
   */
  showClusterInfo() {
    console.log('\n🏗️ Cluster Information:');
    try {
      execSync('pm2 show chat-app-backend', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to get cluster info:', error.message);
    }
  }

  /**
   * Scale the application
   */
  scale(instances) {
    console.log(`📈 Scaling application to ${instances} instances...`);
    try {
      execSync(`pm2 scale chat-app-backend ${instances}`, { stdio: 'inherit' });
      console.log(`✅ Application scaled to ${instances} instances`);
      this.showStatus();
    } catch (error) {
      console.error('❌ Failed to scale application:', error.message);
    }
  }

  /**
   * Reset application (delete and start fresh)
   */
  reset() {
    console.log('🔄 Resetting application...');
    this.delete();
    this.start();
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🚀 PM2 Management Script for Chat Application

Usage: node scripts/pm2-management.js <command>

Commands:
  start       Start the application in cluster mode
  stop        Stop the application
  restart     Restart the application
  reload      Reload the application (zero-downtime)
  delete      Delete the application from PM2
  status      Show application status
  logs        Show application logs
  monitor     Start PM2 monitor
  save        Save PM2 configuration
  startup     Setup PM2 startup script
  redis       Check Redis connection
  info        Show cluster information
  scale <n>   Scale to n instances
  reset       Reset application (delete and start fresh)
  help        Show this help message

Examples:
  node scripts/pm2-management.js start
  node scripts/pm2-management.js scale 4
  node scripts/pm2-management.js logs 100
  node scripts/pm2-management.js monitor
    `);
  }
}

// Main execution
const manager = new PM2Manager();
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'start':
    manager.start();
    break;
  case 'stop':
    manager.stop();
    break;
  case 'restart':
    manager.restart();
    break;
  case 'reload':
    manager.reload();
    break;
  case 'delete':
    manager.delete();
    break;
  case 'status':
    manager.showStatus();
    break;
  case 'logs':
    manager.showLogs(parseInt(arg) || 50);
    break;
  case 'monitor':
    manager.monitor();
    break;
  case 'save':
    manager.save();
    break;
  case 'startup':
    manager.setupStartup();
    break;
  case 'redis':
    manager.checkRedis();
    break;
  case 'info':
    manager.showClusterInfo();
    break;
  case 'scale':
    if (!arg) {
      console.error('❌ Please specify number of instances');
      process.exit(1);
    }
    manager.scale(parseInt(arg));
    break;
  case 'reset':
    manager.reset();
    break;
  case 'help':
  case '--help':
  case '-h':
    manager.showHelp();
    break;
  default:
    console.error('❌ Unknown command. Use "help" to see available commands.');
    manager.showHelp();
    process.exit(1);
}
