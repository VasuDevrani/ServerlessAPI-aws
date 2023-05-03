import { DynamoDBClient, GetItemCommand, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDBClient({region: 'us-east-1'});
const userPath = '/users'; 

const DYNAMODB_TABLE_NAME = 'users';

export const handler = async(event) => {
    let response;
    
    switch(event.httpMethod){
        case 'POST':
            response = await saveUser(JSON.parse(event.body));
            break;
        case 'GET':
             if (event.pathParameters != null) {
             response = await getUser(event.pathParameters.id);
             } else {
             response = await getAllUsers();
             }
             break;
        case 'PUT':
            response = await updateUser(JSON.parse(event.body));
            break;
        case 'DELETE':
            response = await deleteUser(JSON.parse(event.body).id);
            break;
        default:
            response = buildResponse(404, '404 Not found, try another route');
    }
    return response;
};

const deleteUser = async (id) => {
    const params = {
        TableName: DYNAMODB_TABLE_NAME,
        Key: {
            'id': marshall(id)
        },
        returnValues: 'ALL_OLD'
    };
    const user = await dynamodb.send(new DeleteItemCommand(params));
    const body = {
        operation: 'DELETE',
        message: 'SUCCESS',
        user
    };
    return buildResponse(200, body);
}

const updateUser = async (data) => {
    try{
        const params = {
            TableName: DYNAMODB_TABLE_NAME,
            Key: {
                'id': marshall(data.id)
            },
            UpdateExpression: `set ${data.updateKey} = :value`,
            ExpressionAttributeValues: {
                ':value': marshall(data.updateValue)
            },
            returnValues: 'UPDATED_NEW'
        }
        const user = await dynamodb.send(new UpdateItemCommand(params));
        const body = {
            operation: 'UPDATE',
            message: 'SUCCESS',
            user
        };
        return buildResponse(200, body);
    }catch(err){
        console.error(err);
        throw err;
    }
}

const getAllUsers = async() => {
    try {
        const params = {
         TableName: DYNAMODB_TABLE_NAME
        };
 
        const { Items } = await dynamodb.send(new ScanCommand(params));
     const body = {
            operation: 'GET',
            message: 'SUCCESS',
            user: (Items) ? Items.map((item) => unmarshall(item)) : {}
        };
        return buildResponse(200, body);
    } catch(err) {
         console.error(err);
         throw err;
    }
}

const getUser = async (userId) => {
    try {
        const params = {
        TableName: DYNAMODB_TABLE_NAME,
        Key: marshall({ id: userId })
    };
     
     const { Item } = await dynamodb.send(new GetItemCommand(params));
     const body = {
            operation: 'GET',
            message: 'SUCCESS',
            user: (Item) ? unmarshall(Item) : {}
        };
        return buildResponse(200, body);
    } catch(err) {
         console.error(err);
         throw err;
    }
}

const saveUser = async (user) => {
    try{
        const params = {
            TableName: DYNAMODB_TABLE_NAME,
            Item: marshall(user || {})
        };
        
        console.log(params)
        const res = await dynamodb.send(new PutItemCommand(params));
        const body = {
            operation: 'SAVE',
            message: 'SUCCESS',
            user
        };
     return buildResponse(200, body);
    }catch(err){
        console.log(err)
        throw err;
    }
}

const buildResponse = (statusCode, message) => {
    return{
        statusCode,
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(message)
    }
}
