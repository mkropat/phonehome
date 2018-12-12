FROM debian:stretch

MAINTAINER Michael Kropat <mail@michael.kropat.name>

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

COPY . /opt/phonehome

RUN (cd /opt/phonehome; npm install)

EXPOSE 80
CMD ["/usr/bin/nodejs", "/opt/phonehome/index.js"]
