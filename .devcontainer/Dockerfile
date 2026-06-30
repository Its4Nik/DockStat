FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

USER root

RUN apt-get update && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        wget \
        unzip \
        vim \
        build-essential \
        python3 \
        python3-pip \
        software-properties-common && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

USER vscode

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

ENV BUN_INSTALL=/home/vscode/.bun
ENV PATH=${BUN_INSTALL}/bin:${PATH}

# Install global tooling
RUN bun install -g \
    @biomejs/biome@latest \
    turbo \
    typescript

WORKDIR /workspaces

EXPOSE 3000 4000 4040 8080 8181 9090
