"""
Models for the OPA (Office Placement Application).

This module defines the database schema strictly according to the approved
DBML specification. Each model maps 1-to-1 to a table in the ERD.
"""

from django.db import models
from django.contrib.auth.models import User


class Department(models.Model):
    """
    Represents an academic or administrative department.
    Example: 'Computer Science', 'Mathematics'.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'department'
        ordering = ['name']

    def __str__(self):
        return self.name


class Building(models.Model):
    """
    Represents a physical building on the university campus.
    """
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)

    class Meta:
        db_table = 'building'
        ordering = ['name']

    def __str__(self):
        return self.name


class Office(models.Model):
    """
    Represents a specific room/office inside a building.
    Tracks capacity and office type (e.g., 'single', 'shared', 'lab').
    """
    OFFICE_TYPE_CHOICES = [
        ('single', 'Single'),
        ('shared', 'Shared'),
        ('lab', 'Lab'),
        ('conference', 'Conference'),
    ]

    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name='offices',
        help_text='The building this office belongs to.'
    )
    room_number = models.CharField(max_length=50)
    floor = models.IntegerField()
    capacity = models.IntegerField(default=4)
    office_type = models.CharField(max_length=50, choices=OFFICE_TYPE_CHOICES)

    class Meta:
        db_table = 'office'
        ordering = ['building', 'room_number']
        # A room number should be unique within a building
        unique_together = ['building', 'room_number']

    def __str__(self):
        return f"{self.building.name} — Room {self.room_number}"


class Staff(models.Model):
    """
    Represents a faculty member or university staff.
    Linked to a department and assigned a system role for access control.
    Optionally linked to a Django User for authentication (SCRUM-24).
    """
    SYSTEM_ROLE_CHOICES = [
        ('faculty', 'Faculty / Staff'),
        ('department_admin', 'Department Admin'),
        ('resource_manager', 'Resource Manager'),
        ('system_admin', 'System Administrator'),
        ('it_department', 'IT Department'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='staff_profile',
        null=True,
        blank=True,
        help_text='Linked Django User for authentication. '
                  'related_name=staff_profile is used by permission classes.',
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='staff_members',
        help_text='Department this staff member belongs to.'
    )
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, default='')
    academic_title = models.CharField(max_length=100, blank=True, default='')
    system_role = models.CharField(
        max_length=50,
        choices=SYSTEM_ROLE_CHOICES,
        default='faculty',
    )

    class Meta:
        db_table = 'staff'
        ordering = ['last_name', 'first_name']
        verbose_name_plural = 'staff'

    def __str__(self):
        return f"{self.academic_title} {self.first_name} {self.last_name}".strip()


class ITEquipment(models.Model):
    """
    Represents an IT asset (computer, monitor, printer, etc.) assigned to an office.
    Each piece of equipment has a unique serial number.
    """
    ASSET_TYPE_CHOICES = [
        ('computer', 'Computer'),
        ('monitor', 'Monitor'),
        ('printer', 'Printer'),
        ('phone', 'Phone'),
        ('projector', 'Projector'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Maintenance'),
        ('retired', 'Retired'),
    ]

    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name='it_equipment',
        help_text='The office this equipment is assigned to.'
    )
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPE_CHOICES)
    serial_number = models.CharField(max_length=255, unique=True)
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='active',
    )

    class Meta:
        db_table = 'it_equipment'
        ordering = ['office', 'asset_type']
        verbose_name = 'IT Equipment'
        verbose_name_plural = 'IT Equipment'

    def __str__(self):
        return f"{self.asset_type} ({self.serial_number}) — {self.office}"


class OfficeAssignment(models.Model):
    """
    Tracks which staff member is assigned to which office, and for what period.
    If end_date is NULL, the person is currently occupying the office.
    """
    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name='assignments',
        help_text='The office being assigned.'
    )
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='assignments',
        help_text='The staff member being assigned to the office.'
    )
    start_date = models.DateField()
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text='Leave blank if the person is currently occupying the office.'
    )

    class Meta:
        db_table = 'office_assignment'
        ordering = ['-start_date']

    def __str__(self):
        status = 'Active' if self.end_date is None else f'Until {self.end_date}'
        return f"{self.staff} → {self.office} ({status})"
