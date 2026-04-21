// babel.config.mjs
export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
        modules: 'auto'
      }
    ]
  ]
};