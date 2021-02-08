## Coyote-cli
Coyote-cli is a tool created to generate the necessary files of a basic project based on **Node js** and **mongodb** as a database. With just a couple of tweaks you can save yourself a couple of hours of work creating rest api.

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
router.get('/model/all', userCtrl.all) //get all records
router.get('/model/list', userCtrl.list) //get all active records
router.get('/model/id/:id', userCtrl.selectById) //get a single record by id
router.get('/model/select', userCtrl.selectByQuery) //get records by the specific fields
router.put('/model/update', userCtrl.update) //update a record
```
##### 6.1 add method
This post method receives a json object with the fields relevant to your model except for the id, which will be automatically created by mongodb and will return the document created.
##### 6.2 all method
This get method will return a list with all the records of your model.
##### 6.3 list method
This get method will return a list with all the records of your model whose status attribute is true.
##### 6.4 id/:id method
This get method returns a specific document whose _id attribute is equal to the parameter indicated in the endpoint like this ```http://localhost:8300/{model-name}/id/5fee03c6abb36e710eef9236```.
##### 6.5 select method
This get method returns all the documents whose attributes match the parameters indicated in the endpoint as query like this ```http://localhost:8300/select?phone=96254687&age=30```. If the parameter is called name, then the search will make a comparison that contains a string like its assigned value, that is, a regex query.
##### 6.6 update method
This post method receives a json object that requires the attributes of a specific document (indicated through the _id attribute of the same object) that will be modified and will return the modified document.

## 7 Note
If you already have a project created or you don't like the base structure created through the ```coyote-generate-project``` command, just by having the src folder in the root of your project and within it the folders controllers, models and routes, then your model can be added to your project with the command ```coyote-generate-model``` and then you just have to change the path where you specify the connection to mongodb, indicated in the first line of the model file.