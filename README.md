## Coyote-cli
Coyote-cli is a tool created to generate the necessary files of a basic project based on **Node js** and **mongodb** as a database. With just a couple of tweaks you can save yourself a couple of hours of work creating API rest.

This project is not only designed to save configuration time, but also to focus the developer a little more towards the structure that the project must carry in relation to business logic.

Although we know that most of the time it is not codified once with only a good structure, it is also true that the latter helps reduce errors that can be made when writing code, so it is advisable to have well defined business logic before you start coding.

Considering the above and the fact that **COYOTE-CLI** bases many of its file creation methods on strings, it is important to follow these steps:
* Define the business logic.
* Build the project with **COYOTE-CLI**.
* If there are any functions that this tool does not support yet (such as specific conditions), it is better to add them after generating everything necessary with **COYOTE-CLI**.

##### Table of Contents
[Installation](#1-installation)

[Project generation](#2-project-generation)

[Run the project](#3-run-the-project)

[Create models for your-project](#4-create-models-for-your-project)

[Types](#types)
* [Object type](#1-object-type)
* [ObjectId type](#2-objectId-type)
* [Array type](#3-array-type)
* [Object contentType](#31-object-contentType)
* [ObjectId contentType](#32-objectId-contentType)
* [Features](#features)

[Methods](#methods)
* [Add method](#add-method)

  - [Single](#single)
  - [Several](#several)

* [Select method](#select-method)
* [List method](#list-method)
  - [And param](#and-param)
  - [Or param](#or-param)
  - [Projects params](#projects-params)
  - [Logicals (eq, ne, gt, gte, lt, lte) params](#logicals-eq-ne-gt-gte-lt-lte-params)
  - [Sort param](#sort-param)
  - [Skip param](#skip-param)
  - [Limit param](#limit-param)
  - [Skip and limit params (pagination)](#skip-and-limit-params-pagination)
  - [DateOperator param](#dateOperator-param)
  - [Group param](#group-param)
  - [Arithmetic params (sum, subtract, multiply, divide, avg, max and min)](#arithmetic-params-sum,-subtract,-multiply,-divide,-avg,-max-and-min)

* [Update method](#update-method)
* [Remove method](#remove-method)
* [Scheme method](#scheme-method)

[Authentication](#authentication)
* [Bearer](#bearer)
* [Cookies](#cookies)

### 1. Installation
The package must be installed globally.
```sh 
npm install -g coyote-cli 
```

### 2. Project generation
Anywhere on your computer you can generate a project by running the command:
```sh 
coyote-generate-project
```
Coyote-cli will give you to choose the database to use (mongodb or postgresql) and ask you the name you want to give to your new project and followed by it will create it with the following structure:
```
├── app.js
├── ecosystem.config.js
├── index.js
├── package.json
├── settings.json
├── .env
├── .env-example
├── .gitignore
└── src
   ├── config
   ├── controllers
   ├── helpers
   ├── loaddres
   ├── models
   ├── modules
   └── routes
```

## 3. Run the project
At this point you can run the project with the command:
```sh 
npm start 
```
In the bash you will see the indication that it will be running on port 8300.
You can test that everything is working by accessing the path ```http://localhost:8300/health```. It will return an "Ok" in response with a status of "200".

## 4. Create models for your project
To create the models you must go to the root of the project and open the "settings.json" file, then in the "models" section place the models and their fields as follows:

```Javascript
"models": {
    "model_name": {
      "fields": {
        "field_name": {
          "type": "field_type",
          "feature": "value"
        },
        "field_name": {
          "type": "field_type",
          "feature": "value"
        }
      }
    }
}
```

#### Example:
```Javascript
"models": {
    "product": {
      "fields": {
        "item": {
          "type": "String",
          "unique": true
        },
        "description": {
          "type": "String",
          "required": true
        },
        "category": {
          "type": "String"
        },
        "qty": {
          "type": "Number"
        },
        "arrival": {
          "type": "Date"
        }
      }
    }
}
```
Once the models have been configured run the following command in bash:

```
coyote-generate-models
```

And that's it, **COYOTE-CLI** will create the schemes, their controllers and even the middlewares for the data security of each model. This also creates a directory called middlewares inside, leaving the set of files and directories like this:

```
├── app.js
├── ecosystem.config.js
├── index.js
├── package.json
├── settings.json
├── .env
├── .env-example
├── .gitignore
└── src
   ├── config
   ├── controllers
   ├── helpers
   ├── loaddres
   ├── middlewares
   ├── models
   ├── modules
   └── routes
```

The way the models can be created in the settings.json file is described in the [Types](#types) section.

Each controller will have the methods:

- add
- selectById
- list
- update
- remove
- getSchema

These methods are appropriately described in the [Methods](#methods) section.

**Note that every time you generate the models, every file (models, controllers, middleware and routes) will be replaced.**

The types and characteristics of any model supported by **COYOTE-CLY** are the following:

# Types
- String
- Number
- Date
- Object
- ObjectId
- Array

These are the basic types for the attributes of a schema in mongodb, however, both in "Object", "ObjectId" and "Array" the following considerations must be taken into account:
##### 1. Object type
This structure has the key "structure" where the fields of the object are indicated as follows:
```Javascript
"myObjectField": {
    "type": "Object",
    "structure": {
        "myStringField": {
            "type": "String"
        },
        "myNumberField": {
            "type": "Number"
        }
    }
}
```
##### 2. ObjectId type
This structure has the key "ref" whose value is the name of the model to which reference will be made as indicated:
```Javascript
"myObjectIdField": {
    "type": "ObjectId",
    "ref": "model_name"
}
```
##### 3. Array type
This structure has the key "contentType" whose value is the type of data that the array will contain:
```Javascript
"myArrayField": {
    "contentType": "String"
}
```
##### 3.1 Object contentType
If the contentType is "Object", the array field must have the "structure" key indicating the object sctructure:
```Javascript
"myArrayField": {
    "contentType": "Object",
    "structure": {
        "myStringField": {
            "type": "String"
        },
        "myNumberField": {
            "type": "Number"
        }
    }
}
```
##### 3.2 ObjectId contentType
If the contentType is "ObjectId", the array field must have the "ref" key indicating the model to which it refers:
```Javascript
"myArrayField": {
    "contentType": "ObjectId",
    "ref": "model_name"
}
```

#### Features
- default
- max
- min
- maxLen
- minLen
- unique
- required
- lowercase
- uppercase

These listed features do not need much explanation if you have previous knowledge of mongodb, except for "max" or "min" which are used for fields of type ```Number``` and "maxLen" or "minLen" used for fields of type ```String```.

# Methods
Once **COYOTE-CLI** creates the models automatically, it will also create their respective controllers and routes to connect to the database and be able to use the methods described below:

### Add method
```sh
POST: http:localhost:80/model/add
```
The add method is used to insert records into the database, sent through the request body. In this case, if you want to insert a single record, you must insert a json object with the pertinent data, otherwise if you want to insert several records, then you must send an array of json objects:

##### Single
```Javascript
body: {
    myString: "value",
    myNumber: 5
}
```

##### Several
```Javascript
body: [
    {
        myString: "value",
        myNumber: 5
    },
    {
        myString: "second value",
        myNumber: 5.4
    }
]
```

### Select method
```sh
GET: http:localhost:80/model/select/:id
```
To use this method, the ID of the record to be retrieved from the database must be sent inside the URL of the fetch request:
##### Example
```sh
http:localhost:80/model/select/31
```

### List method
```sh
GET: http:localhost:80/model/list
```
Initially it returns an empty array if there are no records in the database and an array with all records if there are records and no params is sent.
The params that are sent in the request url will indicate to the method how it will filter the returned records and there is a limited list (some of the most important for now) of them in **COYOTE-CLI** that will be accepted:

##### And param
```sh
http:localhost:80/model/list?stringField=somevalue&&numberField=somenumber
```
In this case, the method returns an array with all the records of said model, whose values in the "stringField" and "numberField" fields coincide with those granted.

##### Or param
```sh
http:localhost:80/model/list?or[stringField]=somevalue&&or[numberField]=somenumber
```
In this case, the method returns an array with all the records of said model, whose values in the "stringField" or "numberField" fields coincide with those granted.

##### Projects params
```sh
http:localhost:80/model/list?projects[stringField]=1&&projects[numberField]=1
```
In this way, the method returns an array with all the records of said model, but it would only show the "stringField" and "numberField" fields.

##### Logicals (eq, ne, gt, gte, lt, lte) params
```sh
http:localhost:80/model/list?gte[numberField]=somenumber
```
In this way, the method returns an array with all the records of said model whose "numberField" is greater than or equal to the given one.
- qe = equal
- ne = not equal
- gt = greater than
- gte = greater than equal
- lt = less than
- lte = less than equal

##### Sort param
```sh
http:localhost:80/model/list?sort[numberField]=1
```
In this way, the method returns an array with the records of said model, ordered ascending (1) or descending (-1) according to the indicated field (in this case "numberField").

##### Skip param
```sh
http:localhost:80/model/list?skip=5
```
In this way, the method returns an array with a number of records of said model from the number given in the ```skip``` property.

##### Limit param
```sh
http:localhost:80/model/list?limit=10
```
In this way, the method returns an array with a number of records of said model equal to the number given in the ```limit``` property.

##### Skip and limit params (pagination)
```sh
http:localhost:80/model/list?skip=2&&limit=10
```
Combining the two previous properties will allow the records returned from said model to be sectioned by way of pagination, indicating the number of the page in the ```skip``` property and the number of records in the ```limit``` property.

It is **important** to send these parameters in this precise order to get this result.

##### DateOperator param
```sh
http:localhost:80/model/list?dateOperator[as]=day&&dateOperator[operator]=dayOfMonth&&dateOperator[field]=myDateField
```
In this way, additional fields related to an existing date type field are added to each record returned from the indicated model, hoping to obtain specific information from this existing field.

To do this, it is necessary to send the ```dateOperator``` key, whose value is an object with the attributes ```as``` (indicating how the result will be displayed), ```operator``` (indicating the operation to perform) and ```field``` (indicating the field to which the operation will be applied).

Date operators are:
- year
- month
- dayOfMonth
- hour
- minute
- second
- millisecond
- dayOfYear
- dayOfWeek
- week

##### Group param
By adding the ```group``` parameter to the request, it returns the records of a specific model, grouped by the indicated fields.

To use this parameter, the ```group``` key is added to the request, whose value will be the name of the field by which you want to group or an array with the fields by which you want to group.

```sh
http:localhost:80/model/list?group=category
```
This request returns the records of a specific model grouped by category.

```sh
http:localhost:80/model/list?group=category&&group=name
```
This request returns the records of a specific model grouped by category and name.

##### Arithmetic params (sum, subtract, multiply, divide, avg, max and min)
An arithmetic parameter must be combined with the ```group``` or ```projects``` parameters for proper operation and is used to process a mathematical operation on the records that are returned with the values given to the request.

To do this, a key with the name of the arithmetic parameter is passed in the request, which will be an object that in turn will have as attributes the parameters with which it will work together (```group``` or ```projects```). Then, within the latter, the fields to which the operations will be performed and their value, which can be a number, the name of a numeric field of the record or an object indicating an arithmetic sub-operation, are indicated. These values can also be combined within an array.

```sh
http:localhost:80/model/list?group=total]&&sum[group][total]=1
```
Here the request returns the total number of records of a specific model.

```sh
http:localhost:80/model/list?group=category&&sum[group][category]=1
```
In this case, the records grouped by category are returned, as well as how many records each category contains.

```sh
http:localhost:80/model/list?projects[total]&&sum[projects][total]=qty&&sum[projects][total]=1
```
Here the request returns in each record of the assigned model a field called "total" whose result is the sum of the "numberField" field plus 1.

```sh
http:localhost:80/model/list?projects[new_qty]=1&&sum[projects][new_qty][multiply]=2&&sum[projects][new_qty][multiply]=2
```
Here the request returns in each record the field "new_total" whose value is the multiplication of 2 by 2.

```sh
http:localhost:80/model/list?projects[new_qty]=1&&sum[projects][new_qty]=qty&&sum[projects][new_qty][multiply]=2&&sum[projects][new_qty][multiply]=2
```
In this way, the request returns in each record the "new_total" field whose value is the sum of the qty field plus the multiplication of 2 by 2.

```sh
http:localhost:80/model/list?projects[new_qty]=1&&sum[projects][new_qty][0][subtract]=5&&sum[projects][new_qty][0][subtract]=3&&sum[projects][new_qty][1][multiply]=2&&sum[projects][new_qty][1][multiply]=2
```
Here the request returns in each record the "new_total" field whose value is the sum of the subtraction of 5 minus 2 plus the multiplication of 2 by 2.

### Update method
```sh
PUT: http:localhost:80/model/update
```

To use this method it is necessary to send the data that you want to modify (including the _id) in the request body:
```Javascript
{
    _id: 3,
    firstField: "some string",
    secondField: 5.3
}
```

This replaces the submitted fields ("firstField" and "secondField") in the record whose "_id" is 3.

If you want to update multiple records, then you can add params to the PUT request:
```sh
PUT: http:localhost:80/model/update?thirdField=9.1&fourthField=valueField
```

This replaces the "firstField" and "secondField" field values of all records whose "thirdField" and "fourthField" field values match 9.1 and "valueField" respectively.

**Note that sending params in the PUT request will omit the "_id" field from the body.**

**If the request body contains an array of objects, the method will only take into account the data of the last element.**

### Remove method
```sh
DELETE: http:localhost:80/model/remove?_id=7
```

This method removes all records whose values match those indicated in the request params.

**The params are required and work like the update method.**

### Schema method
```sh
DELETE: http:localhost:80/model/scheme
```

This method returns the structure of the model indicated in the request.

As you can see, building query params is a tedious experience for developers, so there is a library called [json-qs-converter](#https://www.npmjs.com/package/json-qs-converter) that allows you to build them from a json object.

# Authentication
**COYOTE-CLI** also gives you the ability to create an authentication protocol by typing the following command in the project root:

```sh
coyote-generate-auth
```

Typing the command will ask for the authentication type between ```cookies``` or ```bearer``` And the following changes will occur in the project:

- This will add the ```user```, ```role```, and ```permissions``` models to the "models" section of the ```settings.json``` file with their respective files in them. models, controllers, routes and middlewares directories.

- The sessions.js file will be created in the middlewares directory.

- The value of ""authenticationApp"" will be changed to true. 

- The variables ```ACCESS_TOKEN_SECRET``` and ```REFRESH_TOKEN_SECRET``` will be added to "enviromentKeyValues" in ```settings.json```.

- The file ```queries.txt``` will be created in the root of the project, where are the queries that you must execute in the database to add a first master user.

- Two ```auth.js``` files will be created in the controllers and the routes will have the access methods depending on the authentication type.

#### Bearer
With this protocol it is necessary to send an authentication token ("Bearer token") in each request except for "/auth/login" and its operation follows the guidelines of a Bearer authentication.

Every time you want to obtain resources through an API with this type of authentication, the client must first authenticate through the route "/auth/login" which will return a token and then request the required resource through any other route, sending the received token.

#### Cookies
With this protocol the client must authenticate first through "/auth/login", which will return a access token that must be sent in each request (except "/auth/login" and "/auth/refresh") through cookies securely, giving the request credentials the value true.

"/auth/refresh" is an extra path in this protocol that allows updating and returning the access token. This is intended so that the client does not have to login again once the access token has expired.