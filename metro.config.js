// Carregar polyfill primeiro
require('./metro-polyfill');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;

