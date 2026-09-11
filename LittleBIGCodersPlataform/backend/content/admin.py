from django.contrib import admin

from .models import Book, BookAccess, Chapter, Material, KnowledgeArea, DidacticSequence

for model in [Book, BookAccess, Chapter, Material, KnowledgeArea, DidacticSequence]:
    admin.site.register(model)
