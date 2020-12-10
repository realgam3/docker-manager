FROM node:12.18-stretch-slim

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Copy app
COPY . /app/
COPY docker.png index.js package.json /app/

RUN apt-get update && apt-get install -y openssh-server curl
RUN mkdir /var/run/sshd
RUN ssh-keygen -t rsa -b 4096 -f ssh_host_rsa_key

# Install packages
RUN npm install -g forever
RUN npm install

# Set non root user
RUN useradd -c 'BSidesTLV' -m -d /home/bsidestlv -s /app/index.js bsidestlv
RUN chown -R bsidestlv:bsidestlv /home/bsidestlv
RUN chmod -R 555 /home/bsidestlv
RUN chmod -R 775 /tmp /var/tmp /var/lock /run/lock

RUN ln -s /app/socket/docker.sock /var/run/docker.sock
RUN echo 'bsidestlv:d0ck3rm4n4g3r' | chpasswd
RUN chmod +x /app/index.js
RUN chmod go-rx /usr/bin/passwd

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd
RUN sed 's@Subsystem\s*sftp@# Subsystem       sftp@g' -i /etc/ssh/sshd_config

ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile

EXPOSE 22
CMD ["/usr/sbin/sshd", "-D", "-e"]

