const cdsPluginImpl = require('./src/cdsPluginImpl');

cds.env['enable:capdomain:plugin'] && cds.once('served', async () => {
  cdsPluginImpl(Object.values(cds.services));
});
