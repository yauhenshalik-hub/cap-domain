
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
 *  "enable:capfc:plugin": true,
 *  "enable:capfc:liveValidations": false,
 *  "enable:capfc:autoErase": false,
 *  "enable:capfc:defaultFCValue": 3,
 *  "enable:capfc:blockUnannotatedValueChanges": true,
 * }
 */

/**
 * Merge logic of configurations should work in the following way
 * Object.assing({}, defaultLibValues, cdsConfiguration, annotationConfiguration, codeCallConfigurations)
 */

const FCSettings = {
  autoErase: cds.env['enable:capfc:autoErase'] ?? true,
  liveValidations: cds.env['enable:capfc:liveValidations'] ?? true,
  blockUnannotatedValueChanges: cds.env['enable:capfc:blockUnannotatedValueChanges'] ?? true,
  useImpl: {}
};

module.exports = FCSettings;
