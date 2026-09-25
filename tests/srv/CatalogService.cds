using my.bookshop as my from '../db/data-model';


service CatalogService {
    @FCSettings: {
        path     : 'srv/@FCDefinitions/Authors.js'
    }
    entity Authors   as
        projection on my.Authors {
            *,
            virtual null as name_fc       : Integer @odata.Type: 'Edm.Byte',
        };

    @FCSettings: {
        path     : 'srv/@FCDefinitions/Books.js'
    }
    entity Books   as
        projection on my.Books {
            *,
            virtual null as title_fc         : Integer @odata.Type: 'Edm.Byte',
            virtual null as description_fc   : Integer @odata.Type: 'Edm.Byte',
            virtual null as enableDetails_fc : Integer @odata.Type: 'Edm.Byte'
        };

    @FCSettings: {
        path                        : 'srv/@FCDefinitions/Request.js',
        autoErase                   : false,
        blockUnannotatedValueChanges: false
    }
    entity Request as
        projection on my.Request {
            *,
            virtual null as title_fc         : Integer @odata.Type: 'Edm.Byte',
            virtual null as archived_fc      : Integer @odata.Type: 'Edm.Byte',
            virtual null as internalNotes_fc : Integer @odata.Type: 'Edm.Byte'
        };

    @FCSettings: {
        path     : 'srv/@FCDefinitions/Details.js'
    }
    entity Details as
        projection on my.Details {
            *,
            virtual null as title_fc : Integer @odata.Type: 'Edm.Byte',
        };
}
