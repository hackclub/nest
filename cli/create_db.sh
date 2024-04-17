#!/bin/bash

# "who am i" responds correctly even with sudo
NEST_USER=$(who am i | awk '{print $1}')

NAME="${NEST_USER}_$1"

createdb -O $NEST_USER "$NAME"

echo $'Postgres database "$NAME" created successfully!'