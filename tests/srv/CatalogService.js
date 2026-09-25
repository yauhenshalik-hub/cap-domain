const cds = require('@sap/cds');
const { execAfterREADHandler, execUPDATEHandler, validateAndThowErrorsIfExists } = require('cap-fc');

class CatalogService extends cds.ApplicationService {
    init() {
        const { Books, Authors, Request, Details } = this.entities;

        for (const entity of [ Books, Authors, Request, Details ]) {
            this.on('CREATE', entity, async (req, next) => {
                await validateAndThowErrorsIfExists(req, req.data, 'in');
                return await next();
            });
            this.after('READ', entity, execAfterREADHandler);
            this.on('UPDATE', entity, execUPDATEHandler);
        }

        return super.init();
    }
}

module.exports = CatalogService;
