from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "Welcome to Share Positive Energy API!"})


urlpatterns = [
    path("", home),
    path('admin/', admin.site.urls),
    path('auth/', include('user.urls', namespace='user')),
]
