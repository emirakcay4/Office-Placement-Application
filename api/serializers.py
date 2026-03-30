"""
Serializers for the OPA (Office Placement Application).

Contains both flat serializers (for CRUD operations), nested
serializers (for the Office Detail endpoint — SCRUM-22),
and JWT authentication serializers (SCRUM-24).
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Department, Building, Office, Staff, ITEquipment, OfficeAssignment


# ──────────────────────────────────────────────────────────────
# SCRUM-24: JWT Authentication Serializers
# ──────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT login serializer that includes staff profile data
    in the token response. This way the frontend immediately knows
    the user's role, name, and department after login.
    """

    def validate(self, attrs):
        """
        Authenticate and return tokens + staff profile info.

        Response includes:
          - access: JWT access token
          - refresh: JWT refresh token
          - user: { id, username, staff_profile: { ... } }
        """
        data = super().validate(attrs)

        # Add user info to the response
        user = self.user
        user_data = {
            'id': user.id,
            'username': user.username,
        }

        # Include staff profile if linked
        if hasattr(user, 'staff_profile'):
            profile = user.staff_profile
            user_data['staff_profile'] = {
                'id': profile.id,
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'email': profile.email,
                'academic_title': profile.academic_title,
                'system_role': profile.system_role,
                'department': profile.department.name,
            }
        else:
            user_data['staff_profile'] = None

        data['user'] = user_data
        return data


class CurrentUserSerializer(serializers.Serializer):
    """
    Serializer for the /api/auth/me/ endpoint.

    Returns the authenticated user's basic info and their linked
    staff profile (role, department, etc.).
    """

    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    staff_profile = serializers.SerializerMethodField()

    def get_staff_profile(self, obj):
        """
        Return the linked staff profile or null if not linked.
        """
        if hasattr(obj, 'staff_profile'):
            profile = obj.staff_profile
            return {
                'id': profile.id,
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'email': profile.email,
                'academic_title': profile.academic_title,
                'system_role': profile.system_role,
                'department_id': profile.department_id,
                'department_name': profile.department.name,
            }
        return None


# ──────────────────────────────────────────────────────────────
# Base (flat) Serializers — used for standard CRUD / list views
# ──────────────────────────────────────────────────────────────

class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department CRUD operations."""

    class Meta:
        model = Department
        fields = '__all__'


class BuildingSerializer(serializers.ModelSerializer):
    """Serializer for Building CRUD operations."""

    class Meta:
        model = Building
        fields = '__all__'


class StaffSerializer(serializers.ModelSerializer):
    """Serializer for Staff CRUD operations."""

    department_name = serializers.CharField(
        source='department.name', read_only=True
    )

    class Meta:
        model = Staff
        fields = [
            'id', 'department', 'department_name',
            'first_name', 'last_name', 'email',
            'academic_title', 'system_role',
        ]


class ITEquipmentSerializer(serializers.ModelSerializer):
    """Serializer for IT Equipment CRUD operations."""

    class Meta:
        model = ITEquipment
        fields = '__all__'


class OfficeAssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Office Assignment CRUD operations.

    Validates that:
      - The target office has available capacity before allowing a new
        active assignment (end_date is NULL).
      - A staff member doesn't already have an active assignment to the
        same office.
    """

    class Meta:
        model = OfficeAssignment
        fields = '__all__'

    def validate(self, attrs):
        """
        Cross-field validation for office capacity and duplicate assignments.

        Raises:
            serializers.ValidationError: if the office is full or the staff
            member already has an active assignment in this office.
        """
        office = attrs.get('office')
        staff = attrs.get('staff')
        end_date = attrs.get('end_date')

        # Only validate capacity for ACTIVE assignments (end_date is None)
        if office and end_date is None:
            active_count = OfficeAssignment.objects.filter(
                office=office,
                end_date__isnull=True,
            )

            # On update, exclude the current instance from the count
            if self.instance:
                active_count = active_count.exclude(pk=self.instance.pk)

            current_occupants = active_count.count()

            if current_occupants >= office.capacity:
                raise serializers.ValidationError({
                    'office': (
                        f'Office "{office}" is at full capacity '
                        f'({current_occupants}/{office.capacity}). '
                        f'Cannot add a new active assignment.'
                    )
                })

        # Prevent duplicate active assignments (same staff → same office)
        if office and staff and end_date is None:
            duplicate = OfficeAssignment.objects.filter(
                office=office,
                staff=staff,
                end_date__isnull=True,
            )
            if self.instance:
                duplicate = duplicate.exclude(pk=self.instance.pk)

            if duplicate.exists():
                raise serializers.ValidationError({
                    'staff': (
                        f'{staff} already has an active assignment in "{office}".'
                    )
                })

        return attrs


# ──────────────────────────────────────────────────────────────
# SCRUM-21: Office List / Search Serializer
# ──────────────────────────────────────────────────────────────

class OfficeListSerializer(serializers.ModelSerializer):
    """
    Serializer for the Office search/list endpoint (SCRUM-21).

    Includes computed fields:
      - building_name: human-readable building name.
      - current_occupants_count: number of active assignments (end_date IS NULL).
      - available_capacity: capacity minus current occupants.
    """

    building_name = serializers.CharField(
        source='building.name', read_only=True
    )
    current_occupants_count = serializers.IntegerField(read_only=True)
    available_capacity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Office
        fields = [
            'id', 'building', 'building_name',
            'room_number', 'floor', 'capacity',
            'office_type',
            'current_occupants_count', 'available_capacity',
        ]


# ──────────────────────────────────────────────────────────────
# SCRUM-22: Office Detail — Nested Serializers
# ──────────────────────────────────────────────────────────────

class StaffBriefSerializer(serializers.ModelSerializer):
    """
    A compact representation of a staff member,
    used inside the office detail view to show current occupants.
    """

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = ['id', 'full_name', 'email', 'academic_title', 'system_role']

    def get_full_name(self, obj):
        """Return formatted full name with academic title."""
        parts = [obj.academic_title, obj.first_name, obj.last_name]
        return ' '.join(p for p in parts if p).strip()


class CurrentOccupantSerializer(serializers.ModelSerializer):
    """
    Shows an active office assignment together with the nested staff info.
    Used inside OfficeDetailSerializer to list current occupants.
    """

    staff = StaffBriefSerializer(read_only=True)

    class Meta:
        model = OfficeAssignment
        fields = ['id', 'staff', 'start_date', 'end_date']


class OfficeDetailSerializer(serializers.ModelSerializer):
    """
    Full detail serializer for a single office (SCRUM-22).

    Includes:
      - Basic office info + building name.
      - current_occupants: list of active OfficeAssignments with nested Staff.
      - it_equipment: list of IT assets in this office.
      - capacity_status: dict with total, occupied, and available counts.
    """

    building_name = serializers.CharField(
        source='building.name', read_only=True
    )
    current_occupants = serializers.SerializerMethodField()
    it_equipment = ITEquipmentSerializer(many=True, read_only=True)
    capacity_status = serializers.SerializerMethodField()

    class Meta:
        model = Office
        fields = [
            'id', 'building', 'building_name',
            'room_number', 'floor', 'capacity',
            'office_type',
            'capacity_status',
            'current_occupants',
            'it_equipment',
        ]

    def get_current_occupants(self, obj):
        """
        Return only ACTIVE assignments (end_date is NULL)
        with nested staff details.
        """
        active_assignments = obj.assignments.filter(
            end_date__isnull=True
        ).select_related('staff')
        return CurrentOccupantSerializer(active_assignments, many=True).data

    def get_capacity_status(self, obj):
        """
        Dynamically compute capacity status:
          - total: office.capacity
          - occupied: count of active assignments
          - available: total - occupied
        """
        occupied = obj.assignments.filter(end_date__isnull=True).count()
        return {
            'total': obj.capacity,
            'occupied': occupied,
            'available': obj.capacity - occupied,
        }
