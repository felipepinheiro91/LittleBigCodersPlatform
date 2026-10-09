from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('quizzes', '0001_initial')]
    operations = [
        migrations.AddField(model_name='question', name='image', field=models.TextField(blank=True)),
        migrations.AddField(model_name='question', name='image_description', field=models.CharField(blank=True, max_length=255)),
    ]
