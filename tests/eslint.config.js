const cds = require("@sap/eslint-plugin-cds");

module.exports = [
  { ignores: ["coverage/**"] },
  cds.configs.recommended,
];
