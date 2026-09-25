const Utils = require('./Utils');
const { getOnBeforeCalculateFC, getOnBeforeSave, getOnAfterSave, setOnBeforeSave, setOnBeforeCalculateFC, setOnAfterSave, getSrvEntitiesFCs } = require('./SymbolHelper');

/**
 * https://sap.github.io/odata-vocabularies/vocabularies/Common.html#FieldControlType
 * Field control value constants
 * These values determine the visibility and editability of fields
 */
const fieldControlDictionary = {

  // Visible, Editable, Required
  Mandatory: 7,

  // Visible, Editable, Not Required
  Optional: 3,

  // Visible, Not Editable
  ReadOnly: 1,

  // Not Visible
  Hidden: 0
};

const defaultEnvFC = Number(cds.env['enable:capdomain:defaultFCValue'] ?? fieldControlDictionary.Optional);

/**
 * Calculate field control for a specific field.
 * @param {Function} calculator Function to calculate field control value.
 * @param {object} entity The entity data.
 * @param {object} helperContext Context object for calculation.
 * @returns {number|boolean} Field Control calculated value
 */
function calculateFieldControl(calculator, entity, helperContext) {
  if (!calculator) {
    return fieldControlDictionary.ReadOnly;
  }

  return calculator(entity, helperContext);
}

/**
 * Get field control values from data and CSN definition
 * @param {object} data The data object
 * @param {object} csnEntityDefinition The CSN entity definition
 * @param {object} i18n The i18n bundle
 * @returns {object} Field Control values
 */
function getFieldControlValues(data, csnEntityDefinition, i18n) {
  return Object.entries(csnEntityDefinition.elements).reduce(
    (acc, [ key, cdsDefinition ]) => {
      const fieldControlAnnotation = cdsDefinition['@Common.FieldControl'];
      const label = cdsDefinition['@Common.Label'];

      if (fieldControlAnnotation) {
        const isMandatory = cdsDefinition['@mandatory'];
        const fieldControlValuePath = fieldControlAnnotation['='];
        const fcValue =
          data[fieldControlValuePath] ??
          ((isMandatory && fieldControlDictionary.Mandatory) ||
          defaultEnvFC);

        acc[key] = {
          fcShortPath: fieldControlValuePath?.replace('_fc', ''),
          label: label ? i18n.getText(label.replace('{i18n>', '').replace('}', '')) : '',
          fcValue
        };
      }

      return acc;
    },
    {}
  );
}

/**
 * Get mapping of entity field control annotations.
 * @param {object} entityDefinitionElements The entity definition elements.
 * @returns {object} Fields mapping
 */
function getEntityFCAnnotationsMapping(entityDefinitionElements) {
  const { elements } = entityDefinitionElements;
  const settings = Object.entries(elements).reduce((acc, [ fieldName, element ]) => {
    const elementFC = element['@Common.FieldControl'];
    const { '=': fieldControlBindingPath } = elementFC || {};

    if (fieldControlBindingPath) {
      acc[fieldName] = { fieldName, FCPath: fieldControlBindingPath };
    }

    return acc;
  }, {});

  return settings;
}

/**
 * FieldControls class to handle the logic for field control values
 * based on different conditions in the request or entity data
 */
class FieldControls {
  /**
   * @param {object} srv - SRV Definition
   * @param {object} csnEntity - CSN Entity Definition
   * @param {object} configurationEntity - Field Control configurations
   * @param {object} configuration - Entity Configuration
   */
  constructor(srv, csnEntity, configurationEntity, configuration) {
    this.configuration = configuration;
    this.srv = srv;
    this.csnEntity = csnEntity;
    this.configurationEntity = configurationEntity;
  }

  /**
   * Call the onBeforeCalculateFC hook if defined.
   * @param {object} updatedEntry The updated entity.
   * @param {object} helperObject The helper context object.
   * @returns {Promise<*>} Request
   */
  async callOnBeforeCalculateFC(updatedEntry, helperObject) {
    const onBeforeCalculateFC = getOnBeforeCalculateFC(this.configurationEntity);

    if (onBeforeCalculateFC) {
      return onBeforeCalculateFC(updatedEntry, helperObject);
    }
  }

  /**
   * Call the onBeforeSave hook if defined.
   * @param {object} updatedEntry The updated entity.
   * @param {object} req The CDS request object.
   * @returns {Promise<void>} Request
   */
  async callOnBeforeSave(updatedEntry, req) {
    const onBeforeSave = getOnBeforeSave(this.configurationEntity);

    if (onBeforeSave) {
      return await onBeforeSave(updatedEntry, this.buildHelperObject(req));
    }
  }

  /**
   * Call the onAfterSave hook if defined.
   * @param {object} updatedEntry The updated entity.
   * @param {object} req The CDS request object.
   * @returns {Promise<void>} Request
   */
  async callOnAfterSave(updatedEntry, req) {
    const onAfterSave = getOnAfterSave(this.configurationEntity);

    if (onAfterSave) {
      return await onAfterSave(updatedEntry, this.buildHelperObject(req));
    }
  }

  /**
   * Build a helper context object for hooks.
   * @param {object} req The CDS request object.
   * @param {object} [context] Additional context.
   * @returns {object} Helper object
   */
  buildHelperObject(req, context = {}) {
    return Object.assign({}, { srv: this.srv, req, context: Object.assign({ req }, context.context) });
  }

  /**
   * Erase unavailable or unannotated fields from update data.
   * @param {object} updatedEntry The updated entity.
   * @param {object} updateData The update data object.
   * @param {object} configuration The configuration object.
   * @param {object} fieldControlAnnotationValues The annotations configuration object.
   */
  eraseUnavailableDynamicFields(updatedEntry, updateData, configuration, fieldControlAnnotationValues) {
    const { autoErase, blockUnannotatedValueChanges } = configuration;

    const entityFCsSettings = getEntityFCAnnotationsMapping(this.csnEntity);

    blockUnannotatedValueChanges && Object.entries(updateData).forEach(([ fieldName ]) => {
      const fieldDefinition = this.csnEntity.elements[fieldName];
      const fcFieldName = entityFCsSettings?.[fieldName]?.FCPath;

      if (!fieldDefinition || fieldDefinition.key) {
        return;
      }

      if (!fcFieldName || !updatedEntry.hasOwnProperty(fcFieldName)) {
        delete updateData[fieldName];
      }
    });

    autoErase && Object.entries(this.configurationEntity).forEach(([ fieldName ]) => {
      const fieldDefinition = this.csnEntity.elements[fieldName];

      if (fieldDefinition) {
        const fcValue = fieldControlAnnotationValues[fieldName].fcValue;
        const finalFieldName =
          fieldDefinition.type === 'cds.Association'
            ? fieldDefinition.$generatedForeignKeys.at(0).name
            : fieldName;

        if (autoErase && fcValue <= fieldControlDictionary.ReadOnly) {
          updateData[finalFieldName] = null;
        }
      }
    });
  }

  /**
   * Validate payload against field control configurations.
   * @param {object} data The data to validate.
   * @param {object} dataUpdate The data update to validate against.
   * @param {object} [rawUpdate] The original, unmerged update payload as submitted by the caller.
   *   Used to detect whether a field was actually part of the change, since `dataUpdate` may be
   *   backfilled with mock defaults for live validation. Defaults to `dataUpdate`.
   * @param {object} [previousData] The persisted state prior to this change, used to detect whether
   *   a read-only/hidden field's value actually changed. Defaults to `data`.
   * @returns {object} Validation results containing any errors.
   */
  async validatePayload(data, dataUpdate, rawUpdate = dataUpdate, previousData = data) {
    const i18n = Utils.getBoundI18nBundle();
    const fieldControlAnnotationValues = getFieldControlValues(data, this.csnEntity, i18n);

    const validationPromises = Object.entries(dataUpdate).map(
      async ([ key, entityValue ]) => {
        const { fcValue, label, fcShortPath } = fieldControlAnnotationValues[key] || {};
        const { validator } = this.configurationEntity[fcShortPath] || {};
        const fieldErrors = [];

        if (validator && fcValue >= fieldControlDictionary.Optional) {
          const validationMessage = await validator.call(this.srv, entityValue, {
            i18n,
            entity: data,
            fieldName: key
          });

          if (validationMessage) {
            fieldErrors.push({
              fieldName: key,
              message: validationMessage
            });
          }
        }

        if (fcValue <= fieldControlDictionary.ReadOnly && rawUpdate.hasOwnProperty(key) && previousData[key] !== entityValue) {
          fieldErrors.push({
            fieldName: key,
            message: i18n.getText('capdomain.validation.message.readOnly', [ label ])
          });
        }

        if ((entityValue === null || entityValue === '') && fcValue === fieldControlDictionary.Mandatory) {
          fieldErrors.push({
            fieldName: key,
            message: i18n.getText('capdomain.validation.message.required', [ label ])
          });
        }

        return fieldErrors;
      }
    );

    const allResults = await Promise.all(validationPromises);

    const errors = allResults.flat();

    return { errors, fieldControlAnnotationValues };
  }

  /**
   * Calculate field controls for associated entities.
   * @param {object} entity The main entity.
   * @param {object} req The CDS request object.
   * @param {object} context The context object.
   * @returns {Promise<Array>} Requests
   */
  async calculateAssociatedEntitiesFC(entity, req, context) {
    const requests = Object.entries(this.configuration.useImpl).map(async ([ associationName, targetSrvEntity ]) => {
      const record = entity[associationName];

      if (!record) {
        return;
      }

      const fc = getSrvEntitiesFCs(this.srv)[targetSrvEntity];

      return await fc.calculateFieldControls(record, req, context);
    });

    return await Promise.all(requests);
  }

  /**
   * Calculate field controls for an Entity or array of Entities.
   * @param {object | Array} entities Single entity or array of entities.
   * @param {object | Array} req Request
   * @param {object} context Context object.
   * @returns {object | Array} Entity/Entities with field controls.
   */
  async calculateFieldControls(entities, req, context = {}) {
    if (!entities) {
      return entities;
    }

    const entitiesArray = Array.isArray(entities)
      ? entities
      : [ entities ];

    const processEntitiesRequests = entitiesArray.map(async (entity) => {
      const helperObject = this.buildHelperObject(req, context);

      await this.calculateAssociatedEntitiesFC(entity, req, context);

      await this.callOnBeforeCalculateFC(entity, helperObject);

      const entityFCsSettings = getEntityFCAnnotationsMapping(this.csnEntity);
      const fieldControls = Object.values(entityFCsSettings).reduce(
        (fcAcc, { FCPath }) => {
          if (fcAcc.hasOwnProperty(FCPath)) {
            return fcAcc;
          }

          const fcValue = calculateFieldControl(this.configurationEntity[FCPath.replace('_fc', '')]?.fc, entity, helperObject);

          if (fcValue !== null) {
            fcAcc[FCPath] = fcValue;
          }

          return fcAcc;
        },
        {}
      );

      Object.assign(entity, fieldControls);

      return entity;
    });

    const processedEntities = await Promise.all(processEntitiesRequests);

    return Array.isArray(entities)
      ? processedEntities
      : processedEntities[0];
  }
}

module.exports = {
  FieldControls,
  fieldControlDictionary,
  handlers: {
    setOnBeforeSave,
    setOnBeforeCalculateFC,

    getOnAfterSave,
    setOnAfterSave
  }
};
