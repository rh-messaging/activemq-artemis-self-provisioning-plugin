#!/usr/bin/env sh

TLS_ENABLED="true"
DEFAULT_IMAGE=registry.redhat.io/amq-broker-7/amq-broker-713-self-provisioning-plugin-rhel9@sha256:ee1ac8587bcc56766565a05110febafffd3b8bc0940eaac38407829d7f501685
PLUGIN_IMAGE=${DEFAULT_IMAGE}

SCRIPT_NAME=$(basename "$0")

function printUsage() {
  echo "${SCRIPT_NAME}: Deploying plugin to openshift"
  echo "Usage:"
  echo "  ./${SCRIPT_NAME} -i|--image <image url> -n|--nossl"
  echo "Options: "
  echo "  -i|--image  Specify the plugin image to deploy. (default is ${DEFAULT_IMAGE})"
  echo "  -n|--nossl  Use plain http protocol (default is https)"
  echo "  -h|--help   Print this message."
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      printUsage
      exit 0
      ;;
    -i|--image)
      PLUGIN_IMAGE="$2"
      shift
      shift
      ;;
    -n|--nossl)
      TLS_ENABLED="false"
      shift # past argument
      ;;
    -*|--*)
      echo "Unknown option $1"
      printUsage
      exit 1
      ;;
    *)
      ;;
  esac
done

if [ ${TLS_ENABLED} == "true" ]; then
  echo "deploying plugin in https mode using image: ${PLUGIN_IMAGE}"
  oc kustomize deploy/base | sed "s|image: .*|image: ${PLUGIN_IMAGE}|" | oc apply -f -
else
  echo "deploying plugin in http mode using image: ${PLUGIN_IMAGE}"
  oc kustomize deploy/http | sed "s|image: .*|image: ${PLUGIN_IMAGE}|" | oc apply -f -
fi

oc patch consoles.operator.openshift.io cluster --type=json --patch '[{ "op": "add", "path": "/spec/plugins/-", "value": "activemq-artemis-self-provisioning-plugin" }]'
