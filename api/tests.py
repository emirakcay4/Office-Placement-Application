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
    ITEquipment, OfficeAssignment,
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

