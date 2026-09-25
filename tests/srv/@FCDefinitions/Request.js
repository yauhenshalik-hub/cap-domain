const { fieldControlDictionary } = require('cap-fc');

const fieldControlConfigurations = {
    title: {
        fc: () => fieldControlDictionary.Mandatory,
        validator(value, { i18n }) {
            if (!value || value.length < 10) {
                return i18n.getText(
                    'book.validation.title.minLength'
                );
            }
        }
    },
    archived: {
        fc: () => fieldControlDictionary.Optional,
    },
    internalNotes: {
        fc: (request) => request.archived ? fieldControlDictionary.Hidden : fieldControlDictionary.Optional,
    }
};

module.exports = fieldControlConfigurations;
