cp /home/$1/.ssh/authorized_keys /home/$1/.ssh/authorized_keys.bak
echo $2 | tr '|' '\n' > /home/$1/.ssh/authorized_keys