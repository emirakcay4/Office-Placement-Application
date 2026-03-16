"""
Admin site configuration for OPA models (SCRUM-23).

Registers all models with proper list_display, search_fields,
and list_filter for convenient management via Django Admin.
"""

from django.contrib import admin
from .models import Department, Building, Office, Staff, ITEquipment, OfficeAssignment


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin configuration for Department model."""

    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    """Admin configuration for Building model."""

    list_display = ('id', 'name', 'address')
    search_fields = ('name', 'address')


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    """Admin configuration for Office model."""

    list_display = ('id', 'room_number', 'building', 'floor', 'capacity', 'office_type')
    search_fields = ('room_number', 'building__name')
    list_filter = ('office_type', 'floor', 'building')


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    """Admin configuration for Staff model."""

    list_display = ('id', 'last_name', 'first_name', 'email', 'department', 'academic_title', 'system_role')
    search_fields = ('first_name', 'last_name', 'email')
    list_filter = ('system_role', 'department')


@admin.register(ITEquipment)
class ITEquipmentAdmin(admin.ModelAdmin):
    """Admin configuration for IT Equipment model."""

    list_display = ('id', 'asset_type', 'serial_number', 'office', 'status')
    search_fields = ('serial_number', 'office__room_number')
    list_filter = ('asset_type', 'status')


@admin.register(OfficeAssignment)
class OfficeAssignmentAdmin(admin.ModelAdmin):
    """Admin configuration for Office Assignment model."""

    list_display = ('id', 'staff', 'office', 'start_date', 'end_date')
    search_fields = ('staff__first_name', 'staff__last_name', 'office__room_number')
    list_filter = ('start_date', 'end_date')
