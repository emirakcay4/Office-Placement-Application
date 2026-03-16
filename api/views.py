"""
API Views for the OPA (Office Placement Application).

SCRUM-21: OfficeSearchView — search & filter offices by room_number,
          building, office_type. Supports filtering by available capacity.
SCRUM-22: OfficeDetailView — retrieve full details for a single office,
          including current occupants, IT equipment, and capacity status.
SCRUM-23: ModelViewSets for basic CRUD on all entities.
"""

from django.db.models import Count, Q, F
from rest_framework import generics, viewsets, filters
from rest_framework.permissions import AllowAny

from .models import Department, Building, Office, Staff, ITEquipment, OfficeAssignment
from .serializers import (
    DepartmentSerializer,
    BuildingSerializer,
    StaffSerializer,
    ITEquipmentSerializer,
    OfficeAssignmentSerializer,
    OfficeListSerializer,
    OfficeDetailSerializer,
)
from .permissions import IsAdminOrReadOnly


# ──────────────────────────────────────────────────────────────
# SCRUM-21: Office Search & Filter
# ──────────────────────────────────────────────────────────────

class OfficeSearchView(generics.ListAPIView):
    """
    [SCRUM-21] Search and filter offices.

    Supported query parameters:
      ?search=<text>        — searches room_number, building name, office_type
      ?building=<id>        — filter by building ID
      ?office_type=<type>   — filter by office type (e.g., 'single', 'shared')
      ?room_number=<text>   — filter by exact or partial room number
      ?min_available=<int>  — only offices with at least N available spots
      ?floor=<int>          — filter by floor number

    The queryset is annotated with:
      - current_occupants_count: number of active assignments (end_date IS NULL)
      - available_capacity: capacity - current_occupants_count
    """

    serializer_class = OfficeListSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['room_number', 'building__name', 'office_type']
    ordering_fields = ['room_number', 'floor', 'capacity', 'available_capacity']
    ordering = ['building', 'room_number']

    def get_queryset(self):
        """
        Build the office queryset with dynamic annotations and filters.

        Annotations:
          - current_occupants_count: COUNT of assignments where end_date IS NULL
          - available_capacity: capacity - current_occupants_count

        Filters are applied from query parameters.
        """
        queryset = Office.objects.select_related('building').annotate(
            current_occupants_count=Count(
                'assignments',
                filter=Q(assignments__end_date__isnull=True),
            ),
            available_capacity=F('capacity') - Count(
                'assignments',
                filter=Q(assignments__end_date__isnull=True),
            ),
        )

        # --- Apply query-parameter filters ---

        building_id = self.request.query_params.get('building')
        if building_id:
            queryset = queryset.filter(building_id=building_id)

        office_type = self.request.query_params.get('office_type')
        if office_type:
            queryset = queryset.filter(office_type__iexact=office_type)

        room_number = self.request.query_params.get('room_number')
        if room_number:
            queryset = queryset.filter(room_number__icontains=room_number)

        floor = self.request.query_params.get('floor')
        if floor:
            queryset = queryset.filter(floor=floor)

        min_available = self.request.query_params.get('min_available')
        if min_available:
            try:
                queryset = queryset.filter(
                    available_capacity__gte=int(min_available)
                )
            except (ValueError, TypeError):
                pass  # Ignore invalid values gracefully

        return queryset


# ──────────────────────────────────────────────────────────────
# SCRUM-22: Office Detail
# ──────────────────────────────────────────────────────────────

class OfficeDetailView(generics.RetrieveAPIView):
    """
    [SCRUM-22] Retrieve full detail for a single office.

    Response includes:
      - Office basic info (room_number, floor, capacity, office_type)
      - building_name: the building this office belongs to
      - capacity_status: { total, occupied, available }
      - current_occupants: list of active assignments with nested staff info
      - it_equipment: list of IT assets linked to this office
    """

    queryset = Office.objects.select_related('building').prefetch_related(
        'assignments__staff',
        'it_equipment',
    )
    serializer_class = OfficeDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'


# ──────────────────────────────────────────────────────────────
# SCRUM-23: CRUD ViewSets for all entities
# ──────────────────────────────────────────────────────────────

class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for departments. Read-only for non-admins."""

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]


class BuildingViewSet(viewsets.ModelViewSet):
    """CRUD operations for buildings. Read-only for non-admins."""

    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    permission_classes = [IsAdminOrReadOnly]


class StaffViewSet(viewsets.ModelViewSet):
    """CRUD operations for staff members. Read-only for non-admins."""

    queryset = Staff.objects.select_related('department').all()
    serializer_class = StaffSerializer
    permission_classes = [IsAdminOrReadOnly]


class ITEquipmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for IT equipment. Read-only for non-admins."""

    queryset = ITEquipment.objects.select_related('office').all()
    serializer_class = ITEquipmentSerializer
    permission_classes = [IsAdminOrReadOnly]


class OfficeAssignmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for office assignments. Read-only for non-admins."""

    queryset = OfficeAssignment.objects.select_related('office', 'staff').all()
    serializer_class = OfficeAssignmentSerializer
    permission_classes = [IsAdminOrReadOnly]

