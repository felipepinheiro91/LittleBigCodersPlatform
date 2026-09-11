from django.db import migrations


def populate_areas(apps, schema_editor):
    area_model = apps.get_model('content', 'KnowledgeArea')
    for name in ['Pensamento computacional', 'Informática', 'Programação', 'Eletrônica', 'Robótica', 'Inteligência artificial', 'Ética', 'Criação de sites', 'Desenvolvimento de jogos e animações']:
        area_model.objects.get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [('content', '0001_initial')]
    operations = [migrations.RunPython(populate_areas, migrations.RunPython.noop)]
