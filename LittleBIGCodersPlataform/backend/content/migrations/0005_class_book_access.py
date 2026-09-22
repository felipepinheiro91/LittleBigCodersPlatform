import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0001_initial'), ('content', '0004_book_cover_base64')]

    operations = [
        migrations.CreateModel(
            name='ClassBookAccess',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('valid_from', models.DateField()),
                ('valid_until', models.DateField()),
                ('active', models.BooleanField(default=True)),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='class_accesses', to='content.book')),
                ('class_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='book_accesses', to='accounts.class')),
            ],
            options={'constraints': [
                models.UniqueConstraint(fields=('class_group', 'book'), name='unique_class_book_access'),
                models.CheckConstraint(condition=models.Q(valid_until__gte=models.F('valid_from')), name='class_access_valid_dates'),
            ]},
        ),
    ]
