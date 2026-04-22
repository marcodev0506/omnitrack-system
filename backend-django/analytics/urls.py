from django.urls import path
from .views import DriverAnalyticsView 

urlpatterns = [
    path('speed/<int:user_id>/', DriverAnalyticsView, name='driver-speed'),
]