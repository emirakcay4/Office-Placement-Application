"""
URL configuration for the OPA API.

Routes:
  /api/auth/login/           — SCRUM-24: JWT login (get tokens)
  /api/auth/refresh/         — SCRUM-24: JWT refresh (renew access token)
  /api/auth/me/              — SCRUM-24: current user profile
  /api/offices/search/       — SCRUM-21: search & filter offices
  /api/offices/<pk>/         — SCRUM-22: office detail with occupants & equipment
  /api/departments/          — SCRUM-23: department CRUD
  /api/buildings/            — SCRUM-23: building CRUD
  /api/staff/                — SCRUM-23: staff CRUD
  /api/equipment/            — SCRUM-23: IT equipment CRUD
  /api/assignments/          — SCRUM-23: office assignment CRUD
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    CurrentUserView,
    OfficeSearchView,
    OfficeDetailView,
    DepartmentViewSet,
    BuildingViewSet,
    StaffViewSet,
    ITEquipmentViewSet,
    OfficeAssignmentViewSet,
)

# Router for CRUD ViewSets (SCRUM-23)
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'buildings', BuildingViewSet, basename='building')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'equipment', ITEquipmentViewSet, basename='equipment')
router.register(r'assignments', OfficeAssignmentViewSet, basename='assignment')

urlpatterns = [
    # SCRUM-24: JWT Authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),

    # SCRUM-21: Office search & filter
    path('offices/search/', OfficeSearchView.as_view(), name='office-search'),

    # SCRUM-22: Office detail
    path('offices/<int:pk>/', OfficeDetailView.as_view(), name='office-detail'),

    # SCRUM-23: CRUD routes via router
    path('', include(router.urls)),
]

