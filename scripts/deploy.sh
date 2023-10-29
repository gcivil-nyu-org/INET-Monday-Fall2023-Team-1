#!/bin/sh

ROOT_DIR=$(git rev-parse --show-toplevel)
export GIT_COMMIT_SHORT_HASH=$(git rev-parse --short HEAD)
export GIT_COMMIT_HASH=$(git rev-parse HEAD)

eb deploy
