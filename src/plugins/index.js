/**
 * 插件系统导出
 */

const PluginBase = require('./plugin-base');
const PluginRegistry = require('./plugin-registry');
const PluginScanner = require('./plugin-scanner');

module.exports = {
  PluginBase,
  PluginRegistry,
  PluginScanner
};