
/**
 *  Available annotation examples.
 *  @FCSettings.liveValidations: true
 *  @FCSettings.autoErase: true
 *  @FCSettings.path: 'srv/@FCDefinitions/InternalUsersForm.js'
 * @FCSettings: {
 *      useImpl.BeneficiaryAddress: 'Addresses',
 *      useImpl.DeliveryAddress: 'Addresses',
 *   }
 * or
 * @FCSettings: {
 *  useImpl: {
 *    BeneficiaryAddress: 'Addresses',
 *    DeliveryAddress: 'Addresses',
 *  }
 * }
 */

/**
 * Cds configs:
 *
 * "cds": {
 *  "enable:capdomain:plugin": true,
 *  "enable:capdomain:liveValidations": false,
 *  "enable:capdomain:autoErase": false,
 *  "enable:capdomain:defaultFCValue": 3,
 *  "enable:capdomain:blockUnannotatedValueChanges": true,
 * }
 */

/**
 * Merge logic of configurations should work in the following way
 * Object.assing({}, defaultLibValues, cdsConfiguration, annotationConfiguration, codeCallConfigurations)
 */

const FCSettings = {
  autoErase: cds.env['enable:capdomain:autoErase'] ?? true,
  liveValidations: cds.env['enable:capdomain:liveValidations'] ?? true,
  blockUnannotatedValueChanges: cds.env['enable:capdomain:blockUnannotatedValueChanges'] ?? true,
  useImpl: {}
};

module.exports = FCSettings;
