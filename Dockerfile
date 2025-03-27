FROM registry-proxy.engineering.redhat.com/rh-osbs/rhacm2-yarn-builder@sha256:4f578a4e083bedd7467643b26bedf284f2d1062ed22416662d3556a3f4482cb1 AS build-image

### BEGIN REMOTE SOURCE
# Use the COPY instruction only inside the REMOTE SOURCE block
# Use the COPY instruction only to copy files to the container path $REMOTE_SOURCES_DIR/activemq-artemis-self-provisioning-plugin/app
ARG REMOTE_SOURCES_DIR=/tmp/remote_source
RUN mkdir -p $REMOTE_SOURCES_DIR/activemq-artemis-self-provisioning-plugin/app
WORKDIR $REMOTE_SOURCES_DIR/activemq-artemis-self-provisioning-plugin/app
# Copy package.json and yarn.lock to the container
COPY package.json package.json
COPY yarn.lock yarn.lock
ADD . $REMOTE_SOURCES_DIR/activemq-artemis-self-provisioning-plugin/app
RUN command -v yarn || npm i -g yarn
### END REMOTE SOURCE

USER root

## Set directory
RUN mkdir -p /usr/src/
RUN cp -r $REMOTE_SOURCES_DIR/activemq-artemis-self-provisioning-plugin/app /usr/src/
WORKDIR /usr/src/app

## Install dependencies
RUN yarn install --network-timeout 1000000

## Build application
RUN yarn build

FROM registry.access.redhat.com/ubi9/nginx-122:latest

COPY --from=build-image /usr/src/app/dist /usr/share/nginx/html

USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]

## Labels
LABEL name="amq-broker-7/amq-broker-713-self-provisioning-plugin-rhel9"
LABEL description="Red Hat AMQ 7.13.0 Self Provisioning Plugin"
LABEL maintainer="Roderick Kieley <rkieley@redhat.com>"
LABEL version="7.13.0"
LABEL summary="Red Hat AMQ 7.13.0 Self Provisioning Plugin"
LABEL amq.broker.version="7.13.0.SPP.1.SR1"
LABEL com.redhat.component="amq-broker-self-provisioning-plugin-rhel9-container"
LABEL io.k8s.display-name="Red Hat AMQ 7.13.0 Self Provisioning Plugin"
LABEL io.openshift.tags="messaging,amq,integration"
