/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  testMatch: ['**/*test.[jt]s'],
  expand: true,
  silent: false,
  preset: 'ts-jest',
  testEnvironment: 'node',
  esModuleInterop: true,
}

module.exports = config
// export default config
