const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient()
const XRay = require('aws-xray-sdk-core')
XRay.captureAWSClient(dynamodb.service)

const wrap = require('@dazn/lambda-powertools-pattern-basic')
const ssm = require('@middy/ssm')
const Log = require('@dazn/lambda-powertools-logger')


const { serviceName, stage } = process.env

const tableName = process.env.restaurants_table

const findRestaurantsByTheme = async (theme, count) => {
    console.log(`finding (up to ${count}) restaurants with the theme ${theme}...`)
    const req = {
        TableName: tableName,
        Limit: count,
        FilterExpression: "contains(themes, :theme)",
        ExpressionAttributeValues: { ":theme": theme }
    }

    const resp = await dynamodb.scan(req).promise()
    const restaurntsNumber = resp.Items.length
    Log.debug(`Restaurants found: `, {restaurntsNumber} )
    return resp.Items
}

module.exports.handler = wrap(async (event, context) => {
    const req = JSON.parse(event.body)
    const theme = req.theme
    const restaurants = await findRestaurantsByTheme(theme, process.env.defaultResults)
    const response = {
        statusCode: 200,
        body: JSON.stringify(restaurants)
    }
    const secret = context.secretString
    Log.debug('Secret info...', { secret })

    return response
}).use(ssm({
    cache: true,
    cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
    names: {
        config: `/${serviceName}/${stage}/search-restaurants/config`
    },
    onChange: () => {
        const config = JSON.parse(process.env.config)
        process.env.defaultResults = config.defaultResults
    }
})).use(ssm({
    cache: true,
    cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
    names: {
        secretString: `/${serviceName}/${stage}/search-restaurants/secretString`
    },
    setToContext: true,
    throwOnFailedCall: true
}))