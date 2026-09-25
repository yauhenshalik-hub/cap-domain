const { getEntityName, createMockEntity } = require('./Utils.js');
const { getEntityFC } = require('./SymbolHelper');

/**
 * Bind field control handlers to a field control entity instance.
 * @param {object} fc The field control instance.
 * @returns {object} Object with bound handlers
 */
function bindHandlers(fc) {
  /**
   * Provides structured errors to the request based on a given prefix.
   * @param {object} req The CDS request object.
   * @param {Array<object>} errors An array of error objects, each with at least `fieldName` and `message` properties.
   * @param {object} csnEntity The CSN entity definition.
   * @param {string} [targetPrefix] Optional prefix for the error target. If not provided, it will be calculated.
   */
  function provideErrors(req, errors, csnEntity, targetPrefix) {
    if (!errors || !errors.length) {
      return;
    }

    /**
     * Builds a property string from an object of descriptors.
     * @param {object} descriptors An object where keys are property names and values are objects with a `value` property.
     * @returns {string} A comma-separated string of key=value pairs.
     */
    function buildPropertyString(descriptors) {
      /**
       * @param {string} key Entity field
       */
      function isStringType(key) {
        return csnEntity.elements[key].type === 'cds.String';
      }

      const keys = Object.entries(descriptors);

      if (keys.length === 1) {
        return keys.map(([, desc]) => desc.value).at(0);
      }

      return keys.map(([key, desc]) => isStringType(key) ? `${key}='${desc.value}'` : `${key}=${desc.value}`)
        .join(',');
    }

    /**
     * Calculates the prefix for error targets based on request parameters and entity name.
     * @returns {string} The calculated prefix.
     */
    function calculatePrefix() {
      const params = buildPropertyString(Object.getOwnPropertyDescriptors(req.params[0]));

      const entityName = getEntityName(csnEntity);

      return `/${entityName}(${params})`;
    }

    const prefix = targetPrefix || calculatePrefix();

    errors.forEach(({ fieldName, message }) => {
      req.error({
        target: `${prefix}/${fieldName}`,
        message,
        description: message,
        code: 400
      });
    });
  }

  /**
   * Validates data with field controls, merging with a database record and calculating field controls.
   * @param {object} req The CDS request object.
   * @param {object} dataForValidation The data to be validated.
   * @param {object} context The context object.
   * @returns {Promise<object>} An object containing the original database record, the database record with virtual updates and calculated field controls, and any validation errors.
   */
  async function validateWithFCs(req, dataForValidation, context) {
    const dbRecord = req.params.at(0) ? await SELECT.one.from(req.target).where(req.params.at(0)) : null;

    const mergedRecord = Object.assign({}, dbRecord, dataForValidation);
    const dbRecordWithVirtualUpdate = await fc.calculateFieldControls(mergedRecord, req, context);

    // Mock defaults only make sense when there is no persisted record yet (CREATE);
    // for an existing record, unrelated untouched fields must keep their real values.
    const diffForValidation = fc.configuration.liveValidations && !dbRecord
      ? Object.assign(createMockEntity(req.target.name), dataForValidation)
      : mergedRecord;
    const { errors, fieldControlAnnotationValues } = await fc.validatePayload(dbRecordWithVirtualUpdate, diffForValidation, dataForValidation, dbRecord || {});

    return {
      dbRecord,
      dbRecordWithVirtualUpdate,
      errors,
      fieldControlAnnotationValues
    };
  }

  // 1. Calculate FC for the DB record
  // 2. Merge DB record with changes and calculate FCs
  // 3. Apply validations
  // 4. Compare FC from steps 1 and 2
  // 5. Erase Fields which changed their FCs from Optional/Mandatory to Readonly/Hidden
  /**
   * Handles the UPDATE operation, including field control calculation, validation, and saving.
   * @param {object} req The CDS request object.
   * @param {Function} next The next middleware function.
   * @param {object} context The context object.
   * @returns {Promise<object>} The record after applying field control calculations.
   */
  async function UPDATEHandler(req, next, context) {
    const { errors, dbRecordWithVirtualUpdate, fieldControlAnnotationValues } = await validateWithFCs(req, req.data, context);

    fc.configuration.liveValidations && provideErrors(req, errors, fc.csnEntity);

    fc.eraseUnavailableDynamicFields(dbRecordWithVirtualUpdate, req.data, fc.configuration, fieldControlAnnotationValues);

    await fc.callOnBeforeSave(dbRecordWithVirtualUpdate, req, context);

    const record = await next();

    return await fc.calculateFieldControls(record, req, context);
  }

  /**
   * Handles the DRAFT_PREPARE operation, including field control calculation and validation for draft entities.
   * @param {object} req The CDS request object.
   * @param {Function} next The next middleware function.
   * @returns {Promise<object>} The record after applying field control calculations for the draft.
   */
  async function DRAFTPrepareHandler(req, next) {
    const dbRecord = await SELECT.one.from(req.target).where(req.params.at(0));

    const dbRecordWithFCs = await fc.calculateFieldControls(dbRecord, req);

    const dbRecordWithVirtualUpdate = await fc.calculateFieldControls(Object.assign({}, dbRecord, req.data), req);

    const { errors } = await fc.validatePayload(dbRecordWithFCs, dbRecordWithFCs);

    provideErrors(req, errors, fc.csnEntity, 'in');

    await fc.callOnBeforeSave(dbRecordWithVirtualUpdate, req);

    const record = await next();

    await fc.callOnAfterSave(dbRecordWithVirtualUpdate, req);

    return await fc.calculateFieldControls(record, req);
  }

  /**
   * Handles the READ operation, applying field control calculations to the entity data.
   * @param {object} entity The entity data being read.
   * @param {object} req The CDS request object.
   * @param {object} context The context object.
   * @returns {Promise<object>} The entity data after applying field control calculations.
   */
  async function READHandler(entity, req, context) {
    return await fc.calculateFieldControls(entity, req, context);
  }

  /**
   * Handles the CREATE_DRAFT operation, applying field control calculations to the newly created draft record.
   * @param {object} req The CDS request object.
   * @param {Function} next The next middleware function.
   * @returns {Promise<object>} The draft record after applying field control calculations.
   */
  async function CreateDraftHandler(req, next) {
    const record = await next();

    return await fc.calculateFieldControls(record, req);
  }

  return {
    UPDATEHandler,
    DRAFTPrepareHandler,
    READHandler,
    CreateDraftHandler,
    validateWithFCs,
    provideErrors
  };
}

/**
 * Bind field control handlers to a field control instance for a specific entity.
 * @param {string} csnEntity CSN entity definition
 * @returns {object} Object with bound handlers
 */
function bindEntityHandlers(csnEntity) {
  const fc = getEntityFC(csnEntity);

  return bindHandlers(fc);
}

/**
 * Provide structured errors to the request.
 * @param {object} req The CDS request object.
 * @param {Array} errors Array of error objects.
 * @param {string} targetPrefix Error target prefix.x
 */
function provideErrors(req, errors, targetPrefix) {
  const csnEntity = req.target;
  const { provideErrors } = bindEntityHandlers(csnEntity);

  provideErrors(req, errors, csnEntity, targetPrefix);
}

/**
 * Throw errors and stop request if errors exist.
 * @param {object} req The CDS request object.
 * @param {Array} args Error arguments.
 */
function throwErrorsAndStopIfExists(req, ...args) {
  provideErrors(req, ...args);

  if (req?.errors?.length) {
    req.reject();
  }
}

/**
 * Validate data with field controls and return errors.
 * @param {object} req The CDS request object.
 * @param {object} dataForValidation Data to validate.
 * @param {object} context Context
 * @returns {Promise<Array>} Array of validation errors.
 */
async function validateWithFCs(req, dataForValidation, context) {
  const { validateWithFCs } = bindEntityHandlers(req.target);

  return await validateWithFCs(req, dataForValidation, context);
}

module.exports = {
  async calculateFieldControls(data, req, { csnEntity, context = {} }) {
    const fc = getEntityFC(csnEntity || req.target);

    return await fc.calculateFieldControls(data, req, { context });
  },
  bindHandlers,
  bindEntityHandlers,
  async execAfterREADHandler(entity, req, context) {
    const { READHandler } = bindEntityHandlers(req.target);

    return await READHandler(entity, req, context);
  },

  async execUPDATEHandler(req, next, context) {
    const { UPDATEHandler } = bindEntityHandlers(req.target);

    return await UPDATEHandler(req, next, context);
  },

  validateWithFCs,

  async validateAndThowErrorsIfExists(req, dataForValidation, targetPrefix, context) {
    const { dbRecord, errors } = await validateWithFCs(req, dataForValidation, context);

    throwErrorsAndStopIfExists(req, errors, targetPrefix);

    return dbRecord;
  },

  async validateAndAttachErrors(req, dataForValidation, targetPrefix, context) {
    const { dbRecord, errors } = await validateWithFCs(req, dataForValidation, context);

    provideErrors(req, errors, targetPrefix);

    return { dbRecord, errors };
  },

  provideErrors,

  throwErrorsAndStopIfExists
};
