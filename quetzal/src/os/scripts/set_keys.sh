if [ ! -f "/home/$1/.ssh/authorized_keys" ]; then
  if [ ! -d "/home/$1/.ssh" ]; then
    mkdir /home/$1/.ssh
  fi

  touch /home/$1/.ssh/authorized_keys
  chmod -R 700 /home/$1/.ssh
  chown -R $1:$1 /home/$1/.ssh
fi

cp /home/$1/.ssh/authorized_keys /home/$1/.ssh/authorized_keys.bak
echo $2 | tr '|' '\n' > /home/$1/.ssh/authorized_keys