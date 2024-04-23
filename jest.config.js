module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['ts','js'],
  testEnvironment: 'node',
  testMatch: ['**/tests/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(flat))"
  ]
}