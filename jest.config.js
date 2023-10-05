module.exports = {
	testEnvironment: "jsdom",
	transform: {
		"^.+\\.tsx?$": "ts-jest"
	},
	setupFilesAfterEnv: [
		'<rootDir>/src/test/config/setup-jest.ts'
	]
}