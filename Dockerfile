FROM registry-proxy.engineering.redhat.com/rh-osbs/rhacm2-yarn-builder@sha256:358503f9e81c93efe873c9cf43aa30a5f5666724a600469e24c3609c44ffa482 AS BUILD_IMAGE

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
RUN yarn install  --network-timeout 1000000

## Build application
RUN yarn build

FROM registry.access.redhat.com/ubi8/nodejs-16-minimal@sha256:ec28f2f7e9927e4c1e9937ef08015e1befdf6cf9e1fcfa4cfb85e92e355f8b70

USER 1001

WORKDIR /app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /usr/src/app/http-server.sh ./http-server.sh

ENTRYPOINT [ "./http-server.sh", "./dist" ]

## Labels
LABEL name="amq-broker-7/amq-broker-712-self-provisioning-plugin-rhel8"
LABEL description="Red Hat AMQ 7.12 Self Provisioning Plugin"
LABEL maintainer="Roderick Kieley <rkieley@redhat.com>"
LABEL version="7.12.0"
LABEL summary="Red Hat AMQ 7.12 Self Provisioning Plugin"
LABEL amq.broker.version="7.12.0.SPP.1.ER1"
LABEL com.redhat.component="amq-broker-self-provisioning-plugin-rhel8-container"
LABEL io.k8s.display-name="Red Hat AMQ SPP.1 Self Provisioning Plugin"
LABEL io.openshift.tags="messaging,amq,integration"
