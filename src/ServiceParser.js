const defaultAnnotationValues = require('./defaultAnnotationValues');

/**
 * Extract FCSettings annotations from an annotation object.
 * @param {object} annotations The annotation object.
 * @returns {object|null} Settings object
 */
function extractFCSettings(annotations) {
  if (!annotations) {
    return null;
  }

  const FCSettings = {};

  for (const [ key, value ] of Object.entries(annotations)) {
    if (key.startsWith('@FCSettings.')) {
      const path = key.slice('@FCSettings.'.length).split('.');
      let current = FCSettings;

      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];

        if (!(segment in current)) {
          current[segment] = {};
        }

        current = current[segment];
      }

      current[path[path.length - 1]] = value;
    }
  }

  return Object.keys(FCSettings).length > 0
    ? { ...structuredClone(defaultAnnotationValues), ...FCSettings }
    : null;
}

module.exports = class ServiceParser {
  /**
   * Call a callback for each FC entity in the given services.
   * @param {Array|object} services The services to process.
   * @param {Function} callback The callback to call for each FC entity.
   */
  static onEachFCEntity(services, callback) {
    for (const srv of services) {
      if (srv instanceof cds.ApplicationService) {
        Object.values(srv.entities).forEach((entity) => {
          const FCSettings = extractFCSettings(entity?.$flatAnnotations);

          FCSettings && FCSettings.path && callback(srv, entity, FCSettings);
        });
      }
    }
  }
};
