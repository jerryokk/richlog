const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

// 自动发现插件类型
function discoverPlugins() {
  const pluginsDir = path.resolve(__dirname, 'src/plugins');
  const discoveredPlugins = [];
  
  try {
    const items = fs.readdirSync(pluginsDir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const pluginType = item.name;
        const pluginJsonPath = path.join(pluginsDir, pluginType, 'plugin.json');
        
        // 检查是否存在 plugin.json 文件
        if (fs.existsSync(pluginJsonPath)) {
          // 验证插件类型名称
          if (/^[a-zA-Z0-9_-]+$/.test(pluginType)) {
            discoveredPlugins.push(pluginType);
            console.log(`发现插件: ${pluginType}`);
          } else {
            console.warn(`跳过无效插件类型: ${pluginType}`);
          }
        }
      }
    }
    
    console.log('发现了插件类型:', discoveredPlugins);
    return discoveredPlugins;
    
  } catch (error) {
    console.error('插件发现过程中出错:', error);
    console.log('使用默认插件类型');
    return ['config', 'image', 'command'];
  }
}

// 获取可用插件类型
const availablePlugins = discoverPlugins();

// 为每个插件创建入口点
const pluginEntries = {};
availablePlugins.forEach(type => {
  pluginEntries[`${type}Plugin`] = `./src/plugins/${type}/script.js`;
});

module.exports = {
  entry: {
    main: './src/web/index.js',
    ...pluginEntries
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "vm": require.resolve("vm-browserify")
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      'window.RICHLOG_PLUGIN_TYPES': JSON.stringify(availablePlugins)
    }),
    new CopyWebpackPlugin({
      patterns: availablePlugins.map(type => ({
        from: `./src/plugins/${type}/plugin.json`,
        to: `plugins/${type}/plugin.json`
      })),
    }),
    new HtmlWebpackPlugin({
      template: './src/web/index.html',
      filename: 'index.html',
      chunks: ['main']
    }),
    ...availablePlugins.map(type => {
      return new HtmlWebpackPlugin({
        template: `./src/plugins/${type}/index.html`,
        filename: `plugins/${type}/index.html`,
        chunks: [`${type}Plugin`]
      });
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    hot: true
  }
};