"""
Serializers for the OPA (Office Placement Application).

Contains both flat serializers (for CRUD operations), nested
serializers (for the Office Detail endpoint — SCRUM-22),
and JWT authentication serializers (SCRUM-24).
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Department, Building, Office, Staff, ITEquipment, OfficeAssignment, OfficeRequest, EquipmentRequest


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
                'phone_number': profile.phone_number,
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
                'phone_number': profile.phone_number,
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
            'first_name', 'last_name', 'email', 'phone_number',
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

        # Check if the requesting user is a department admin and restrict them to their department
        request = self.context.get('request')
        user = request.user if request else None
        if user and not user.is_superuser and hasattr(user, 'staff_profile'):
            profile = user.staff_profile
            if profile.system_role == 'department_admin':
                target_staff = staff or (self.instance.staff if self.instance else None)
                if target_staff and target_staff.department != profile.department:
                    raise serializers.ValidationError({
                        'staff': "Department Admins can only manage assignments for staff within their own department."
                    })

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
        fields = ['id', 'full_name', 'email', 'phone_number', 'academic_title', 'system_role']

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


class OfficeRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for the OfficeRequest model.
    """
    staff_name = serializers.SerializerMethodField(read_only=True)
    office_room = serializers.CharField(source='office.room_number', read_only=True)
    office_building = serializers.CharField(source='office.building.name', read_only=True)

    class Meta:
        model = OfficeRequest
        fields = [
            'id', 'office', 'office_room', 'office_building',
            'staff', 'staff_name', 'reason', 'status', 'created_at'
        ]
        read_only_fields = ['staff', 'created_at']

    def get_staff_name(self, obj):
        return f"{obj.staff.first_name} {obj.staff.last_name}"

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None
        staff = user.staff_profile if user and hasattr(user, 'staff_profile') else None
        new_status = attrs.get('status')

        # Check if status is being updated (or set during creation if not default)
        if 'status' in attrs:
            if self.instance:
                # Update case
                if not (user and hasattr(user, 'staff_profile') and user.staff_profile.system_role in ['system_admin', 'department_admin', 'resource_manager']):
                    raise serializers.ValidationError({"status": "Only administrators can update the status of a request."})
                
                # Check department admin boundary
                if user and hasattr(user, 'staff_profile') and user.staff_profile.system_role == 'department_admin':
                    if self.instance.staff.department != user.staff_profile.department:
                        raise serializers.ValidationError({"status": "Department Admins can only manage requests for staff within their own department."})
                
                # If changing status to approved, validate capacity!
                if self.instance.status != 'approved' and new_status == 'approved':
                    reason_str = attrs.get('reason') or self.instance.reason
                    is_vacate = reason_str and reason_str.startswith('[VACATE REQUEST]')
                    
                    if not is_vacate:
                        office = self.instance.office
                        active_occupants = office.assignments.filter(end_date__isnull=True).count()
                        if active_occupants >= office.capacity:
                            raise serializers.ValidationError({
                                "status": f"Cannot approve request. Office '{office}' is at full capacity ({active_occupants}/{office.capacity})."
                            })
            else:
                # Create case: standard users shouldn't set initial status to approved/rejected
                if new_status != 'pending' and not (user and hasattr(user, 'staff_profile') and user.staff_profile.system_role in ['system_admin', 'department_admin', 'resource_manager']):
                    raise serializers.ValidationError({"status": "Standard users can only create requests with 'pending' status."})

        # Validate capacity on direct creation of approved requests
        if not self.instance and new_status == 'approved':
            reason_str = attrs.get('reason', '')
            is_vacate = reason_str and reason_str.startswith('[VACATE REQUEST]')
            
            if not is_vacate:
                office = attrs.get('office')
                if office:
                    active_occupants = office.assignments.filter(end_date__isnull=True).count()
                    if active_occupants >= office.capacity:
                        raise serializers.ValidationError({
                            "office": f"Cannot create approved request. Office '{office}' is at full capacity ({active_occupants}/{office.capacity})."
                        })

        # Duplicate check on create: prevent multiple pending requests for the same office by the same staff
        if not self.instance:
            office = attrs.get('office')
            if staff and office:
                duplicate = OfficeRequest.objects.filter(staff=staff, office=office, status='pending')
                if duplicate.exists():
                    raise serializers.ValidationError({
                        "office": f"You already have a pending request for office '{office.room_number}'."
                    })

        return attrs

    def create(self, validated_data):
        instance = super().create(validated_data)

        if instance.status == 'approved':
            from datetime import date
            from api.models import OfficeAssignment

            # If it is a vacate request, only terminate the assignment for this specific office and staff
            if instance.reason and instance.reason.startswith('[VACATE REQUEST]'):
                OfficeAssignment.objects.filter(
                    staff=instance.staff,
                    office=instance.office,
                    end_date__isnull=True
                ).update(end_date=date.today())
            else:
                # 1. Terminate other active assignments for this staff member
                OfficeAssignment.objects.filter(
                    staff=instance.staff,
                    end_date__isnull=True
                ).update(end_date=date.today())

                # 2. Create the new assignment starting today
                OfficeAssignment.objects.get_or_create(
                    office=instance.office,
                    staff=instance.staff,
                    end_date__isnull=True,
                    defaults={'start_date': date.today()}
                )

        return instance

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)

        instance = super().update(instance, validated_data)

        if old_status != 'approved' and new_status == 'approved':
            from datetime import date
            from api.models import OfficeAssignment

            # If it is a vacate request, only terminate the assignment for this specific office and staff
            if instance.reason and instance.reason.startswith('[VACATE REQUEST]'):
                OfficeAssignment.objects.filter(
                    staff=instance.staff,
                    office=instance.office,
                    end_date__isnull=True
                ).update(end_date=date.today())
            else:
                # 1. Terminate other active assignments for this staff member
                OfficeAssignment.objects.filter(
                    staff=instance.staff,
                    end_date__isnull=True
                ).update(end_date=date.today())

                # 2. Automatically create the new assignment starting today
                OfficeAssignment.objects.get_or_create(
                    office=instance.office,
                    staff=instance.staff,
                    end_date__isnull=True,
                    defaults={'start_date': date.today()}
                )

        return instance


class EquipmentRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for the EquipmentRequest model.
    """
    staff_name = serializers.SerializerMethodField(read_only=True)
    office_room = serializers.CharField(source='office.room_number', read_only=True)
    office_building = serializers.CharField(source='office.building.name', read_only=True)

    class Meta:
        model = EquipmentRequest
        fields = [
            'id', 'office', 'office_room', 'office_building',
            'staff', 'staff_name', 'asset_type', 'category',
            'quantity', 'reason', 'status', 'rejection_reason',
            'serial_number_assigned', 'created_at', 'updated_at'
        ]
        read_only_fields = ['staff', 'created_at', 'updated_at']

    def get_staff_name(self, obj):
        return f"{obj.staff.first_name} {obj.staff.last_name}"

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None
        staff = user.staff_profile if user and hasattr(user, 'staff_profile') else None
        new_status = attrs.get('status')
        asset_type = attrs.get('asset_type') or (self.instance.asset_type if self.instance else None)
        category = attrs.get('category') or (self.instance.category if self.instance else None)

        # Check if user has a staff profile
        if not staff and not (user and user.is_superuser):
            raise serializers.ValidationError("User has no associated staff profile.")

        # Role checks for status / admin-only updates
        if 'status' in attrs or 'rejection_reason' in attrs or 'serial_number_assigned' in attrs:
            is_admin = staff and staff.system_role in ['system_admin', 'department_admin', 'resource_manager', 'it_department']
            if not is_admin and not (user and user.is_superuser):
                raise serializers.ValidationError("Only administrators can update request status or assign assets.")

            # Validate rejection reason if status is being updated to rejected
            if new_status == 'rejected':
                if self.instance and not self.instance.rejection_reason and not attrs.get('rejection_reason'):
                    raise serializers.ValidationError({"rejection_reason": "Rejection reason is mandatory when rejecting a request."})
                elif not self.instance and not attrs.get('rejection_reason'):
                    raise serializers.ValidationError({"rejection_reason": "Rejection reason is mandatory when rejecting a request."})

            # Check department boundaries for Department Admins
            if staff and staff.system_role == 'department_admin':
                target_request_staff = self.instance.staff if self.instance else staff
                if target_request_staff.department != staff.department:
                    raise serializers.ValidationError("Department Admins can only manage requests for staff within their department.")

        # On create
        if not self.instance:
            # Set category based on asset type if not provided
            if not category and asset_type:
                if asset_type in ['chair', 'desk']:
                    attrs['category'] = 'furniture'
                else:
                    attrs['category'] = 'it'

            # Standard users cannot create approved/rejected requests directly
            if new_status and new_status != 'pending':
                is_admin = staff and staff.system_role in ['system_admin', 'department_admin', 'resource_manager', 'it_department']
                if not is_admin and not (user and user.is_superuser):
                    raise serializers.ValidationError({"status": "Standard users can only submit requests in 'pending' status."})

            # Validate quantity
            quantity = attrs.get('quantity', 1)
            if quantity <= 0:
                raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})

            # Validate that the user is assigned to the office (for Faculty / Staff)
            office = attrs.get('office')
            is_admin = staff and staff.system_role in ['system_admin', 'department_admin', 'resource_manager', 'it_department']
            if not is_admin and not (user and user.is_superuser):
                from api.models import OfficeAssignment
                # Check active assignment
                assigned = OfficeAssignment.objects.filter(
                    staff=staff,
                    office=office,
                    end_date__isnull=True
                ).exists()
                if not assigned:
                    raise serializers.ValidationError({
                        "office": "You can only request equipment for offices you are currently assigned to."
                    })

        return attrs

    def create(self, validated_data):
        instance = super().create(validated_data)

        # Trigger asset creation if approved immediately
        if instance.status == 'approved':
            self._deploy_asset(instance)

        return instance

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)

        instance = super().update(instance, validated_data)

        if old_status != 'approved' and new_status == 'approved':
            self._deploy_asset(instance)

        return instance

    def _deploy_asset(self, instance):
        from api.models import ITEquipment
        # Auto-generate serial number if empty
        sn = instance.serial_number_assigned
        if not sn:
            sn = f"GEN-REQ-{instance.id}"
            instance.serial_number_assigned = sn
            instance.save()

        # Create the asset in ITEquipment
        ITEquipment.objects.get_or_create(
            office=instance.office,
            asset_type=instance.asset_type,
            serial_number=sn,
            defaults={'status': 'active'}
        )
