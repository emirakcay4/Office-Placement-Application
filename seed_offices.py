import os
import django
from django.utils import timezone
from datetime import timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'opa_backend.settings')
django.setup()

from api.models import Office, Building, Staff, OfficeAssignment

def run():
    print("Deleting existing offices and assignments...")
    Office.objects.all().delete()
    
    building, _ = Building.objects.get_or_create(name="Main Campus", defaults={"address": "Campus Center"})
    
    offices_to_create = [
        # Zemin
        ('0', 'AS139'), ('0', 'AS140'),
        ('0', 'CR128'), ('0', 'CR127'), ('0', 'CR126'), ('0', 'CR125'), ('0', 'CR124'),
        ('0', 'CR120'), ('0', 'CR121'), ('0', 'CR122'), ('0', 'CR123'), ('0', 'CR129'),
        # Floor 1
        ('1', 'AS144'), ('1', 'AS123A'), ('1', 'AS136'), ('1', 'AS138'), ('1', 'AS137'),
        ('1', 'AS135'), ('1', 'AS134'),
        ('1', 'CR132'), ('1', 'CR136'), ('1', 'CR135'), ('1', 'CR134'), ('1', 'CR130'), ('1', 'CR131'),
    ]
    left = ['AS122','AS121','AS120','AS119','AS118','AS117','AS116','AS115','AS114','AS113','AS112','AS111']
    midL = ['AS123','AS124','AS127','AS125','AS126']
    midR = ['AS128','AS129','AS130','AS131','AS132','AS133']
    for x in left + midL + midR:
        offices_to_create.append(('1', x))
        
    # Floor 2
    offices_to_create.extend([('2', 'AS141'), ('2', 'AS142'), ('2', 'AS143')])
    floor2_cr = ['CR145', 'CR146', 'CR146A', 'CR145A', 'CR144', 'CR147', 'CR147A', 'CR144A', 'CR143', 'CR143A', 'CR142', 'CR148A', 'CR142A', 'CR141', 'CR140A', 'CR140']
    for cr in floor2_cr:
        offices_to_create.append(('2', cr))
    
    print("Creating offices...")
    created_offices = []
    for floor, room in offices_to_create:
        cap = random.choice([1, 2, 2, 3]) # Bias towards 2
        o = Office.objects.create(
            building=building,
            room_number=room,
            floor=int(floor),
            capacity=cap,
            office_type='shared' if cap > 1 else 'single'
        )
        created_offices.append(o)
        
    # Assign some staff
    staff_members = list(Staff.objects.all())
    if not staff_members:
        print("No staff members found to assign.")
        return
        
    print("Assigning staff...")
    # Shuffle and pick a random subset
    random.shuffle(staff_members)
    staff_to_assign = staff_members[:min(12, len(staff_members))]
    
    for s in staff_to_assign:
        office = random.choice(created_offices)
        OfficeAssignment.objects.create(
            office=office,
            staff=s,
            start_date=timezone.now().date() - timedelta(days=random.randint(10, 300))
        )
        
    print(f"Seed complete. Created {len(created_offices)} offices and {len(staff_to_assign)} assignments.")

if __name__ == '__main__':
    run()
