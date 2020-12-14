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
├──  .env
├──  .gitignore
└── src
   ├── config
   ├── controllers
   ├── models
   ├── modules
   └── routes
```

### 3. Installation
Now go to the root of the newly created project, where you must run the command:
```sh 
npm install 
```
This will download the dependencies necessary for the operation of the project.
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

In the models, controllers and routes folders, the files necessary for the operation of the model will be created and you can test this by accessing the path ```http://localhost:8300/{model-name}/all``` which will return an empty array since no records have been added to the database yet.

In the named file of your model inside the routes folder you will see the endpoints that you can use for your newly created model.