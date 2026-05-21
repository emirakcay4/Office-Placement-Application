"""
Unit tests for the OPA API.

Tests cover:
  - SCRUM-21: Office search and filtering (including dynamic capacity).
  - SCRUM-22: Office detail endpoint with nested data.
  - Business logic: capacity validation on OfficeAssignment.
"""

from datetime import date, timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from api.models import (
    Department, Building, Office, Staff,
    ITEquipment, OfficeAssignment, OfficeRequest, EquipmentRequest
)


class BaseTestSetup(TestCase):
    """
    Shared test data for all test cases.
    Creates a minimal but complete set of related objects.
    """

    def setUp(self):
        """Set up test data used across all test methods."""
        # Department
        self.dept = Department.objects.create(
            name='Computer Science',
            description='CS Department',
        )

        # Building
        self.building = Building.objects.create(
            name='Engineering Building',
            address='100 University Ave',
        )

        # Offices
        self.office_single = Office.objects.create(
            building=self.building,
            room_number='101',
            floor=1,
            capacity=1,
            office_type='single',
        )
        self.office_shared = Office.objects.create(
            building=self.building,
            room_number='102',
            floor=1,
            capacity=3,
            office_type='shared',
        )

        # Staff members
        self.staff_alice = Staff.objects.create(
            department=self.dept,
            first_name='Alice',
            last_name='Johnson',
            email='alice@test.edu',
            academic_title='Dr.',
            system_role='faculty',
        )
        self.staff_bob = Staff.objects.create(
            department=self.dept,
            first_name='Bob',
            last_name='Smith',
            email='bob@test.edu',
            academic_title='Prof.',
            system_role='department_admin',
        )
        self.staff_carol = Staff.objects.create(
            department=self.dept,
            first_name='Carol',
            last_name='Williams',
            email='carol@test.edu',
            academic_title='',
            system_role='faculty',
        )

        # IT Equipment
        self.equipment = ITEquipment.objects.create(
            office=self.office_shared,
            asset_type='computer',
            serial_number='TEST-PC-001',
            status='active',
        )

        # Client
        self.client = APIClient()


class OfficeSearchTests(BaseTestSetup):
    """
    Tests for SCRUM-21: Office search and filtering.
    Endpoint: GET /api/offices/search/
    """

    def test_list_all_offices(self):
        """All offices should appear in the search results."""
        response = self.client.get('/api/offices/search/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Paginated results are in 'results' key
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)

    def test_filter_by_office_type(self):
        """Filter by office_type=single should return only single offices."""
        response = self.client.get('/api/offices/search/?office_type=single')
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['office_type'], 'single')

    def test_filter_by_room_number(self):
        """Partial room number search should work."""
        response = self.client.get('/api/offices/search/?room_number=10')
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)  # 101, 102

    def test_available_capacity_annotation(self):
        """Offices should show correct available_capacity."""
        # Assign Alice to office_single (capacity=1)
        OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None,
        )
        response = self.client.get('/api/offices/search/')
        results = response.data.get('results', response.data)

        for office_data in results:
            if office_data['room_number'] == '101':
                self.assertEqual(office_data['current_occupants_count'], 1)
                self.assertEqual(office_data['available_capacity'], 0)
            elif office_data['room_number'] == '102':
                self.assertEqual(office_data['current_occupants_count'], 0)
                self.assertEqual(office_data['available_capacity'], 3)

    def test_filter_by_min_available(self):
        """min_available=1 should exclude full offices."""
        # Fill up office_single
        OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None,
        )
        response = self.client.get('/api/offices/search/?min_available=1')
        results = response.data.get('results', response.data)
        # Only office_shared (available=3) should appear
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['room_number'], '102')

    def test_ended_assignment_not_counted(self):
        """Ended assignments (end_date is set) should NOT reduce capacity."""
        OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() - timedelta(days=1),  # ENDED
        )
        response = self.client.get('/api/offices/search/')
        results = response.data.get('results', response.data)

        for office_data in results:
            if office_data['room_number'] == '101':
                self.assertEqual(office_data['current_occupants_count'], 0)
                self.assertEqual(office_data['available_capacity'], 1)


class OfficeDetailTests(BaseTestSetup):
    """
    Tests for SCRUM-22: Office detail endpoint.
    Endpoint: GET /api/offices/<pk>/
    """

    def test_detail_returns_office_data(self):
        """Detail endpoint should return office info with nested data."""
        response = self.client.get(f'/api/offices/{self.office_shared.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['room_number'], '102')
        self.assertEqual(response.data['building_name'], 'Engineering Building')

    def test_detail_includes_current_occupants(self):
        """Detail should show current occupants with staff info."""
        OfficeAssignment.objects.create(
            office=self.office_shared,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None,
        )
        response = self.client.get(f'/api/offices/{self.office_shared.pk}/')
        occupants = response.data['current_occupants']
        self.assertEqual(len(occupants), 1)
        self.assertIn('Dr. Alice Johnson', occupants[0]['staff']['full_name'])

    def test_detail_excludes_ended_occupants(self):
        """Ended assignments should NOT appear in current_occupants."""
        OfficeAssignment.objects.create(
            office=self.office_shared,
            staff=self.staff_bob,
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() - timedelta(days=10),
        )
        response = self.client.get(f'/api/offices/{self.office_shared.pk}/')
        self.assertEqual(len(response.data['current_occupants']), 0)

    def test_detail_includes_it_equipment(self):
        """Detail should list IT equipment in the office."""
        response = self.client.get(f'/api/offices/{self.office_shared.pk}/')
        equipment = response.data['it_equipment']
        self.assertEqual(len(equipment), 1)
        self.assertEqual(equipment[0]['serial_number'], 'TEST-PC-001')

    def test_detail_includes_capacity_status(self):
        """Detail should include capacity_status with total/occupied/available."""
        OfficeAssignment.objects.create(
            office=self.office_shared,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None,
        )
        response = self.client.get(f'/api/offices/{self.office_shared.pk}/')
        cap = response.data['capacity_status']
        self.assertEqual(cap['total'], 3)
        self.assertEqual(cap['occupied'], 1)
        self.assertEqual(cap['available'], 2)

    def test_detail_404_for_nonexistent_office(self):
        """Should return 404 for an office that doesn't exist."""
        response = self.client.get('/api/offices/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class OfficeAssignmentValidationTests(BaseTestSetup):
    """
    Tests for business logic: capacity validation when creating assignments.
    Endpoint: POST /api/assignments/

    These tests require authentication because OfficeAssignmentViewSet
    uses IsAdminOrReadOnly — POST requests need a superuser.
    """

    def setUp(self):
        """Set up test data and authenticate the client as superuser."""
        super().setUp()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@test.edu',
            password='testpass123',
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_create_assignment_success(self):
        """Creating an assignment in an office with capacity should succeed."""
        response = self.client.post('/api/assignments/', {
            'office': self.office_shared.pk,
            'staff': self.staff_alice.pk,
            'start_date': date.today().isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_reject_assignment_when_office_full(self):
        """Creating an assignment in a full office should return 400."""
        # Fill up office_single (capacity=1)
        OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None,
        )
        # Try to add another person
        response = self.client.post('/api/assignments/', {
            'office': self.office_single.pk,
            'staff': self.staff_bob.pk,
            'start_date': date.today().isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('office', response.data)

    def test_reject_duplicate_active_assignment(self):
        """Same staff + same office with active assignment should return 400."""
        OfficeAssignment.objects.create(
            office=self.office_shared,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None,
        )
        response = self.client.post('/api/assignments/', {
            'office': self.office_shared.pk,
            'staff': self.staff_alice.pk,
            'start_date': date.today().isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('staff', response.data)

    def test_allow_assignment_after_previous_ended(self):
        """
        If the previous assignment ended (end_date is set),
        a new assignment to the same full office should succeed.
        """
        OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today() - timedelta(days=90),
            end_date=date.today() - timedelta(days=1),  # ENDED
        )
        # Now office_single is empty (capacity=1), new assignment should work
        response = self.client.post('/api/assignments/', {
            'office': self.office_single.pk,
            'staff': self.staff_bob.pk,
            'start_date': date.today().isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class JWTAuthTests(BaseTestSetup):
    """
    Tests for SCRUM-24: JWT Authentication.

    Covers:
      - Login returns access + refresh tokens + staff profile data
      - Bad credentials get rejected
      - /me endpoint returns current user profile
      - Protected endpoints require authentication
      - Role-based access control works with JWT
    """

    def setUp(self):
        """Create User accounts linked to Staff for auth testing."""
        super().setUp()

        # Create a Django User linked to staff_alice (faculty)
        self.user_alice = User.objects.create_user(
            username='alice.johnson',
            email='alice@test.edu',
            password='testpass123',
        )
        self.staff_alice.user = self.user_alice
        self.staff_alice.save()

        # Create a system_admin User
        self.user_admin = User.objects.create_user(
            username='admin.user',
            email='admin@test.edu',
            password='testpass123',
        )
        self.staff_admin = Staff.objects.create(
            department=self.dept,
            first_name='Admin',
            last_name='User',
            email='admin.user@test.edu',
            system_role='system_admin',
            user=self.user_admin,
        )

    def test_login_returns_tokens_and_profile(self):
        """POST /api/auth/login/ with valid credentials returns tokens + staff data."""
        response = self.client.post('/api/auth/login/', {
            'username': 'alice.johnson',
            'password': 'testpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Must include tokens
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        # Must include user info with staff profile
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'alice.johnson')
        self.assertIsNotNone(response.data['user']['staff_profile'])
        self.assertEqual(
            response.data['user']['staff_profile']['system_role'],
            'faculty',
        )

    def test_login_bad_credentials(self):
        """POST /api/auth/login/ with wrong password returns 401."""
        response = self.client.post('/api/auth/login/', {
            'username': 'alice.johnson',
            'password': 'wrong_password',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_profile(self):
        """GET /api/auth/me/ with valid token returns user profile."""
        self.client.force_authenticate(user=self.user_alice)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'alice.johnson')
        self.assertIsNotNone(response.data['staff_profile'])
        self.assertEqual(
            response.data['staff_profile']['system_role'],
            'faculty',
        )

    def test_me_requires_authentication(self):
        """GET /api/auth/me/ without token returns 401."""
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_requires_auth(self):
        """POST to a protected endpoint without token returns 401."""
        response = self.client.post('/api/assignments/', {
            'office': self.office_shared.pk,
            'staff': self.staff_alice.pk,
            'start_date': date.today().isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_admin_cannot_write(self):
        """Faculty user (non-admin) can read but not create assignments."""
        self.client.force_authenticate(user=self.user_alice)

        # GET should work (read-only for all authenticated users)
        response = self.client.get('/api/assignments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # POST should fail (faculty is not system_admin)
        response = self.client.post('/api/assignments/', {
            'office': self.office_shared.pk,
            'staff': self.staff_alice.pk,
            'start_date': date.today().isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class OfficeRequestTests(BaseTestSetup):
    """
    Tests for the OfficeRequest endpoints.
    Endpoint: /api/requests/
    """

    def setUp(self):
        super().setUp()

        # Link django users to staff
        self.user_alice = User.objects.create_user(
            username='alice.johnson',
            email='alice@test.edu',
            password='testpass123',
        )
        self.staff_alice.user = self.user_alice
        self.staff_alice.save()

        self.user_carol = User.objects.create_user(
            username='carol.williams',
            email='carol@test.edu',
            password='testpass123',
        )
        self.staff_carol.user = self.user_carol
        self.staff_carol.save()

        self.user_admin = User.objects.create_user(
            username='admin.user',
            email='admin@test.edu',
            password='testpass123',
        )
        self.staff_admin = Staff.objects.create(
            department=self.dept,
            first_name='Admin',
            last_name='User',
            email='admin.user@test.edu',
            system_role='system_admin',
            user=self.user_admin,
        )

    def test_create_request_success(self):
        """Faculty user can successfully submit a request for an office."""
        self.client.force_authenticate(user=self.user_alice)
        response = self.client.post('/api/requests/', {
            'office': self.office_single.pk,
            'reason': 'Need a quiet workspace.',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['staff'], self.staff_alice.pk)

    def test_create_request_forces_pending(self):
        """Standard faculty user cannot create an approved request directly."""
        self.client.force_authenticate(user=self.user_alice)
        response = self.client.post('/api/requests/', {
            'office': self.office_single.pk,
            'reason': 'Cheat my way to approved.',
            'status': 'approved',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)

    def test_admin_can_create_non_pending_request(self):
        """Admin user can create an approved request directly."""
        self.client.force_authenticate(user=self.user_admin)
        response = self.client.post('/api/requests/', {
            'office': self.office_single.pk,
            'reason': 'Direct assignment by admin.',
            'status': 'approved',
            'staff': self.staff_alice.pk, # Will be ignored anyway but let's test it
        })
        # Note: viewset perform_create always attaches request.user.staff_profile,
        # so staff will be self.staff_admin. Let's make sure it is 201 Created.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'approved')

    def test_queryset_visibility_faculty(self):
        """Faculty member can only see their own requests."""
        # Create requests for Alice and Carol
        req_alice = OfficeRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            reason='Alice reason',
        )
        req_carol = OfficeRequest.objects.create(
            office=self.office_shared,
            staff=self.staff_carol,
            reason='Carol reason',
        )

        # Authenticate as Alice
        self.client.force_authenticate(user=self.user_alice)
        response = self.client.get('/api/requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        
        # Alice should only see 1 request, which is her own
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], req_alice.id)

    def test_queryset_visibility_admin(self):
        """Admin can see all requests in the system."""
        req_alice = OfficeRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            reason='Alice reason',
        )
        req_carol = OfficeRequest.objects.create(
            office=self.office_shared,
            staff=self.staff_carol,
            reason='Carol reason',
        )

        # Authenticate as Admin
        self.client.force_authenticate(user=self.user_admin)
        response = self.client.get('/api/requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        
        # Admin should see both requests
        self.assertEqual(len(results), 2)

    def test_faculty_cannot_update_status(self):
        """Faculty member cannot update the status of a request."""
        req = OfficeRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            reason='Alice reason',
        )

        self.client.force_authenticate(user=self.user_alice)
        response = self.client.patch(f'/api/requests/{req.id}/', {
            'status': 'approved'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)

    def test_admin_can_update_status(self):
        """Admin user can approve or reject requests."""
        req = OfficeRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            reason='Alice reason',
        )

        self.client.force_authenticate(user=self.user_admin)
        response = self.client.patch(f'/api/requests/{req.id}/', {
            'status': 'approved'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')
        req.refresh_from_db()
        self.assertEqual(req.status, 'approved')

    def test_admin_approval_creates_assignment(self):
        """Admin approving a request automatically creates a corresponding OfficeAssignment."""
        req = OfficeRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            reason='Need single room'
        )
        
        # Verify no active assignment exists yet
        self.assertFalse(OfficeAssignment.objects.filter(office=self.office_single, staff=self.staff_alice, end_date__isnull=True).exists())

        self.client.force_authenticate(user=self.user_admin)
        response = self.client.patch(f'/api/requests/{req.id}/', {'status': 'approved'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify active assignment is created
        self.assertTrue(OfficeAssignment.objects.filter(office=self.office_single, staff=self.staff_alice, end_date__isnull=True).exists())

    def test_admin_approval_terminates_previous_assignment(self):
        """Admin approving a request automatically terminates previous active assignments of that staff member."""
        from datetime import date
        # Create a previous assignment for Alice in office_shared
        prev_assignment = OfficeAssignment.objects.create(
            office=self.office_shared,
            staff=self.staff_alice,
            start_date=date(2026, 1, 1),
            end_date=None
        )

        req = OfficeRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            reason='Moving to quiet room'
        )

        self.client.force_authenticate(user=self.user_admin)
        response = self.client.patch(f'/api/requests/{req.id}/', {'status': 'approved'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Previous assignment should be terminated (end_date populated)
        prev_assignment.refresh_from_db()
        self.assertEqual(prev_assignment.end_date, date.today())

        # New assignment should be active
        self.assertTrue(OfficeAssignment.objects.filter(office=self.office_single, staff=self.staff_alice, end_date__isnull=True).exists())

    def test_admin_approval_capacity_validation(self):
        """Admin cannot approve a request if the requested office is already at full capacity."""
        from datetime import date
        # fill self.office_single's capacity (it has capacity=1)
        OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_carol,
            start_date=date.today(),
            end_date=None
        )

        req = OfficeRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            reason='Try to squeeze in'
        )

        self.client.force_authenticate(user=self.user_admin)
        response = self.client.patch(f'/api/requests/{req.id}/', {'status': 'approved'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)
        self.assertIn('full capacity', response.data['status'][0])

    def test_faculty_cannot_duplicate_pending_request(self):
        """Faculty member cannot file duplicate pending requests for the same office."""
        self.client.force_authenticate(user=self.user_alice)
        
        # Create first request
        response1 = self.client.post('/api/requests/', {
            'office': self.office_single.pk,
            'reason': 'First request.'
        })
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # Attempt to create duplicate request
        response2 = self.client.post('/api/requests/', {
            'office': self.office_single.pk,
            'reason': 'Second duplicate request.'
        })
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('office', response2.data)
        self.assertIn('already have a pending request', response2.data['office'][0])


class OfficeVacateAndUnassignTests(BaseTestSetup):
    """
    Tests for the Office Unassignment and Vacate Request workflows.
    Includes role-based permissions (RBAC) and department boundaries.
    """

    def setUp(self):
        super().setUp()

        # Link Django users to staff
        self.user_alice = User.objects.create_user(
            username='alice.johnson',
            email='alice@test.edu',
            password='testpass123',
        )
        self.staff_alice.user = self.user_alice
        self.staff_alice.save()

        self.user_carol = User.objects.create_user(
            username='carol.williams',
            email='carol@test.edu',
            password='testpass123',
        )
        self.staff_carol.user = self.user_carol
        self.staff_carol.save()

        # Create department admin for self.dept (Computer Science)
        self.user_dept_admin = User.objects.create_user(
            username='dept.admin',
            email='dept_admin@test.edu',
            password='testpass123',
        )
        self.staff_bob.user = self.user_dept_admin
        self.staff_bob.save()

        # Create system admin
        self.user_system_admin = User.objects.create_user(
            username='system.admin',
            email='system_admin@test.edu',
            password='testpass123',
        )
        self.staff_sys_admin = Staff.objects.create(
            department=self.dept,
            first_name='Sys',
            last_name='Admin',
            email='sysadmin@test.edu',
            system_role='system_admin',
            user=self.user_system_admin,
        )

        # Create another department
        self.other_dept = Department.objects.create(
            name='Chemistry',
            description='Chemistry Department',
        )

        # Create a department admin for other_dept
        self.user_other_dept_admin = User.objects.create_user(
            username='other.dept.admin',
            email='other_dept_admin@test.edu',
            password='testpass123',
        )
        self.staff_other_dept_admin = Staff.objects.create(
            department=self.other_dept,
            first_name='David',
            last_name='Jones',
            email='david@test.edu',
            system_role='department_admin',
            user=self.user_other_dept_admin,
        )

        # Create a faculty member in other_dept
        self.user_other_faculty = User.objects.create_user(
            username='other.faculty',
            email='other_fac@test.edu',
            password='testpass123',
        )
        self.staff_other_faculty = Staff.objects.create(
            department=self.other_dept,
            first_name='Eve',
            last_name='Brown',
            email='eve@test.edu',
            system_role='faculty',
            user=self.user_other_faculty,
        )

    def test_department_admin_can_unassign_own_staff(self):
        """Department admin can unassign a staff member in their own department."""
        assignment = OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None
        )
        self.client.force_authenticate(user=self.user_dept_admin)
        response = self.client.patch(
            f'/api/assignments/{assignment.id}/',
            {'end_date': date.today()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        assignment.refresh_from_db()
        self.assertEqual(assignment.end_date, date.today())

    def test_department_admin_cannot_unassign_other_dept_staff(self):
        """Department admin cannot unassign a staff member from another department."""
        assignment = OfficeAssignment.objects.create(
            office=self.office_shared,
            staff=self.staff_other_faculty,
            start_date=date.today(),
            end_date=None
        )
        # CS Dept admin bob tries to unassign Chemistry faculty Eve
        self.client.force_authenticate(user=self.user_dept_admin)
        response = self.client.patch(
            f'/api/assignments/{assignment.id}/',
            {'end_date': date.today()}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_faculty_cannot_unassign_manually(self):
        """Faculty members are blocked from making direct office assignment updates."""
        assignment = OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None
        )
        self.client.force_authenticate(user=self.user_alice)
        response = self.client.patch(
            f'/api/assignments/{assignment.id}/',
            {'end_date': date.today()}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_faculty_can_create_vacate_request(self):
        """Faculty can create a request to vacate their current office."""
        self.client.force_authenticate(user=self.user_alice)
        response = self.client.post('/api/requests/', {
            'office': self.office_single.pk,
            'reason': '[VACATE REQUEST] Moving out.',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertTrue(response.data['reason'].startswith('[VACATE REQUEST]'))

    def test_approve_vacate_request_terminates_assignment_and_bypasses_capacity(self):
        """Approving a vacate request terminates the assignment, does not create a new one, and bypasses capacity validation."""
        # 1. Create active assignment for Alice in office_single
        assignment = OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None
        )
        # 2. Create vacate request
        req = OfficeRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            reason='[VACATE REQUEST] Vacating office.',
            status='pending'
        )
        self.client.force_authenticate(user=self.user_system_admin)
        response = self.client.patch(f'/api/requests/{req.id}/', {'status': 'approved'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 4. Verify assignment is terminated
        assignment.refresh_from_db()
        self.assertEqual(assignment.end_date, date.today())

        # 5. Verify NO new assignment was created
        active_assignments = OfficeAssignment.objects.filter(staff=self.staff_alice, end_date__isnull=True)
        self.assertEqual(active_assignments.count(), 0)

    def test_dept_admin_cannot_approve_other_dept_vacate_request(self):
        """Department admin cannot approve a vacate request of a staff member from another department."""
        # 1. Active assignment for Chemistry staff member Eve
        assignment = OfficeAssignment.objects.create(
            office=self.office_shared,
            staff=self.staff_other_faculty,
            start_date=date.today(),
            end_date=None
        )
        # 2. Vacate request for Eve
        req = OfficeRequest.objects.create(
            office=self.office_shared,
            staff=self.staff_other_faculty,
            reason='[VACATE REQUEST] Vacating Chemistry office.',
            status='pending'
        )
        # 3. Authenticate as CS dept admin Bob and try to approve Chemistry staff Eve's request
        self.client.force_authenticate(user=self.user_dept_admin)
        response = self.client.patch(f'/api/requests/{req.id}/', {'status': 'approved'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)
        self.assertIn('Department Admins can only manage requests for staff within their own department', response.data['status'][0])


class EquipmentRequestTests(OfficeVacateAndUnassignTests):
    """
    Tests for the Equipment Request and Management workflows.
    Includes validation, roles, and auto-deployment logic.
    """

    def setUp(self):
        super().setUp()
        
        # Create an IT Department user for testing permissions
        self.user_it_staff = User.objects.create_user(
            username='it.staff',
            email='it@test.edu',
            password='testpass123',
        )
        self.staff_it_staff = Staff.objects.create(
            department=self.dept,
            first_name='IT',
            last_name='Staff',
            email='it@test.edu',
            system_role='it_department',
            user=self.user_it_staff,
        )

    def test_faculty_cannot_request_for_unassigned_office(self):
        """Faculty cannot submit an equipment request for a room they do not occupy."""
        self.client.force_authenticate(user=self.user_alice)
        # Alice is not assigned to office_shared
        response = self.client.post('/api/equipment-requests/', {
            'office': self.office_shared.pk,
            'asset_type': 'computer',
            'quantity': 1,
            'reason': 'Need a PC.'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('office', response.data)

    def test_faculty_can_request_for_assigned_office(self):
        """Faculty can submit an equipment request for their currently assigned office."""
        # 1. Assign Alice to office_single
        OfficeAssignment.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            start_date=date.today(),
            end_date=None
        )
        self.client.force_authenticate(user=self.user_alice)
        response = self.client.post('/api/equipment-requests/', {
            'office': self.office_single.pk,
            'asset_type': 'computer',
            'quantity': 1,
            'reason': 'Need a computer for research.'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['category'], 'it')  # auto-detected

    def test_faculty_cannot_approve_own_request(self):
        """Faculty members cannot approve or manage requests directly."""
        req = EquipmentRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            asset_type='computer',
            category='it',
            quantity=1,
            reason='Research.',
            status='pending'
        )
        self.client.force_authenticate(user=self.user_alice)
        response = self.client.patch(f'/api/equipment-requests/{req.id}/', {
            'status': 'approved'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_it_staff_can_approve_request_and_deploys_asset(self):
        """IT staff can approve a tech request, which automatically creates an ITEquipment record."""
        req = EquipmentRequest.objects.create(
            office=self.office_single,
            staff=self.staff_alice,
            asset_type='computer',
            category='it',
            quantity=1,
            reason='Research.',
            status='pending'
        )
        self.client.force_authenticate(user=self.user_it_staff)
        response = self.client.patch(f'/api/equipment-requests/{req.id}/', {
            'status': 'approved',
            'serial_number_assigned': 'SN-ALICE-PC-999'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')
        self.assertEqual(response.data['serial_number_assigned'], 'SN-ALICE-PC-999')

        # Verify asset was deployed in the database
        asset = ITEquipment.objects.filter(office=self.office_single, serial_number='SN-ALICE-PC-999')
        self.assertTrue(asset.exists())
        self.assertEqual(asset.first().asset_type, 'computer')
        self.assertEqual(asset.first().status, 'active')

    def test_dept_admin_cannot_approve_other_department_request(self):
        """Department Admin cannot manage equipment requests of a staff member from another department."""
        # Request for Eve (Chemistry department)
        req = EquipmentRequest.objects.create(
            office=self.office_shared,
            staff=self.staff_other_faculty,
            asset_type='chair',
            category='furniture',
            quantity=1,
            reason='Need chair.',
            status='pending'
        )
        # Authenticate as CS dept admin Bob
        self.client.force_authenticate(user=self.user_dept_admin)
        response = self.client.patch(f'/api/equipment-requests/{req.id}/', {
            'status': 'approved'
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

