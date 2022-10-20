## Coyote-cli
Coyote-cli is a tool created to generate the necessary files of a basic project based on **Node js** and **mongodb** as a database. With just a couple of tweaks you can save yourself a couple of hours of work creating API rest.

This project is not only designed to save configuration time, but also to focus the developer a little more towards the structure that the project must carry in relation to business logic.

Although we know that most of the time it is not codified once with only a good structure, it is also true that the latter helps reduce errors that can be made when writing code, so it is advisable to have well defined business logic before you start coding.

Considering the above and the fact that **COYOTE-CLI** bases many of its file creation methods on strings, it is important to follow these steps:
* Define the business logic.
* Build the project with **COYOTE-CLI**.
* If there are any functions that this tool does not support yet (such as specific conditions), it is better to add them after generating everything necessary with **COYOTE-CLI**.

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
```C:\Users\Hp\Documents\projects\my-project
├── app.js
├── index.js
├── package.json
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

## Create models for your project
To create the models you must go to the root of the project and open the "settings.json" file, then in the "models" section place the models and their fields as follows:

```
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
```
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
Los tipos y características de cualquier modelo soportado por **COYOTE-CLY** son los siguientes:

#### Types
- String
- Number
- Date
- Object
- ObjectId
- Array

These are the basic types for the attributes of a schema in mongodb, however, both in "Object", "ObjectId" and "Array" the following considerations must be taken into account:
##### 1. Object type
This structure has the key "structure" where the fields of the object are indicated as follows:
```
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
##### 2. ObjectTd type
This structure has the key "ref" whose value is the name of the model to which reference will be made as indicated:
```
"myObjectIdField": {
    "type": "ObjectId",
    "ref": "model_name"
}
```
##### 3. Array type
This structure has the key "contentType" whose value is the type of data that the array will contain:
```
"myArrayField": {
    "contentType": "String"
}
```
##### 3.1 Object contentType
If the contentType is "Object", the array field must have the "structure" key indicating the object sctructure:
```
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
```
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

#### Add method
```
POST: http:localhost:80/model/add
```
The add method is used to insert records into the database, sent through the request body. In this case, if you want to insert a single record, you must insert a json object with the pertinent data, otherwise if you want to insert several records, then you must send an array of json objects:

##### Single
```
body: {
    myString: "value",
    myNumber: 5
}
```

##### Several
```
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
```
GET: http:localhost:80/model/select/:id
```
To use this method, the ID of the record to be retrieved from the database must be sent inside the URL of the fetch request:
##### Example
```
http:localhost:80/model/select/31
```

### List method
```
GET: http:localhost:80/model/list
```
Initially it returns an empty array if there are no records in the database and an array with all records if there are records and no params is sent.
The params that are sent in the request url will indicate to the method how it will filter the returned records and there is a limited list (some of the most important for now) of them in **COYOTE-CLI** that will be accepted:

##### And param
```
http:localhost:80/model/list?stringField=somevalue&&numberField=somenumber
```
In this case, the method returns an array with all the records of said model, whose values in the "stringField" and "numberField" fields coincide with those granted.

##### Or param
```
http:localhost:80/model/list?or[stringField]=somevalue&&or[numberField]=somenumber
```
In this case, the method returns an array with all the records of said model, whose values in the "stringField" or "numberField" fields coincide with those granted.

##### Projects params
```
http:localhost:80/model/list?projects[stringField]=1&&projects[numberField]=1
```
In this way, the method returns an array with all the records of said model, but it would only show the "stringField" and "numberField" fields.

##### Logicals (eq, ne, gt, gte, lt, lte) params
```
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
```
http:localhost:80/model/list?sort[numberField]=1
```
In this way, the method returns an array with the records of said model, ordered ascending (1) or descending (-1) according to the indicated field (in this case "numberField").

##### Skip param
```
http:localhost:80/model/list?skip=5
```
In this way, the method returns an array with a number of records of said model from the number given in the ```skip``` property.

##### Limit param
```
http:localhost:80/model/list?limit=10
```
In this way, the method returns an array with a number of records of said model equal to the number given in the ```limit``` property.

##### Skip and limit params (pagination)
```
http:localhost:80/model/list?skip=2&&limit=10
```
Combining the two previous properties will allow the records returned from said model to be sectioned by way of pagination, indicating the number of the page in the ```skip``` property and the number of records in the ```limit``` property.

It is **important** to send these parameters in this precise order to get this result.

##### dateOperator param
```
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

##### Sum param
This parameter must be used in combination with the ```group``` or ```projects``` parameters for its correct operation and it is used to add a sum to the records that are returned with the values given to the request.

To do this, the ```sum``` key is passed in the request, which will be an object that will have as attributes the parameters with which it will work together.
```
http:localhost:80/model/list?group=category&&sum[group][category]=1
```
In this case, records grouped by category and the number of existing categories are returned.