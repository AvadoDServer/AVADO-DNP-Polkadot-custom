FROM chevdor/polkadot:latest as builder

# build image for monitor & wizard
FROM node:12-alpine as builder-nodejs

# build wizard
WORKDIR /usr/src/wizard
COPY wizard .
RUN rm -Rf   node_modules
RUN rm yarn.lock
RUN yarn add react-scripts 
RUN yarn 
# RUN ls -l node_modules
RUN yarn build

# build monitor
WORKDIR /usr/src/monitor
COPY monitor .
RUN npm i



# final image
FROM ubuntu

RUN apt update && \ 
    apt install -y ca-certificates nginx gnupg2 curl nodejs jq iputils-ping net-tools supervisor && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/bin/polkadot /usr/local/bin
RUN ls -lR /usr/local/bin

COPY --from=builder-nodejs /usr/src/monitor /usr/monitor
COPY --from=builder-nodejs /usr/src/wizard/build /usr/www/wizard

RUN curl -L -o /tmp/zerotier-install.sh https://install.zerotier.com/ && bash /tmp/zerotier-install.sh

RUN echo "ZT installed... "
RUN ls -l /usr/sbin/

COPY files/supervisord.conf /etc/supervisord.conf
COPY files/start.sh /opt/start.sh
RUN chmod 755 /opt/start.sh

COPY files/testservice.sh /opt/testservice.sh
RUN chmod 755 /opt/testservice.sh

COPY files/standalone.sh /opt/standalone.sh
RUN chmod 755 /opt/standalone.sh

# create nginx user
RUN adduser --disabled-password --gecos '' nginx

COPY files/nginx.conf /etc/nginx/nginx.conf

RUN chmod +x /opt/start.sh && \
    mv /usr/share/ca* /tmp && \
	mv /tmp/ca-certificates /usr/share/ && \
	useradd -m -u 1001 -U -s /bin/sh -d /polkadot polkadot && \
	mkdir -p /polkadot/.local/share/polkadot && \
	chown -R polkadot:polkadot /polkadot/.local && \
	ln -s /polkadot/.local/share/polkadot /data && \
	echo "done..."

ENTRYPOINT ["/opt/start.sh"]