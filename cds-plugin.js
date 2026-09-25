const cdsPluginImpl = require('./src/cdsPluginImpl');

cds.env['enable:capfc:plugin'] && cds.once('served', async () => {
  cdsPluginImpl(Object.values(cds.services));
});
