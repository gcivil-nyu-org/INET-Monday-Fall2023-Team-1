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
