## Coyote-cli
Coyote-cli is a tool created to generate the necessary files of a basic project based on **Node js** and **mongodb** as a database. With just a couple of tweaks you can save yourself a couple of hours of work creating rest api.

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
Coyote-cli will ask you the name you want to give to your new project and followed by it will create it with the following structure:
```C:\Users\Hp\Documents\projects\my-project
├── app.js
├── index.js
├── package.json
├── .env
├── .gitignore
└── src
   ├── config
   ├── controllers
   ├── models
   ├── modules
   └── routes
```

### 3. Instructions
Before continuing it is necessary to open the ```.env``` file and place the actual connection values ​​to our database in **mongodb**. This file has three simple variables with the credentials for your connection:
```sh 
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DATABASE=my_database
```
Normally both the test host and the port will be the same, so you only have to change the name of your database.

## 4. Run the project
At this point you can run the project with the command:
```sh 
npm start 
```
In the bash you will see the indication that it will be running on port 8300.
You can test that everything is working by accessing the path ```http://localhost:8300/health```. It will return an "Ok" in response with a status of "200".

## 5. Create a model
To create a model it is necessary to be in the root of the project and run the command:
```sh 
coyote-generate-model 
```
First you will be asked the name of the model you want to create, then it will ask you three simple questions: Name of a field, type of a field and if you want to add another field or not. If you answer yes, you will ask these three questions again, otherwise the process will end and the model will be generated.

##### Populate and Array contentType
As a little advanced setting, in case Array type is chosen, there will be one more question for the type of data it will contain, but if it is of type ObjectId then it will ask if you want to populate and when answering yes, it will ask for the name of the model to be referenced.

In the models, controllers and routes folders, the files necessary for the operation of the model will be created and you can test this by accessing the path ```http://localhost:8300/{model-name}/all``` which will return an empty array since no records have been added to the database yet.

In the named file of your model inside the routes folder you will see the endpoints that you can use for your newly created model.

## 6. Usage
Once the model is created, in the routes folder you can find the file pertinent to that model and in it there will be a set of basic endpoints:
```javascript 
router.post('/model/add', userCtrl.add) //add a record
router.get('/model/id/:id', userCtrl.selectById) //get a single record by id
router.get('/model/list', userCtrl.selectByQuery) //get records by the specific fields
router.put('/model/update', userCtrl.update) //update a record
```
##### 6.1 add method
This post method receives a json object with the fields relevant to your model except for the id, which will be automatically created by mongodb and will return the document created.
##### 6.2 id/:id method
This get method returns a specific document whose _id attribute is equal to the parameter indicated in the endpoint like this ```http://localhost:8300/{model-name}/id/5fee03c6abb36e710eef9236```.
##### 6.3 list method
This get method returns all the documents whose attributes match the parameters indicated in the endpoint as query like this ```http://localhost:8300/select?phone=96254687&age=30```. If the parameter is called name, then the search will make a comparison that contains a string like its assigned value, that is, a regex query.
##### 6.4 update method
This post method receives a json object that requires the attributes of a specific document (indicated through the _id attribute of the same object) that will be modified and will return the modified document.

## 7 Authentication
With **COYOTE-CLI** it is also possible to generate a simple authentication module with their respective controllers and routes using token and refresh-token. 

You just have to run the command ```coyote-generate-auth``` and it will automatically generate two ```auth.js``` files in controllers and routes. However, **COYOTE-CLI** does not generate a database, so a little configuration will be necessary. If you have **followed the instructions correctly** so far you will only have given a name to the database that you will use, well it is time to create it with only two collections in it as follows:

* Create the roles collection with the pairs ```{ "name": "role_name", "permissions": ["/user", "/role"], "created": your_date, "status": true }```. In ```role_name``` and ```your_date``` you can put the name you want to give to your role and the date you are creating it respectively.

* Once the previous collection is created, a field ```_id``` with its value will be returned, which it will use in the creation of the users collection like this: ```{ "username": "your_username", "email": "your_email", "password": "$2b$10$PR4fJwSikVx8F/eDs9Tv7uV7Vuf/DosvaY.ogf7XazBPuGi6SfsGi", "role": "_id field of role", "created": "your_date", "status": true }``` Again, ```your_username```, ```your_email``` and ```your_date``` they will carry the values ​​you want to place but the ```password``` value is a hash of the string "123456" that you will use as the initial password and that you can then update as you like.

Once this is done, it is possible to test the authentication functionality using Postman or whatever your preferred tool is:

* In the path ```http://localhost:8300/auth/login```, you must send the JSON ```{ "username": "username or email", "password": "123456" }``` in the body of the request using the POST method. This will return two JSONs, one contains the ```token``` with the user's information and a ```refreshToken``` to be able to generate a token again in case it has expired (remember that this functionality of the refreshToken must be configured to be done automatically from a fronend via the ```/auth/refresh``` path).

* The duration time of the ```token``` and the ```refreshToken``` are 15 minutes and 16 hours respectively.

## 8 Note
If you already have a project created or you don't like the base structure created through the ```coyote-generate-project``` command, just by having the src folder in the root of your project and within it the folders controllers, models and routes, then your model can be added to your project with the command ```coyote-generate-model``` and then you just have to change the path where you specify the connection to mongodb, indicated in the first line of the model file.