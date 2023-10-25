# Generated by Django 4.0 on 2023-10-20 15:07

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_alter_applications_id_alter_jobs_id_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            """
            ALTER TABLE api_users ALTER COLUMN user_type DROP DEFAULT;
            ALTER TABLE api_users ALTER COLUMN user_type TYPE user_feature_access_type[] using user_type::user_feature_access_type[];
            ALTER TABLE api_users ALTER user_type set default '{}';
                              
            ALTER TABLE api_jobs ALTER COLUMN status TYPE job_status using status::job_status;
                 
            ALTER TABLE api_applications ALTER COLUMN status TYPE application_status using status::application_status;
        """
        )
    ]