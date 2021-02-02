'use strict';

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello hpawewlo',
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.dupa = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: 'Dupa',
                input: event,
            },
            null,
            2
        ),
    };
};