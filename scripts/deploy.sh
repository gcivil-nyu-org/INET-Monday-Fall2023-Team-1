#!/bin/sh

ROOT_DIR=$(git rev-parse --show-toplevel)
GIT_COMMIT_SHORT_HASH=$(git rev-parse --short HEAD)
GIT_COMMIT_HASH=$(git rev-parse HEAD)

cd $ROOT_DIR/furbaby/furbaby

sed -i "s/GIT_COMMIT_SHORT_HASH=.*/GIT_COMMIT_SHORT_HASH=$GIT_COMMIT_SHORT_HASH/g" .env
sed -i "s/GIT_COMMIT_HASH=.*/GIT_COMMIT_HASH=$GIT_COMMIT_HASH/g" .env

# cd $ROOT_DIR/furbaby

# eb deploy
