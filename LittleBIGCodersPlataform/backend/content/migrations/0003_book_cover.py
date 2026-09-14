from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('content', '0002_knowledge_areas')]

    operations = [
        migrations.AddField(
            model_name='book',
            name='cover',
            field=models.FileField(blank=True, upload_to='book_covers/'),
        ),
    ]
