if [! -f "/home/$1/.ssh/authorized_keys" ]; then
  if [ ! -d "/home/$1/.ssh" ]; then
    mkdir /home/$1/.ssh
  fi

  touch /home/$1/.ssh/authorized_keys
fi

cat /home/$1/.ssh/authorized_keys