const path = require('path');
const ServiceParser = require('./ServiceParser.js');
const { FieldControls } = require('./FieldControls.js');
const Utils = require('./Utils.js');
const { setEntityFC, addSrvEntitiesFCs } = require('./SymbolHelper');

module.exports = function(service) {
  const services = Array.isArray(service) ? service : [ service ];

  ServiceParser.onEachFCEntity(services, async (srv, csnEntity, configuration) => {
    const entityName = Utils.getEntityName(csnEntity);
    const configurationFilePath = path.resolve('./', configuration.path);

    const configurationEntity = require(configurationFilePath);

    const fc = new FieldControls(srv, csnEntity, configurationEntity, configuration);

    setEntityFC(csnEntity, fc);
    csnEntity.drafts && setEntityFC(csnEntity.drafts, fc);
    addSrvEntitiesFCs(srv, { [entityName]: fc });
  });
};
