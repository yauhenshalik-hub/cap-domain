const actions = {
  onBeforeSave: Symbol('onBeforeSave'),
  onAfterSave: Symbol('onAfterSave'),
  setOnBeforeCalculateFC: Symbol('setOnBeforeCalculateFC'),
  srvEntitiesFC: Symbol('srvEntitiesFC'),
  entityFC: Symbol('entityFC')
};

/**
 * Set the onBeforeSave handler.
 * @param {object} obj The configuration object.
 * @param {Function} handler The handler function.
 */
function setOnBeforeSave(obj, handler) {
  obj[actions.onBeforeSave] = handler;
}

/**
 * Get the onBeforeSave handler.
 * @param {object} obj The configuration object.
 * @returns {object|null} Field Control object definition
 */
function getOnBeforeSave(obj) {
  return obj[actions.onBeforeSave];
}

/**
 * Get the onAfterSave handler.
 * @param {object} obj The configuration object.
 * @returns {object|null} Field Control object definition
 */
function getOnAfterSave(obj) {
  return obj[actions.onAfterSave];
}

/**
 * Set the onAfterSave handler.
 * @param {object} obj The configuration object.
 * @param {Function} handler The handler function.
 */
function setOnAfterSave(obj, handler) {
  obj[actions.onAfterSave] = handler;
}

/**
 * Set the onBeforeCalculateFC handler.
 * @param {object} obj The configuration object.
 * @param {Function} handler The handler function.
 */
function setOnBeforeCalculateFC(obj, handler) {
  obj[actions.setOnBeforeCalculateFC] = handler;
}

/**
 * Get the onBeforeCalculateFC handler.
 * @param {object} obj The configuration object.
 * @returns {object|null} Field Control object definition
 */
function getOnBeforeCalculateFC(obj) {
  return obj[actions.setOnBeforeCalculateFC];
}

/**
 * Set the entity field control handler.
 * @param {object} obj The configuration object.
 * @param {Function} handler The handler function.
 */
function setEntityFC(obj, handler) {
  obj[actions.entityFC] = handler;
}

/**
 * Get the entity field control handler.
 * @param {object} obj The configuration object.
 * @returns {object|null} Field Control object definition
 */
function getEntityFC(obj) {
  const fcObject = obj[actions.entityFC];

  if (!fcObject) {
    throw Error(`CSN Entity: ${ obj.name } doesn't have configuration, check annotations definitions`);
  }

  return fcObject;
}

/**
 * Get the service entities field controls.
 * @param {object} obj The configuration object.
 * @returns {object|null} Field Control object definition
 */
function getSrvEntitiesFCs(obj) {
  return obj[actions.srvEntitiesFC];
}

/**
 * Add service entities field controls.
 * @param {object} obj The configuration object.
 * @param {object} handler The handler object.
 */
function addSrvEntitiesFCs(obj, handler) {
  const reference = obj[actions.srvEntitiesFC];

  if (!reference) {
    obj[actions.srvEntitiesFC] = handler;
  } else {
    Object.assign(reference, handler);
  }
}

module.exports = {
  setOnBeforeSave,
  getOnBeforeSave,
  setOnBeforeCalculateFC,
  getOnBeforeCalculateFC,

  getSrvEntitiesFCs,
  addSrvEntitiesFCs,

  getOnAfterSave,
  setOnAfterSave,

  setEntityFC,
  getEntityFC
};
