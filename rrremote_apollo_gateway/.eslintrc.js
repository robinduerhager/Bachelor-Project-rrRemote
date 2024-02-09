module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ['prettier', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        semi: false,
        singleQuote: true
      }
    ]
  }
}