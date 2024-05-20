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
	setupFilesAfterEnv: ["<rootDir>/src/test/config/setup-jest.ts"],
	extensionsToTreatAsEsm: [".ts", ".tsx"]
}