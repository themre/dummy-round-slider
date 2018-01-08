module.exports = {
  type: 'web-module',
  npm: {
    esModules: true,
    umd: {
      global: 'RoundSlider',
      externals: {}
    }
  },
  webpack: {
    html: {
      template: 'src/index.html'
    }
  }
}
