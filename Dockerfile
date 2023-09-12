FROM registry.access.redhat.com/ubi8/nodejs-16@sha256:3116913de59e6d17e40282a7924104ef835a1868cc142dd6cbb0d93f6b268bb1 AS BUILD_IMAGE

### BEGIN REMOTE SOURCE
# Use the COPY instruction only inside the REMOTE SOURCE block
# Use the COPY instruction only to copy files to the container path $REMOTE_SOURCE_DIR/app
ARG REMOTE_SOURCE_DIR=/tmp/remote_source
RUN mkdir -p $REMOTE_SOURCE_DIR/app
WORKDIR $REMOTE_SOURCE_DIR/app
# Copy package.json and yarn.lock to the container
COPY package.json package.json
COPY yarn.lock yarn.lock
### END REMOTE SOURCE

USER root
RUN command -v yarn || npm i -g yarn

## Set directory
ADD . /usr/src/app
WORKDIR /usr/src/app

## Install dependencies
RUN yarn install  --network-timeout 1000000

## Build application
RUN yarn build

FROM registry.access.redhat.com/ubi8/nodejs-16-minimal@sha256:705f349314ffdf2e62e2a800b4e7023cbd33dcb4934587d143c8a6cd0986f400@sha256:705f349314ffdf2e62e2a800b4e7023cbd33dcb4934587d143c8a6cd0986f400@sha256:705f349314ffdf2e62e2a800b4e7023cbd33dcb4934587d143c8a6cd0986f400@sha256:705f349314ffdf2e62e2a800b4e7023cbd33dcb4934587d143c8a6cd0986f400@sha256:705f349314ffdf2e62e2a800b4e7023cbd33dcb4934587d143c8a6cd0986f400

USER 1001

WORKDIR /app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /usr/src/app/http-server.sh ./http-server.sh

ENTRYPOINT [ "./http-server.sh", "./dist" ]

## Labels
LABEL name="amq-broker-7/amq-broker-712-self-provisioning-plugin-rhel8"
LABEL description="Red Hat AMQ 7.12 Self Provisioning Plugin"
LABEL maintainer="Ajay Pratap <apratap@redhat.com>"
LABEL version="7.12.0"
LABEL summary="Red Hat AMQ 7.12 Self Provisioning Plugin"
LABEL amq.broker.version="7.12.0.SPP.1.ER1"
LABEL com.redhat.component="amq-broker-self-provisioning-plugin-rhel8-container"
LABEL io.k8s.display-name="Red Hat AMQ SPP.1 Self Provisioning Plugin"
LABEL io.openshift.tags="messaging,amq,integration"
