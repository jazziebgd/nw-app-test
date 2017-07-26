const path = require('path');

exports.config = {
    appConfig: {
        appSubFiles: [
            {
                name: 'appTest',
                className: 'AppTest',
                file: path.resolve(path.join(__dirname, './lib/appTest.js'))
            }
        ],
        appTestConfig: {
            dataPropertyName: 'appTestData',
            defaultDataPropertyName: 'defaultAppTestData',
        }
    },
    debug: {
        forceDebug: {
            AppTest: false,
        },
    },

    userMessages: {
        forceUserMessages: {
            AppTest: false,
        }
    },
};