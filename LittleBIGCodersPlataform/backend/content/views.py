from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .access import visible_books, query_id
from .models import Chapter, Material, DidacticSequence
from .serializers import BookSerializer, ChapterSerializer, MaterialSerializer, SequenceSerializer


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookSerializer

    def get_queryset(self):
        return visible_books(self.request.user, current=False).order_by('id')


class ChapterViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChapterSerializer

    def get_queryset(self):
        chapters = Chapter.objects.filter(book__in=visible_books(self.request.user))
        if self.request.query_params.get('book'):
            chapters = chapters.filter(book_id=query_id(self.request, 'book'))
        return chapters


class MaterialViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MaterialSerializer

    def get_queryset(self):
        materials = Material.objects.filter(chapter__book__in=visible_books(self.request.user)).order_by('id')
        if self.request.user.role == 'student':
            materials = materials.filter(teacher_only=False).exclude(type='answer_key')
        if self.request.query_params.get('chapter'):
            materials = materials.filter(chapter_id=query_id(self.request, 'chapter'))
        return materials


class SequenceViewSet(viewsets.ModelViewSet):
    serializer_class = SequenceSerializer

    def get_queryset(self):
        user = self.request.user
        sequences = DidacticSequence.objects.filter(chapter__book__in=visible_books(user))
        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            sequences = sequences.filter(Q(teacher=user.teacher_profile) | Q(teacher=None))
        elif user.role != 'admin':
            return sequences.none()
        if self.request.query_params.get('chapter'):
            sequences = sequences.filter(chapter_id=query_id(self.request, 'chapter'))
        return sequences.order_by('id')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'admin':
            serializer.save(teacher=None)
        elif user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            serializer.save(teacher=user.teacher_profile)
        else:
            raise PermissionDenied()

    def check_edit(self, sequence):
        if self.request.user.role != 'admin' and sequence.teacher_id != getattr(getattr(self.request.user, 'teacher_profile', None), 'id', None):
            raise PermissionDenied('Copie a sugestão antes de editar.')

    def perform_update(self, serializer):
        self.check_edit(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance):
        self.check_edit(instance)
        instance.delete()

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        source = self.get_object()
        if request.user.role != 'teacher' or not hasattr(request.user, 'teacher_profile'):
            raise PermissionDenied()
        source_id = source.pk
        source.pk = None
        source.parent_id = source_id
        source.teacher = request.user.teacher_profile
        source.save()
        return Response(self.get_serializer(source).data, status=201)
