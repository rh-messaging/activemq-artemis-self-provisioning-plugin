FROM registry-proxy.engineering.redhat.com/rh-osbs/rhacm2-yarn-builder@sha256:950ef036f557f1a6ce47f7f1ce4dfc1ad4c0c471c5475b05a9c2ea8f5e1aae50 AS build-image

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

FROM registry.access.redhat.com/ubi9/nginx-122@sha256:ced26d49e66a16f5dceb7f015cb5babd258c66f249f806de7f721f242e9e5e63

USER root

## Upgrade packages
RUN dnf update -y --setopt=install_weak_deps=0 && rm -rf /var/cache/yum

COPY --from=build-image /usr/src/app/dist /usr/share/nginx/html


USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]

## Labels
LABEL name="amq-broker-7/amq-broker-7x-self-provisioning-plugin-rhel9"
LABEL description="Red Hat AMQ 7.x.x Self Provisioning Plugin"
LABEL maintainer="Roderick Kieley <rkieley@redhat.com>"
LABEL version="7.x.x"
LABEL summary="Red Hat AMQ 7.x.x Self Provisioning Plugin"
LABEL amq.broker.version="7.x.x.OPR.1.SR1"
LABEL com.redhat.component="amq-broker-self-provisioning-plugin-rhel9-container"
LABEL io.k8s.display-name="Red Hat AMQ 7.x.x Self Provisioning Plugin"
LABEL io.openshift.tags="messaging,amq,integration"
