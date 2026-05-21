"""
Management command to seed the database with realistic, premium academic test data.

Usage:
    python manage.py seed_data

This purges the database first and populates it with realistic, coordinated departments,
buildings, offices, staff, users, IT equipment, assignments, and requests so the entire
application looks like a highly premium and fully operational platform.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, timedelta
from api.models import (
    Department, Building, Office, Staff, ITEquipment, 
    OfficeAssignment, OfficeRequest, EquipmentRequest
)

DEFAULT_PASSWORD = 'testpass123'


class Command(BaseCommand):
    """Populate the database with sample data for OPA, completely safe from terminal encoding issues."""

    help = 'Seeds the database with premium, realistic academic test data for OPA.'

    def handle(self, *args, **options):
        """Execute the seed command."""
        self.stdout.write(self.style.WARNING('[Purging database...]'))
        
        # 1. Purge all existing data in reverse dependency order
        OfficeAssignment.objects.all().delete()
        OfficeRequest.objects.all().delete()
        EquipmentRequest.objects.all().delete()
        ITEquipment.objects.all().delete()
        Staff.objects.all().delete()
        Office.objects.all().delete()
        Department.objects.all().delete()
        Building.objects.all().delete()
        
        # Delete non-superuser accounts
        User.objects.filter(is_superuser=False).delete()
        
        self.stdout.write(self.style.SUCCESS('[Success] Purged all existing OPA data.'))
        
        # 2. Seed Departments
        self.stdout.write(self.style.WARNING('[Seeding departments...]'))
        depts_data = [
            {'name': 'Computer Science & Engineering', 'description': 'Focusing on artificial intelligence, software engineering, systems, and theory.'},
            {'name': 'Data Science & Analytics', 'description': 'Interdisciplinary study of big data, statistics, and machine learning.'},
            {'name': 'Mathematics & Statistics', 'description': 'Center for pure and applied mathematical sciences.'},
            {'name': 'Electrical & Computer Engineering', 'description': 'Research in hardware systems, microelectronics, and signal processing.'},
            {'name': 'Information Technology', 'description': 'Managing enterprise networks, systems administration, and cybersecurity.'},
        ]
        departments = {}
        for d in depts_data:
            dept = Department.objects.create(**d)
            departments[dept.name] = dept
            self.stdout.write(f"  Created Department: {dept.name}")
            
        # 3. Seed Buildings
        self.stdout.write(self.style.WARNING('[Seeding buildings...]'))
        bldgs_data = [
            {'name': 'Alan Turing Hall', 'address': '100 Innovation Way'},
            {'name': 'Grace Hopper Hall', 'address': '120 Tech Drive'},
            {'name': 'Ada Lovelace Tower', 'address': '200 Science Plaza'},
        ]
        buildings = {}
        for b in bldgs_data:
            bldg = Building.objects.create(**b)
            buildings[bldg.name] = bldg
            self.stdout.write(f"  Created Building: {bldg.name}")
            
        # 4. Seed Offices
        self.stdout.write(self.style.WARNING('[Seeding offices...]'))
        
        turing = buildings['Alan Turing Hall']
        hopper = buildings['Grace Hopper Hall']
        lovelace = buildings['Ada Lovelace Tower']
        
        # Floor 0 (Ground) — distributed across all 3 buildings
        # Alan Turing Hall owns the CR12x classrooms
        # Grace Hopper Hall owns the AS13x/AS14x offices
        # Ada Lovelace Tower owns a few shared offices
        floor0_offices = [
            # Alan Turing Hall — Floor 0
            (turing, {'room_number': 'CR128', 'floor': 0, 'capacity': 1, 'office_type': 'shared'}),    # OVERCAPACITY: Turing + Liskov
            (turing, {'room_number': 'CR127', 'floor': 0, 'capacity': 2, 'office_type': 'shared'}),    # Hopper assigned
            (turing, {'room_number': 'CR126', 'floor': 0, 'capacity': 2, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR125', 'floor': 0, 'capacity': 2, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR124', 'floor': 0, 'capacity': 2, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR120', 'floor': 0, 'capacity': 4, 'office_type': 'lab'}),       # Feynman request pending
            (turing, {'room_number': 'CR121', 'floor': 0, 'capacity': 4, 'office_type': 'lab'}),
            # Grace Hopper Hall — Floor 0
            (hopper, {'room_number': 'AS139', 'floor': 0, 'capacity': 1, 'office_type': 'single'}),
            (hopper, {'room_number': 'AS140', 'floor': 0, 'capacity': 1, 'office_type': 'single'}),
            (hopper, {'room_number': 'CR129', 'floor': 0, 'capacity': 3, 'office_type': 'shared'}),    # Babbage + Shannon
            (hopper, {'room_number': 'CR122', 'floor': 0, 'capacity': 4, 'office_type': 'lab'}),
            # Ada Lovelace Tower — Floor 0
            (lovelace, {'room_number': 'CR123', 'floor': 0, 'capacity': 4, 'office_type': 'lab'}),
        ]
        
        # Floor 1 — distributed across all 3 buildings
        # Grace Hopper Hall is the main wing with AS1xx offices
        # Alan Turing Hall hosts classrooms CR13x
        # Ada Lovelace Tower hosts a few single offices
        left_ids = ['AS122', 'AS121', 'AS120', 'AS119', 'AS118', 'AS117', 'AS116', 'AS115', 'AS114', 'AS113', 'AS112', 'AS111']
        mid_l_ids = ['AS123', 'AS124', 'AS127', 'AS125', 'AS126']
        mid_r_ids = ['AS128', 'AS129', 'AS130', 'AS131', 'AS132', 'AS133']
        
        floor1_offices = [
            # Alan Turing Hall — Floor 1 (classrooms / labs)
            (turing, {'room_number': 'CR132', 'floor': 1, 'capacity': 6, 'office_type': 'lab'}),
            (turing, {'room_number': 'CR136', 'floor': 1, 'capacity': 4, 'office_type': 'lab'}),
            (turing, {'room_number': 'CR135', 'floor': 1, 'capacity': 4, 'office_type': 'lab'}),
            (turing, {'room_number': 'CR134', 'floor': 1, 'capacity': 4, 'office_type': 'lab'}),
            (turing, {'room_number': 'CR130', 'floor': 1, 'capacity': 3, 'office_type': 'shared'}),    # Linus Torvalds
            (turing, {'room_number': 'CR131', 'floor': 1, 'capacity': 4, 'office_type': 'shared'}),    # Shannon request rejected
            # Grace Hopper Hall — Floor 1 (main faculty wing)
            (hopper, {'room_number': 'AS144', 'floor': 1, 'capacity': 1, 'office_type': 'single'}),
            (hopper, {'room_number': 'AS123A', 'floor': 1, 'capacity': 1, 'office_type': 'single'}),
            (hopper, {'room_number': 'AS136', 'floor': 1, 'capacity': 2, 'office_type': 'shared'}),
            (hopper, {'room_number': 'AS138', 'floor': 1, 'capacity': 1, 'office_type': 'single'}),
            (hopper, {'room_number': 'AS137', 'floor': 1, 'capacity': 1, 'office_type': 'single'}),
            (hopper, {'room_number': 'AS135', 'floor': 1, 'capacity': 2, 'office_type': 'shared'}),
            (hopper, {'room_number': 'AS134', 'floor': 1, 'capacity': 2, 'office_type': 'shared'}),
        ]
        
        # Left wing offices — split between Hopper and Lovelace
        for i, r_id in enumerate(left_ids):
            bldg = hopper if i < 8 else lovelace   # First 8 in Hopper, last 4 in Lovelace
            floor1_offices.append((bldg, {'room_number': r_id, 'floor': 1, 'capacity': 1, 'office_type': 'single'}))
        
        # Mid-left offices — Ada Lovelace Tower
        for r_id in mid_l_ids:
            floor1_offices.append((lovelace, {'room_number': r_id, 'floor': 1, 'capacity': 1, 'office_type': 'single'}))
        
        # Mid-right offices — Grace Hopper Hall
        for r_id in mid_r_ids:
            floor1_offices.append((hopper, {'room_number': r_id, 'floor': 1, 'capacity': 1, 'office_type': 'single'}))
        
        # Floor 2 — distributed across all 3 buildings
        # Ada Lovelace Tower is the main wing with large labs
        # Alan Turing Hall hosts classrooms
        # Grace Hopper Hall hosts admin offices
        floor2_offices = [
            # Alan Turing Hall — Floor 2
            (turing, {'room_number': 'CR145', 'floor': 2, 'capacity': 2, 'office_type': 'shared'}),    # K. Johnson + E. Noether
            (turing, {'room_number': 'CR146', 'floor': 2, 'capacity': 3, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR146A', 'floor': 2, 'capacity': 2, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR144', 'floor': 2, 'capacity': 3, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR143', 'floor': 2, 'capacity': 3, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR142', 'floor': 2, 'capacity': 3, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR141', 'floor': 2, 'capacity': 3, 'office_type': 'shared'}),
            (turing, {'room_number': 'CR140', 'floor': 2, 'capacity': 4, 'office_type': 'shared'}),
            # Ada Lovelace Tower — Floor 2 (large labs + research)
            (lovelace, {'room_number': 'CR145A', 'floor': 2, 'capacity': 8, 'office_type': 'lab'}),
            (lovelace, {'room_number': 'CR144A', 'floor': 2, 'capacity': 10, 'office_type': 'lab'}),
            (lovelace, {'room_number': 'CR143A', 'floor': 2, 'capacity': 6, 'office_type': 'lab'}),
            (lovelace, {'room_number': 'CR142A', 'floor': 2, 'capacity': 6, 'office_type': 'lab'}),
            (lovelace, {'room_number': 'CR140A', 'floor': 2, 'capacity': 6, 'office_type': 'lab'}),
            (lovelace, {'room_number': 'CR148A', 'floor': 2, 'capacity': 2, 'office_type': 'shared'}),
            (lovelace, {'room_number': 'CR147', 'floor': 2, 'capacity': 2, 'office_type': 'shared'}),
            (lovelace, {'room_number': 'CR147A', 'floor': 2, 'capacity': 2, 'office_type': 'shared'}),
            # Grace Hopper Hall — Floor 2 (admin / single offices)
            (hopper, {'room_number': 'AS141', 'floor': 2, 'capacity': 1, 'office_type': 'single'}),    # John von Neumann
            (hopper, {'room_number': 'AS142', 'floor': 2, 'capacity': 1, 'office_type': 'single'}),    # Richard Feynman historical
            (hopper, {'room_number': 'AS143', 'floor': 2, 'capacity': 1, 'office_type': 'single'}),
        ]
        
        all_offices = {}
        for bldg, o in floor0_offices + floor1_offices + floor2_offices:
            office = Office.objects.create(building=bldg, **o)
            all_offices[f"{bldg.name} - Room {o['room_number']}"] = office
            self.stdout.write(f"  Created Office: {office.building.name} Room {office.room_number}")
                
        # 5. Seed Staff and Django Users
        self.stdout.write(self.style.WARNING('[Seeding staff members...]'))
        staff_data = [
            # Faculty
            {'first_name': 'Alan', 'last_name': 'Turing', 'email': 'alan.turing@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty', 'department': departments['Computer Science & Engineering'], 'phone_number': '+1-555-0101'},
            {'first_name': 'Grace', 'last_name': 'Hopper', 'email': 'grace.hopper@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty', 'department': departments['Computer Science & Engineering'], 'phone_number': '+1-555-0102'},
            {'first_name': 'Barbara', 'last_name': 'Liskov', 'email': 'barbara.liskov@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty', 'department': departments['Computer Science & Engineering'], 'phone_number': '+1-555-0103'},
            {'first_name': 'Katherine', 'last_name': 'Johnson', 'email': 'katherine.johnson@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty', 'department': departments['Mathematics & Statistics'], 'phone_number': '+1-555-0104'},
            {'first_name': 'Claude', 'last_name': 'Shannon', 'email': 'claude.shannon@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty', 'department': departments['Electrical & Computer Engineering'], 'phone_number': '+1-555-0105'},
            {'first_name': 'John', 'last_name': 'von Neumann', 'email': 'john.vonneumann@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty', 'department': departments['Data Science & Analytics'], 'phone_number': '+1-555-0106'},
            {'first_name': 'Richard', 'last_name': 'Feynman', 'email': 'richard.feynman@university.edu', 'academic_title': 'Dr.', 'system_role': 'faculty', 'department': departments['Computer Science & Engineering'], 'phone_number': '+1-555-0107'},
            
            # Department Admins
            {'first_name': 'Charles', 'last_name': 'Babbage', 'email': 'charles.babbage@university.edu', 'academic_title': 'Prof.', 'system_role': 'department_admin', 'department': departments['Computer Science & Engineering'], 'phone_number': '+1-555-0201'},
            {'first_name': 'Emmy', 'last_name': 'Noether', 'email': 'emmy.noether@university.edu', 'academic_title': 'Prof.', 'system_role': 'department_admin', 'department': departments['Mathematics & Statistics'], 'phone_number': '+1-555-0202'},
            
            # Resource Manager
            {'first_name': 'Vannevar', 'last_name': 'Bush', 'email': 'vannevar.bush@university.edu', 'academic_title': 'Dr.', 'system_role': 'resource_manager', 'department': departments['Data Science & Analytics'], 'phone_number': '+1-555-0301'},
            
            # IT Department
            {'first_name': 'Linus', 'last_name': 'Torvalds', 'email': 'linus.torvalds@university.edu', 'academic_title': '', 'system_role': 'it_department', 'department': departments['Information Technology'], 'phone_number': '+1-555-0401'},
            {'first_name': 'Margaret', 'last_name': 'Hamilton', 'email': 'margaret.hamilton@university.edu', 'academic_title': '', 'system_role': 'it_department', 'department': departments['Information Technology'], 'phone_number': '+1-555-0402'},
            
            # System Admin
            {'first_name': 'Steve', 'last_name': 'Wozniak', 'email': 'steve.wozniak@university.edu', 'academic_title': '', 'system_role': 'system_admin', 'department': departments['Information Technology'], 'phone_number': '+1-555-0501'},
        ]
        
        staff_by_name = {}
        for s in staff_data:
            # Create user first
            uname = f"{s['first_name'].lower()}.{s['last_name'].lower().replace(' ', '')}"
            user = User.objects.create(
                username=uname,
                email=s['email'],
                first_name=s['first_name'],
                last_name=s['last_name']
            )
            user.set_password(DEFAULT_PASSWORD)
            user.save()
            
            # Create staff profile
            staff = Staff.objects.create(
                user=user,
                department=s['department'],
                first_name=s['first_name'],
                last_name=s['last_name'],
                email=s['email'],
                phone_number=s['phone_number'],
                academic_title=s['academic_title'],
                system_role=s['system_role']
            )
            staff_by_name[f"{s['first_name']} {s['last_name']}"] = staff
            self.stdout.write(f"  Created Staff User: {uname} -> {s['system_role']}")
            
        # 6. Seed Office Assignments (Including conflicts)
        self.stdout.write(self.style.WARNING('[Seeding office assignments...]'))
        today = date.today()
        
        assignments = [
            # INTENTIONAL CONFLICT: Turing Room CR128 (Capacity 1) has BOTH Dr. Alan Turing and Dr. Barbara Liskov assigned!
            {'office': all_offices['Alan Turing Hall - Room CR128'], 'staff': staff_by_name['Alan Turing'], 'start_date': today - timedelta(days=120), 'end_date': None},
            {'office': all_offices['Alan Turing Hall - Room CR128'], 'staff': staff_by_name['Barbara Liskov'], 'start_date': today - timedelta(days=90), 'end_date': None},
            
            # Turing Room CR127 (Capacity 2) - Occupied by Dr. Grace Hopper (1 spot left)
            {'office': all_offices['Alan Turing Hall - Room CR127'], 'staff': staff_by_name['Grace Hopper'], 'start_date': today - timedelta(days=200), 'end_date': None},
            
            # Hopper Room CR129 (Capacity 3) - Occupied by Prof. Charles Babbage & Dr. Claude Shannon (1 spot left)
            {'office': all_offices['Grace Hopper Hall - Room CR129'], 'staff': staff_by_name['Charles Babbage'], 'start_date': today - timedelta(days=180), 'end_date': None},
            {'office': all_offices['Grace Hopper Hall - Room CR129'], 'staff': staff_by_name['Claude Shannon'], 'start_date': today - timedelta(days=150), 'end_date': None},
            
            # Lovelace Room AS111 (Capacity 1) - Occupied by Margaret Hamilton
            {'office': all_offices['Ada Lovelace Tower - Room AS111'], 'staff': staff_by_name['Margaret Hamilton'], 'start_date': today - timedelta(days=60), 'end_date': None},
            
            # Turing Room CR130 (Capacity 3) - Occupied by Linus Torvalds
            {'office': all_offices['Alan Turing Hall - Room CR130'], 'staff': staff_by_name['Linus Torvalds'], 'start_date': today - timedelta(days=90), 'end_date': None},
            
            # Turing Room CR145 (Capacity 2) - Occupied by Dr. Katherine Johnson & Prof. Emmy Noether (FULL)
            {'office': all_offices['Alan Turing Hall - Room CR145'], 'staff': staff_by_name['Katherine Johnson'], 'start_date': today - timedelta(days=365), 'end_date': None},
            {'office': all_offices['Alan Turing Hall - Room CR145'], 'staff': staff_by_name['Emmy Noether'], 'start_date': today - timedelta(days=300), 'end_date': None},
            
            # Hopper Room AS141 (Capacity 1) - Occupied by Dr. John von Neumann
            {'office': all_offices['Grace Hopper Hall - Room AS141'], 'staff': staff_by_name['John von Neumann'], 'start_date': today - timedelta(days=240), 'end_date': None},
            
            # Past Ended Assignments (shows in history)
            {'office': all_offices['Grace Hopper Hall - Room AS142'], 'staff': staff_by_name['Richard Feynman'], 'start_date': today - timedelta(days=150), 'end_date': today - timedelta(days=30)},
        ]
        
        for a in assignments:
            # Bypass serializer validation using direct ORM create to allow setting up the capacity conflict cleanly
            a_obj = OfficeAssignment.objects.create(**a)
            self.stdout.write(f"  Created Assignment: {a_obj.staff.first_name} {a_obj.staff.last_name} in {a_obj.office.building.name} Room {a_obj.office.room_number}")
            
        # 7. Seed IT Equipment
        self.stdout.write(self.style.WARNING('[Seeding IT equipment...]'))
        equipment = [
            {'office': all_offices['Alan Turing Hall - Room CR128'], 'asset_type': 'computer', 'serial_number': 'TURING-PC-128', 'status': 'active'},
            {'office': all_offices['Alan Turing Hall - Room CR128'], 'asset_type': 'monitor', 'serial_number': 'TURING-MON-128', 'status': 'active'},
            
            {'office': all_offices['Alan Turing Hall - Room CR127'], 'asset_type': 'computer', 'serial_number': 'TURING-PC-127', 'status': 'active'},
            {'office': all_offices['Alan Turing Hall - Room CR127'], 'asset_type': 'phone', 'serial_number': 'TURING-PHN-127', 'status': 'active'},
            
            {'office': all_offices['Alan Turing Hall - Room CR120'], 'asset_type': 'smartboard', 'serial_number': 'TURING-SBD-120', 'status': 'active'},
            {'office': all_offices['Alan Turing Hall - Room CR120'], 'asset_type': 'projector', 'serial_number': 'TURING-PRJ-120', 'status': 'maintenance'},
            
            {'office': all_offices['Ada Lovelace Tower - Room AS111'], 'asset_type': 'computer', 'serial_number': 'LOVE-PC-111', 'status': 'active'},
            {'office': all_offices['Ada Lovelace Tower - Room AS111'], 'asset_type': 'monitor', 'serial_number': 'LOVE-MON-111', 'status': 'active'},
            
            {'office': all_offices['Alan Turing Hall - Room CR145'], 'asset_type': 'computer', 'serial_number': 'TURING-PC-145A', 'status': 'active'},
            {'office': all_offices['Alan Turing Hall - Room CR145'], 'asset_type': 'computer', 'serial_number': 'TURING-PC-145B', 'status': 'active'},
            {'office': all_offices['Alan Turing Hall - Room CR145'], 'asset_type': 'printer', 'serial_number': 'TURING-PRT-145', 'status': 'active'},
        ]
        
        for e in equipment:
            equip = ITEquipment.objects.create(**e)
            self.stdout.write(f"  Created Equipment: {equip.asset_type} ({equip.serial_number}) in Room {equip.office.room_number}")
            
        # 8. Seed Office Requests
        self.stdout.write(self.style.WARNING('[Seeding office requests...]'))
        requests = [
            # Pending request
            {'office': all_offices['Alan Turing Hall - Room CR120'], 'staff': staff_by_name['Richard Feynman'], 'reason': 'Requesting a quiet single office on the top floor to focus on quantum simulation research.', 'status': 'pending'},
            # Approved request
            {'office': all_offices['Grace Hopper Hall - Room AS141'], 'staff': staff_by_name['John von Neumann'], 'reason': 'Requires private space to coordinate math courses.', 'status': 'approved'},
            # Rejected request
            {'office': all_offices['Alan Turing Hall - Room CR131'], 'staff': staff_by_name['Claude Shannon'], 'reason': 'Requires large conference room for coding theory seminar study.', 'status': 'rejected'},
        ]
        
        for r in requests:
            req = OfficeRequest.objects.create(**r)
            self.stdout.write(f"  Created Office Request: Request by {req.staff.last_name} for Room {req.office.room_number}")
            
        # 9. Seed Equipment Requests
        self.stdout.write(self.style.WARNING('[Seeding equipment requests...]'))
        equip_requests = [
            # Pending
            {'office': all_offices['Alan Turing Hall - Room CR130'], 'staff': staff_by_name['Linus Torvalds'], 'asset_type': 'monitor', 'category': 'it', 'quantity': 2, 'reason': 'Dual monitors needed for kernel development compilation monitoring.', 'status': 'pending'},
            # Approved
            {'office': all_offices['Alan Turing Hall - Room CR128'], 'staff': staff_by_name['Alan Turing'], 'asset_type': 'chair', 'category': 'furniture', 'quantity': 1, 'reason': 'Ergonomic office chair for back support during long hours of research.', 'status': 'approved', 'serial_number_assigned': 'TURING-CHR-128'},
            # Rejected
            {'office': all_offices['Grace Hopper Hall - Room CR129'], 'staff': staff_by_name['Claude Shannon'], 'asset_type': 'smartboard', 'category': 'it', 'quantity': 1, 'reason': 'Interactive board for cryptography research notes.', 'status': 'rejected', 'rejection_reason': 'Insufficient IT budget for smartboards in shared offices this quarter.'},
        ]
        
        for er in equip_requests:
            ereq = EquipmentRequest.objects.create(**er)
            self.stdout.write(f"  Created Equipment Request: Request by {ereq.staff.last_name} for {ereq.quantity}x {ereq.asset_type}")
            
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('[Success] Premium database seeding completed successfully!'))
        self.stdout.write('')
        
        # Display Credentials Table
        self.stdout.write(self.style.NOTICE('Active credentials to log in (password: testpass123):'))
        self.stdout.write('  +--------------------+--------------------+--------------------+')
        self.stdout.write('  | Name               | Username           | System Role        |')
        self.stdout.write('  +--------------------+--------------------+--------------------+')
        for name, staff in staff_by_name.items():
            uname = staff.user.username
            self.stdout.write(f'  | {name:<18} | {uname:<18} | {staff.system_role:<18} |')
        self.stdout.write('  +--------------------+--------------------+--------------------+')
