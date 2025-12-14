const path = require('path');

module.exports = {
  project: {
    android: {
      sourceDir: path.join(__dirname, 'android'),
      appName: 'app',
      packageName: 'com.nossoapp.oracoes',
    },
  },
};

