from django.urls import path
from .views import DriverAnalyticsView

urlpatterns = [
    path('speed/<int:user_id>/', DriverAnalyticsView.as_view(), name='driver-speed'),
]