from api.models import Office
from django.db.models import Count

print("=== Building Distribution ===")
qs = Office.objects.values('building__name').annotate(c=Count('id')).order_by('building__name')
for r in qs:
    bname = r['building__name']
    cnt = r['c']
    print("  " + bname + ": " + str(cnt) + " offices")

print("Total: " + str(Office.objects.count()) + " offices")

print("")
print("=== Floor x Building Distribution ===")
qs2 = Office.objects.values('floor', 'building__name').annotate(c=Count('id')).order_by('floor', 'building__name')
for r in qs2:
    fl = r['floor']
    bname = r['building__name']
    cnt = r['c']
    print("  Floor " + str(fl) + " / " + bname + ": " + str(cnt))
