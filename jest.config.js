module.exports = {
  roots: ["<rootDir>"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/src/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  setupFiles: ["./jest.setup.js"],
  // setupFilesAfterEnv: ['./jest.setup.js'],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
