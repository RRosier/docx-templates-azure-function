FROM mcr.microsoft.com/azure-functions/node:3.0

EXPOSE 7071 5858
ENV AzureWebJobsScriptRoot=/home/site/azfnode \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

VOLUME /home/dev/azfnode
WORKDIR /home/dev/azfnode

RUN npm i -g azure-functions-core-tools@3 --unsafe-perm true

RUN cd /home/dev/azfnode

CMD /bin/bash