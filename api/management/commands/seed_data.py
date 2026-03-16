"""
Management command to seed the database with realistic test data.

Usage:
    python manage.py seed_data

This creates departments, buildings, offices, staff, IT equipment,
and office assignments so the API endpoints can be tested immediately.
"""

from datetime import date, timedelta
from django.core.management.base import BaseCommand
from api.models import Department, Building, Office, Staff, ITEquipment, OfficeAssignment


class Command(BaseCommand):
    """Populate the database with sample data for development and testing."""

    help = 'Seeds the database with realistic test data for OPA.'

    def handle(self, *args, **options):
        """Execute the seed command."""
        self.stdout.write(self.style.WARNING('🌱 Seeding database...'))

        # ── Departments ──
        departments_data = [
            {'name': 'Computer Science', 'description': 'Department of Computer Science and Engineering'},
            {'name': 'Mathematics', 'description': 'Department of Pure and Applied Mathematics'},
            {'name': 'Physics', 'description': 'Department of Physics and Astronomy'},
            {'name': 'Electrical Engineering', 'description': 'Department of Electrical and Electronics Engineering'},
            {'name': 'Business Administration', 'description': 'Department of Business and Management'},
        ]
        departments = []
        for data in departments_data:
            dept, created = Department.objects.get_or_create(**data)
            departments.append(dept)
            status = '✅ Created' if created else '⏭️  Exists'
            self.stdout.write(f'  {status}: Department "{dept.name}"')

        # ── Buildings ──
        buildings_data = [
            {'name': 'Engineering Building', 'address': '100 University Ave'},
            {'name': 'Science Hall', 'address': '200 Campus Drive'},
            {'name': 'Business Center', 'address': '300 College Blvd'},
        ]
        buildings = []
        for data in buildings_data:
            bldg, created = Building.objects.get_or_create(**data)
            buildings.append(bldg)
            status = '✅ Created' if created else '⏭️  Exists'
            self.stdout.write(f'  {status}: Building "{bldg.name}"')

        # ── Offices ──
        offices_data = [
            # Engineering Building — 3 offices
            {'building': buildings[0], 'room_number': '101', 'floor': 1, 'capacity': 2, 'office_type': 'single'},
            {'building': buildings[0], 'room_number': '102', 'floor': 1, 'capacity': 4, 'office_type': 'shared'},
            {'building': buildings[0], 'room_number': '201', 'floor': 2, 'capacity': 6, 'office_type': 'lab'},
            {'building': buildings[0], 'room_number': '202', 'floor': 2, 'capacity': 1, 'office_type': 'single'},
            # Science Hall — 3 offices
            {'building': buildings[1], 'room_number': '110', 'floor': 1, 'capacity': 2, 'office_type': 'single'},
            {'building': buildings[1], 'room_number': '210', 'floor': 2, 'capacity': 4, 'office_type': 'shared'},
            {'building': buildings[1], 'room_number': '310', 'floor': 3, 'capacity': 10, 'office_type': 'conference'},
            # Business Center — 2 offices
            {'building': buildings[2], 'room_number': '100', 'floor': 1, 'capacity': 3, 'office_type': 'shared'},
            {'building': buildings[2], 'room_number': '200', 'floor': 2, 'capacity': 1, 'office_type': 'single'},
        ]
        offices = []
        for data in offices_data:
            office, created = Office.objects.get_or_create(
                building=data['building'],
                room_number=data['room_number'],
                defaults={
                    'floor': data['floor'],
                    'capacity': data['capacity'],
                    'office_type': data['office_type'],
                }
            )
            offices.append(office)
            status = '✅ Created' if created else '⏭️  Exists'
            self.stdout.write(f'  {status}: Office "{office}"')

        # ── Staff ──
        staff_data = [
            {'department': departments[0], 'first_name': 'Alice', 'last_name': 'Johnson', 'email': 'alice.johnson@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty'},
            {'department': departments[0], 'first_name': 'Bob', 'last_name': 'Smith', 'email': 'bob.smith@university.edu', 'academic_title': 'Prof.', 'system_role': 'department_admin'},
            {'department': departments[1], 'first_name': 'Carol', 'last_name': 'Williams', 'email': 'carol.williams@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty'},
            {'department': departments[1], 'first_name': 'David', 'last_name': 'Brown', 'email': 'david.brown@university.edu', 'academic_title': 'Assoc. Prof.', 'system_role': 'faculty'},
            {'department': departments[2], 'first_name': 'Eva', 'last_name': 'Davis', 'email': 'eva.davis@university.edu', 'academic_title': 'Prof.', 'system_role': 'faculty'},
            {'department': departments[3], 'first_name': 'Frank', 'last_name': 'Miller', 'email': 'frank.miller@university.edu', 'academic_title': 'Dr.', 'system_role': 'resource_manager'},
            {'department': departments[4], 'first_name': 'Grace', 'last_name': 'Wilson', 'email': 'grace.wilson@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty'},
            {'department': departments[0], 'first_name': 'Henry', 'last_name': 'Taylor', 'email': 'henry.taylor@university.edu', 'academic_title': '', 'system_role': 'it_department'},
            {'department': departments[0], 'first_name': 'Ivy', 'last_name': 'Anderson', 'email': 'ivy.anderson@university.edu', 'academic_title': '', 'system_role': 'system_admin'},
        ]
        staff_members = []
        for data in staff_data:
            member, created = Staff.objects.get_or_create(
                email=data['email'],
                defaults={
                    'department': data['department'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'academic_title': data['academic_title'],
                    'system_role': data['system_role'],
                }
            )
            staff_members.append(member)
            status = '✅ Created' if created else '⏭️  Exists'
            self.stdout.write(f'  {status}: Staff "{member}"')

        # ── IT Equipment ──
        equipment_data = [
            {'office': offices[0], 'asset_type': 'computer', 'serial_number': 'PC-ENG-001', 'status': 'active'},
            {'office': offices[0], 'asset_type': 'monitor', 'serial_number': 'MON-ENG-001', 'status': 'active'},
            {'office': offices[1], 'asset_type': 'computer', 'serial_number': 'PC-ENG-002', 'status': 'active'},
            {'office': offices[1], 'asset_type': 'computer', 'serial_number': 'PC-ENG-003', 'status': 'active'},
            {'office': offices[1], 'asset_type': 'printer', 'serial_number': 'PRT-ENG-001', 'status': 'active'},
            {'office': offices[2], 'asset_type': 'projector', 'serial_number': 'PRJ-ENG-001', 'status': 'active'},
            {'office': offices[2], 'asset_type': 'computer', 'serial_number': 'PC-ENG-004', 'status': 'maintenance'},
            {'office': offices[4], 'asset_type': 'computer', 'serial_number': 'PC-SCI-001', 'status': 'active'},
            {'office': offices[5], 'asset_type': 'phone', 'serial_number': 'PH-SCI-001', 'status': 'active'},
            {'office': offices[7], 'asset_type': 'computer', 'serial_number': 'PC-BIZ-001', 'status': 'retired'},
        ]
        for data in equipment_data:
            equip, created = ITEquipment.objects.get_or_create(
                serial_number=data['serial_number'],
                defaults={
                    'office': data['office'],
                    'asset_type': data['asset_type'],
                    'status': data['status'],
                }
            )
            status = '✅ Created' if created else '⏭️  Exists'
            self.stdout.write(f'  {status}: Equipment "{equip}"')

        # ── Office Assignments ──
        today = date.today()
        assignments_data = [
            # Active assignments (end_date = None → currently occupying)
            {'office': offices[0], 'staff': staff_members[0], 'start_date': today - timedelta(days=180), 'end_date': None},
            {'office': offices[0], 'staff': staff_members[1], 'start_date': today - timedelta(days=90), 'end_date': None},
            # ↑ Office 101 in Engineering: capacity=2, occupants=2 → FULL
            {'office': offices[1], 'staff': staff_members[2], 'start_date': today - timedelta(days=120), 'end_date': None},
            {'office': offices[1], 'staff': staff_members[3], 'start_date': today - timedelta(days=60), 'end_date': None},
            # ↑ Office 102 in Engineering: capacity=4, occupants=2 → 2 available
            {'office': offices[4], 'staff': staff_members[4], 'start_date': today - timedelta(days=365), 'end_date': None},
            # ↑ Office 110 in Science Hall: capacity=2, occupants=1 → 1 available
            {'office': offices[7], 'staff': staff_members[6], 'start_date': today - timedelta(days=200), 'end_date': None},
            # ↑ Office 100 in Business Center: capacity=3, occupants=1 → 2 available
            # Past (ended) assignment
            {'office': offices[3], 'staff': staff_members[5], 'start_date': today - timedelta(days=300), 'end_date': today - timedelta(days=30)},
            # ↑ Office 202 in Engineering: was occupied, now empty → 1 available
        ]
        for data in assignments_data:
            assignment, created = OfficeAssignment.objects.get_or_create(
                office=data['office'],
                staff=data['staff'],
                start_date=data['start_date'],
                defaults={'end_date': data['end_date']}
            )
            status = '✅ Created' if created else '⏭️  Exists'
            self.stdout.write(f'  {status}: Assignment "{assignment}"')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('🎉 Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write(self.style.NOTICE('📊 Summary of capacity to verify SCRUM-21 filtering:'))
        self.stdout.write('  Engineering 101: capacity=2, occupied=2, available=0 (FULL)')
        self.stdout.write('  Engineering 102: capacity=4, occupied=2, available=2')
        self.stdout.write('  Engineering 201: capacity=6, occupied=0, available=6 (EMPTY)')
        self.stdout.write('  Engineering 202: capacity=1, occupied=0, available=1 (past assignment ended)')
        self.stdout.write('  Science 110:     capacity=2, occupied=1, available=1')
        self.stdout.write('  Science 210:     capacity=4, occupied=0, available=4 (EMPTY)')
        self.stdout.write('  Science 310:     capacity=10, occupied=0, available=10 (EMPTY)')
        self.stdout.write('  Business 100:    capacity=3, occupied=1, available=2')
        self.stdout.write('  Business 200:    capacity=1, occupied=0, available=1 (EMPTY)')
