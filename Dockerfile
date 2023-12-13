# syntax=docker/dockerfile:1

ARG NODE_VERSION=21.3.0
FROM node:${NODE_VERSION}-alpine as base
ARG DIR=/usr/src/app
WORKDIR ${DIR}

FROM base as build
COPY yarn.lock package.json tsconfig.json .yarnrc.yml ./
COPY src src
COPY .yarn .yarn
RUN yarn install --immutable && yarn build && yarn workspaces focus --production

FROM base as runtime
USER node
COPY package.json  .
COPY --from=build ${DIR}/build build
COPY --from=build ${DIR}/node_modules node_modules
CMD yarn start