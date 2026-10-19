from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('quizzes', '0002_question_image')]
    operations = [
        migrations.AlterField(model_name='alternative', name='text', field=models.TextField(blank=True)),
        migrations.AddField(model_name='alternative', name='image', field=models.TextField(blank=True)),
        migrations.AddField(model_name='alternative', name='image_description', field=models.CharField(blank=True, max_length=255)),
    ]
