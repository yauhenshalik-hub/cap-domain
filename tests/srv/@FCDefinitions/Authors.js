const { fieldControlDictionary } = require('cap-fc');

const fieldControlConfigurations = {
    name: {
        fc: () => fieldControlDictionary.Mandatory,
        validator(value, { i18n }) {
            if (!value || value.length < 10) {
                return i18n.getText(
                    'book.validation.title.minLength'
                );
            }
        }
    }
};

// addOnHAndler(fieldControlConfigurations, (req, next) => {
//     this.srvFn();
// })

// addOnBeforeAll(fieldControlConfigurations, (req) => {
//     this.fetchS4Data
// })

module.exports = fieldControlConfigurations;
