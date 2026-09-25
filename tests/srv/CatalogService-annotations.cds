using {CatalogService as srv} from './CatalogService';

annotate srv.Books with {
  title         @(
    Common.FieldControl: {$value: title_fc},
    Common.Label       : '{i18n>title}'
  );
  description   @(
    Common.FieldControl: {$value: description_fc},
    Common.Label       : '{i18n>description}'
  );
  enableDetails @(
    Common.FieldControl: {$value: enableDetails_fc}
  );
};

annotate srv.Request with {
  title         @(
    Common.FieldControl: {$value: title_fc},
    Common.Label       : '{i18n>title}'
  );
  archived      @(
    Common.FieldControl: {$value: archived_fc}
  );
  internalNotes @(
    Common.FieldControl: {$value: internalNotes_fc}
  );
};

annotate srv.Details with {
  title       @(
    Common.FieldControl: {$value: title_fc},
    Common.Label       : '{i18n>title}'
  );
};


annotate srv.Authors with {
  name       @(
    Common.FieldControl: {$value: name_fc},
    Common.Label       : '{i18n>name}'
  );
};

