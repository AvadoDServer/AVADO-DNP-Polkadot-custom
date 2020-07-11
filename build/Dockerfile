# # ==== POLKADOT BUILD : FIRST STAGE ====
# FROM phusion/baseimage:0.10.2 as builder
# LABEL maintainer "chevdor@gmail.com"
# LABEL description="This is the build stage for Polkadot. Here we create the binary."

# ARG PROFILE=release

# RUN apt-get update && \
#     apt-get upgrade -y -o Dpkg::Options::="--force-confdef" && \
# 	apt-get install -y git cmake pkg-config libssl-dev git clang

# RUN git clone https://github.com/paritytech/polkadot.git && cd polkadot && git checkout tags/v0.8.13

# WORKDIR /polkadot

# RUN curl https://sh.rustup.rs -sSf | sh -s -- -y && \
#         export PATH=$PATH:$HOME/.cargo/bin && \
#         scripts/init.sh && \
#         cargo build --$PROFILE

# RUN ls -l /polkadot/target/

# ===== SECOND STAGE ======

# FROM chevdor/polkadot:0.6.15 as builder2
# RUN echo "polkadot fetched!"
# RUN ls -lR /usr/local/bin
FROM chevdor/polkadot:latest as builder

FROM node:12-alpine as builder-nodejs

WORKDIR /usr/src/monitor
COPY monitor .
RUN npm i

WORKDIR /usr/src/wizard
COPY wizard .
RUN rm -Rf   node_modules
RUN rm yarn.lock
RUN yarn add react-scripts 
RUN yarn 
# RUN ls -l node_modules
RUN yarn build


#FROM phusion/baseimage:0.10.2

FROM ubuntu:xenial
LABEL maintainer "chevdor@gmail.com"
LABEL description="This is the 2nd stage: a very small image where we copy the Polkadot binary."
ARG PROFILE=release
COPY --from=builder /usr/local/bin/polkadot /usr/local/bin
RUN ls -lR /usr/local/bin

#COPY --from=builder2 /usr/local/bin/polkadot /usr/local/bin

#COPY files/polkadot.sh /opt/polkadot.sh
#RUN chmod 755 /opt/polkadot.sh

COPY --from=builder-nodejs /usr/src/monitor /usr/monitor
COPY --from=builder-nodejs /usr/src/wizard/build /usr/www/wizard

RUN apt-get update && apt-get install -y curl supervisor nginx jq iputils-ping net-tools
RUN echo "install nodeJS"

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

RUN echo "done install nodeJS"

RUN curl -L -o /tmp/zerotier-install.sh https://install.zerotier.com/ && bash /tmp/zerotier-install.sh || exit 0

COPY files/supervisord.conf /etc/supervisord.conf
COPY files/start.sh /opt/start.sh
RUN chmod 755 /opt/start.sh

## FOR SIM ONLY
#COPY files/polkadotsim.sh /opt/polkadotsim.sh
#RUN chmod 755 /opt/polkadotsim.sh

COPY files/testservice.sh /opt/testservice.sh
RUN chmod 755 /opt/testservice.sh
## // 

# create nginx user
RUN adduser --disabled-password --gecos '' nginx

COPY files/nginx.conf /etc/nginx/nginx.conf


RUN chmod +x /opt/start.sh && \
    mv /usr/share/ca* /tmp && \
	#rm -rf /usr/share/*  && \
	mv /tmp/ca-certificates /usr/share/ && \
	#rm -rf /usr/lib/python* && \
	useradd -m -u 1001 -U -s /bin/sh -d /polkadot polkadot && \
	mkdir -p /polkadot/.local/share/polkadot && \
	chown -R polkadot:polkadot /polkadot/.local && \
	ln -s /polkadot/.local/share/polkadot /data && \
	echo "done..."
    # rm -rf /usr/bin /usr/sbin

#USER polkadot
EXPOSE 30333 9933 9944 3000 82
VOLUME ["/polkadot-data"]
VOLUME ["/zt-data"]

ENTRYPOINT ["/opt/start.sh"]
