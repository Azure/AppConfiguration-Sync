module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['ts','js'],
  testEnvironment: 'node',
  testMatch: ['**/tests/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
}