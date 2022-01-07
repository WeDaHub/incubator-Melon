module.exports = {
  extends: [
    '@tencent/eslint-config-tencent',
  ],
  globals: {
    wx: true,
    App: true,
    Page: true,
  },
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
};
