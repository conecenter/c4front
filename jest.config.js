module.exports = {
	testEnvironment: "jsdom",
	transform: {
		'^.+\\.jsx?$': ['@swc/jest', {
			"jsc": { "parser": { "jsx": true } }
		}],
		'^.+\\.tsx?$': ['@swc/jest', {
			"jsc": { "parser": { "syntax": "typescript", "tsx": true } }
		}]
	},
	moduleNameMapper: {
		'\\.svg$': '<rootDir>/src/test/config/svg-mock.js'
	},
	setupFilesAfterEnv: ["<rootDir>/src/test/config/setup-jest.ts"],
	extensionsToTreatAsEsm: [".ts", ".tsx"],
	clearMocks: true,
	testEnvironmentOptions: {
		customExportConditions: ['require', 'default'],
	},
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{js,jsx,ts,tsx}',
		'!<rootDir>/src/test/**',
		'!<rootDir>/src/**/*.d.ts',
	]
}