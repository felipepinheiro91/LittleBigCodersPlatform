from django.db import migrations, models


def copy_chapters(apps, schema_editor):
    material_model = apps.get_model('content', 'Material')
    relation = material_model.chapters.through
    database = schema_editor.connection.alias
    for material in material_model.objects.using(database).all().iterator():
        relation.objects.using(database).create(material_id=material.pk, chapter_id=material.chapter_id)


class Migration(migrations.Migration):
    dependencies = [('content', '0005_class_book_access')]

    operations = [
        migrations.AddField(
            model_name='material', name='chapters',
            field=models.ManyToManyField(blank=True, related_name='materials', to='content.chapter'),
        ),
        migrations.RunPython(copy_chapters),
        migrations.RemoveField(model_name='material', name='chapter'),
    ]
