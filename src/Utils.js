function formatMessage(msg, args) {
  return args.reduce((result, val, i) => result.replace(`{${i}}`, val), msg);
}

const FIELD_TYPE_DEFAULTS = {
  'cds.Timestamp': null,
  'cds.DateTime': null,
  'cds.Date': null,
  'cds.Association': null,
  'cds.Composition': null,
  'cds.Integer': null,
  'cds.UUID': null,
  'cds.Boolean': false,
};

module.exports = class Utils {
  static createMockEntity(entityName) {
    const { elements } = cds.entities[entityName];

    return Object.entries(elements).reduce((acc, [fieldKey, fieldInfo]) => {
      const hasValueList = fieldInfo['@Common.ValueList.CollectionPath'];

      acc[fieldKey] = hasValueList
        ? null
        : FIELD_TYPE_DEFAULTS[fieldInfo.type] ?? '';

      return acc;
    }, {});
  }

  static decorateAllFCs(configs, decorator) {
    for (const key in configs) {
      if (configs.hasOwnProperty(key)) {
        const originalFc = configs[key].fc;

        configs[key].fc = (...args) => decorator(originalFc, ...args);
      }
    }
  }

  static getEntityName(csnEntity) {
    const [, entityName] = csnEntity.name.split('.');

    return entityName;
  }

  static getText(key, args) {
    const locale = cds.context.locale || 'en';
    const bundle = cds.i18n.bundle4();
    const texts = bundle.texts4(locale);
    const msg = texts[key] || key;

    return formatMessage(msg, args || []);
  }

  static getBoundI18nBundle() {
    return {
      getText: (...args) => Utils.getText(...args)
    };
  }
};
