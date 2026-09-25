# cap-domain - SAP CAP Field Control Plugin

A SAP CAP plugin that provides dynamic field control: it calculates OData `Common.FieldControl`
values (Mandatory / Optional / ReadOnly / Hidden) at runtime and enforces matching server-side
validation, so the client (e.g. Fiori Elements) and the backend always agree on what a field's
current state allows.

Requires `@sap/cds` >= 10.

## Installation

```sh
npm install cap-domain
```

## Quick Start

### 1. Enable the plugin

```json
{
  "cds": {
    "enable:capdomain:plugin": true
  }
}
```

### 2. Provide the required i18n texts

The library reports read-only and mandatory violations using its own i18n keys. Add these to
your app's i18n bundle (e.g. `_i18n/i18n.properties`) - otherwise the raw key is shown instead
of a readable message:

```properties
capdomain.validation.message.readOnly={0} is Read-only field
capdomain.validation.message.required={0} is Required field
```

### 3. Create a field control configuration

Create `srv/@FCDefinitions/MyEntity.js`:

```javascript
const { fieldControlDictionary } = require('cap-domain');

const fieldControlConfigurations = {
  mandatory: {
    fc: () => fieldControlDictionary.Mandatory
  },
  conditional: {
    fc: (entity) => entity.condition ? 
      fieldControlDictionary.Mandatory : 
      fieldControlDictionary.Hidden
  },
  validated: {
    fc: () => fieldControlDictionary.Mandatory,
    validator: (value, { i18n }) => {
      if (!value || value.length < 5) {
        return i18n.getText('validation.minLength', [5]);
      }
    }
  }
};

module.exports = fieldControlConfigurations;
```

Each key must match the *short* name of a virtual `<field>_fc` element declared on the service
entity (see step 4), i.e. `mandatory` configures `mandatory_fc`.

### 4. Configure the CDS service

```cds
service MyService {
  @FCSettings: {
    path: 'srv/@FCDefinitions/MyEntity.js'
  }
  entity MyEntity as projection on my.MyEntity {
    *,
    virtual null as mandatory_fc    : Integer @odata.Type: 'Edm.Byte',
    virtual null as conditional_fc  : Integer @odata.Type: 'Edm.Byte',
    virtual null as validated_fc    : Integer @odata.Type: 'Edm.Byte'
  }
}

annotate MyService.MyEntity with {
  fieldName @(Common.FieldControl: {$value: conditional_fc});
};
```

> Every field that clients are allowed to change must carry its own `@Common.FieldControl`
> annotation. By default (`enable:capdomain:blockUnannotatedValueChanges`), updates to any
> unannotated field are silently dropped - see [Configuration](#configuration).

### 5. Wire up the handlers

Create `srv/my-service.js`:

```javascript
const { 
  execAfterREADHandler, 
  execUPDATEHandler, 
  bindEntityHandlers
} = require('cap-domain');

module.exports = (srv) => {
  const { MyEntity } = srv.entities;

  // Basic handlers
  srv.after('READ', MyEntity, execAfterREADHandler);
  srv.on('UPDATE', MyEntity, execUPDATEHandler);

  // Draft-enabled entity handlers
  if (MyEntity['@odata.draft.enabled']) {
    const { DRAFTPrepareHandler, CreateDraftHandler } = bindEntityHandlers(MyEntity);

    srv.on('NEW', MyEntity.drafts, CreateDraftHandler);
    srv.after('READ', MyEntity.drafts, execAfterREADHandler);
    srv.on('UPDATE', MyEntity.drafts, execUPDATEHandler);
  }
};
```

For `CREATE`, validate explicitly with `validateAndThowErrorsIfExists` (see below) since CAP has
no generic hook equivalent to `execUPDATEHandler` for creates.

## Configuration

### Environment Variables

```json
{
  "cds": {
    "enable:capdomain:plugin": true,
    "enable:capdomain:liveValidations": true,
    "enable:capdomain:autoErase": true,
    "enable:capdomain:defaultFCValue": 3,
    "enable:capdomain:blockUnannotatedValueChanges": true
  }
}
```

| Variable | Default | Effect |
|---|---|---|
| `enable:capdomain:plugin` | `false` | Activates the CDS plugin that wires field control metadata onto annotated entities. |
| `enable:capdomain:liveValidations` | `true` | For a request with no persisted record yet (`CREATE`), validates the whole entity using empty defaults for any field missing from the payload, so mandatory checks fire progressively as a form is filled in. For an existing record (`UPDATE`), untouched fields always keep their persisted values regardless of this setting. |
| `enable:capdomain:autoErase` | `true` | Nulls out a field's value as soon as its field control becomes ReadOnly/Hidden. |
| `enable:capdomain:defaultFCValue` | `3` (Optional) | Fallback field control value used when a field has no explicit calculator. |
| `enable:capdomain:blockUnannotatedValueChanges` | `true` | Drops any incoming field that has no `@Common.FieldControl` annotation of its own. This is a strict, secure-by-default setting: every editable field - including plain "trigger" fields that only influence *other* fields' field control - must be annotated. |

Per-entity `@FCSettings` annotations (`path`, `liveValidations`, `autoErase`,
`blockUnannotatedValueChanges`, `useImpl`) override these environment defaults for that entity.

### Core Functions

#### `validateAndThowErrorsIfExists(req, dataForValidation, targetPrefix)`
Validates data and throws errors if validation fails. Typical use in a `CREATE` handler, where
there is no generic update hook to bind to:

```javascript
const { validateAndThowErrorsIfExists } = require('cap-domain');

srv.on('CREATE', MyEntity, async (req, next) => {
  await validateAndThowErrorsIfExists(req, req.data, 'in');
  return await next();
});
```

#### `validateWithFCs(req, dataForValidation)`
Validates data and returns validation errors.

```javascript
const { validateWithFCs } = require('cap-domain');

const errors = await validateWithFCs(req, req.data, { csnEntity, context = {} });

validateAndAddMyMessage(errors);

if (errors.length > 0) {
  errors.forEach(error => {
    req.error({
      target: `/MyEntity(${req.params.at(0).ID})/${error.fieldName}`,
      message: error.message,
      code: 400
    });
  });
  req.reject();
}
```

#### `calculateFieldControls(data, req, { csnEntity, context = {} })`
Calculates field control values for entities.

```javascript
const { calculateFieldControls } = require('cap-domain');

const entityWithFCs = await calculateFieldControls(entity, req, { 
  csnEntity: MyEntity, // optional, req.target will be used by default
  context: { additionalData: 'value' }
});
```

#### `execAfterREADHandler(entity, req, context)`
Executes READ handler for field control calculation.

```javascript
const { execAfterREADHandler } = require('cap-domain');

srv.after('READ', MyEntity, execAfterREADHandler);
```

#### `execUPDATEHandler(req, next, context)`
Executes UPDATE handler with field control validation.

```javascript
const { execUPDATEHandler } = require('cap-domain');

srv.on('UPDATE', MyEntity, execUPDATEHandler);
```


#### `Utils`
```javascript
const { Utils } = require('cap-domain');

const message = Utils.getText('validation.required', ['dynamic field value']);
const entityName = Utils.getEntityName(csnEntity);
const i18n = Utils.getBoundI18nBundle();
```

## Example project

See [`tests/`](./tests) for a runnable CAP showcase (bookshop-style model) exercising mandatory
fields, conditional field control, read-only enforcement, auto-erase and the
`blockUnannotatedValueChanges` guard:

```sh
npm test
```
