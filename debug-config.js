#!/usr/bin/env node
/**
 * Debug script to test Docker environment configuration
 */

const envVars = [
  'NODE_ENV',
  'PORT',
  'humid.server.host',
  'humid.server.port',
  'humid.server.prefix',
  'humid.app.version',
  'humid.server.doc-prefix',
  'db.host',
  'db.port',
  'db.username',
  'db.password',
  'db.database',
  'db.ssl',
  'file.img-location',
  'redis.host',
  'redis.port'
];

console.log('🔍 Environment Variables Debug:');
console.log('================================');

envVars.forEach(key => {
  const value = process.env[key];
  if (value !== undefined) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
});

console.log('\n🌐 All Environment Variables:');
console.log('=============================');
Object.keys(process.env)
  .filter(key => key.includes('humid') || key.includes('db.') || key.includes('NODE_ENV') || key.includes('PORT'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });
