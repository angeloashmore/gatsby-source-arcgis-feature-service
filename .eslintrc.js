module.exports = {
  rules: {
    'no-var': 'warn',
    'no-unused-vars': 'warn',
    'no-undef': 'error',
  },
  env: {
    node: true,
    es6: true,
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 8, // optional, recommended 6+
  },
}
