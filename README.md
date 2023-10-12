# Team Project repo

### Connect with Postgres on RDS

Ask me for the password. (@kolharsam)

```sh

$ psql --host=awseb-e-n3h4ykpptm-stack-awsebrdsdatabase-5tlrcwj3rs0l.ckzyhv20mvw0.us-east-1.rds.amazonaws.com --port=5432 --username=root --password --dbname=ebdb

```

make sure you have the `postgresql@14` suite of tools installed.

Or you could use tools like PopSQL and/or pgAdmin.

### Running the app & deploying.

```sh

$ python3 -m venv myvenv

$ eb init

$ eb create "<YOUR_NAME>-furbaby-dev"

$ eb deploy

```

### How to setup a pre-commit hook

NOTE: All of the steps down below are assuming that you're in the root dir. of the repository.

- create a file called `pre-commit`

```sh

$ touch ./.git/hooks/pre-commit

```

- add the following code to it:

you can use `vim` or `nano` (preferred) to add the code

```sh

#!/bin/sh

ROOT_DIR=$(git rev-parse --show-toplevel)
source $ROOT_DIR/myvenv/bin/activate

black . # this is the code formatter (very opinionated)
# pylint --load-plugins=pylint_django 
# ^ this part isn't working for python3 and django v4
# (I'm still looking for solutions)
pylint $ROOT_DIR/furbaby/furbaby/
# we'll need to keep adding all of the modules that we
# want linted to the command above

deactivate

```

- make the `pre-commit` file executable

```sh

$ chmod +x ./.git/hooks/pre-commit

```

- start making your commits! ✌️
