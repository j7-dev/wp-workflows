module.exports = {
  default: {
    requireModule: ['tsx'],
    require: [
      '${NODE_SUPPORT_DIR}/**/*.ts',
      '${NODE_STEPS_DIR}/**/*.ts',
    ],
    paths: ['${NODE_TEST_FEATURES_DIR}/**/*.feature'],
    format: ['progress-bar', 'html:reports/cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' },
  },
};
