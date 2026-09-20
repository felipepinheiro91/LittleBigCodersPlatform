import base64
from io import BytesIO

from django.core.files.storage import default_storage
from django.db import migrations, models
from PIL import Image


def convert_covers(apps, schema_editor):
    Book = apps.get_model('content', 'Book')
    for book in Book.objects.using(schema_editor.connection.alias).exclude(cover='').iterator():
        if book.cover.startswith('data:image/'):
            continue
        with default_storage.open(book.cover, 'rb') as source:
            contents = source.read(5 * 1024 * 1024 + 1)
        if len(contents) > 5 * 1024 * 1024:
            raise ValueError(f'A capa do livro {book.pk} excede 5 MB.')
        with Image.open(BytesIO(contents)) as picture:
            mime_type = Image.MIME.get(picture.format)
            picture.verify()
        if mime_type not in ['image/jpeg', 'image/png', 'image/webp']:
            raise ValueError(f'A capa do livro {book.pk} possui formato inválido.')
        book.cover = f'data:{mime_type};base64,{base64.b64encode(contents).decode("ascii")}'
        book.save(update_fields=['cover'])


class Migration(migrations.Migration):
    dependencies = [('content', '0003_book_cover')]
    operations = [
        migrations.AlterField(model_name='book', name='cover', field=models.TextField(blank=True)),
        migrations.RunPython(convert_covers),
    ]
