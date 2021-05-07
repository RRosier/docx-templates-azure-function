# Azure Function docx-templates
Many applications have the requirement of generating Word (docx) files based on a template.\
Based on the technology your application is using, there are a number of commercial or open-source solutions available.

I really liked [docx-templates](https://github.com/guigrpa/docx-templates), a Node (Javascript) based libary that supports GraphQL and other synax.\
To make our template-generation unified across the various applications and technologies, I created this Azure Function.

For now, we only support plain json-serialized objects as data.

## Publish the Azure Function
You need to create your own Azure Function and deploy the code to it.

Please refere to these steps to set-up your Azure environment.\
[Create Azure resources](https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-node?tabs=azure-cli%2Cbrowser#create-supporting-azure-resources-for-your-function)

Once you created your function app, navigate to the function source code and restore packages.
```console
cd ./Src/Function
npm install
```
And publish the function to your created Azure app.
```console
func azure functionapp publish <APP_NAME>
```

## Usage
The function takes a POST request with a [multipart content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST#example).
* first part is the serialized json object with data to map
* second part is the word document template

### Example request
Here's an example of a request message.
```
POST /api/docx HTTP/1.1
Host: {my-host}
Content-Type: Content-Type: multipart/form-data;boundary=myMultipartBoundary

--myMultipartBoundary
Content-Disposition: form-data
Content-Type: application/json

{
   "name": "John Smith",
   "email": "john.smith@contoso.com"
}
--myMultipartBoundary
Content-Disposition: file; fileName="template.docx"
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document

{binary-content-of-file}
--myMultipartBoundary--
```

### Example applications
You can see some example applications in various technologies in the [ClientExamples](./src/ClientExamples) folder.

Check-out the source and run the examples using your deployed Azure Function.

## Build and local development
You're welcome to check-out the source and modify it to your wishes before creating your own Azure Function.
I would like to refere to following Microsoft Doc in order to set-up and pre-configure your local environment.
[Create a function on Linux using a custom container](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-function-linux-custom-image?tabs=bash%2Cportal&pivots=programming-language-javascript)

Azure functions does not support all [Node versions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2#node-version).\
Therefore I created a [Docker file](Dockerfile) that allows you to run and test your local source code in a Docker environment with Node 14.

```powershell
# build a docker image from the docker file
docker build --tag azfnode:dev ./Src/Function

# create a container from the image.
# map your local source directory to the /home/dev/azfnode directory in docker
# map the 7071 (default port used by func start) and the 5858 (for debugging) ports.
docker create -it --name azfnode-docx -v /c/development/projects/github/docx-templates-azure-function/Src/Function:/home/dev/azfnode -p 7071:7071 -p 5858:5858 azfnode:dev

# start the docker image
docker start azfnode-docx

# login to the docker's bash
docker exec -it azfnode-docx bash

# restore packages (first time) and run the local function in the container bash
root@0a8c9387ce87:~/dev/azfnode# npm install
root@0a8c9387ce87:~/dev/azfnode# func start
```

## Debug function
You can debug your function by running the function, passing in the inspect option to listen on a specific port (5858).
```powershell
root@0a8c9387ce87:~/dev/azfnode# func start --language-worker -- "--inspect:0.0.0.0:5858"
```
Then press `F5` in Visual Code to attach the debugger.\
Unfortunatly, breakpoints set in my local source were not hit.\
I had to add `debugger;` in my javascript file to stop in the source code.
