#!/bin/bash
# Disable SSL requirement on master realm for local development
echo "Configuring Keycloak master realm..."

/opt/keycloak/bin/kcadm.sh config credentials \
  --server http://keycloak:8080 \
  --realm master \
  --user "$KEYCLOAK_ADMIN" \
  --password "$KEYCLOAK_ADMIN_PASSWORD"

/opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE

echo "Done — SSL requirement disabled on master realm."
