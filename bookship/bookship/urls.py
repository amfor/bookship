"""
URL configuration for bookship project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from . import views

from django.views.generic.base import TemplateView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('index/',  views.index, name='index'), 
    path('compare/', views.FileUploadView.as_view(), name='file_upload'),
    path('github_integration/', views.github_integration, name='github_integration'),    
    path('hello-webpack/', TemplateView.as_view(template_name='hello_webpack.html')),
    path('diff_integration/', views.diff_integration, name='diff_integration'),    
    path('submit_comment/', views.submit_comment, name='submit_comment'),    
    path('comments/get/<str:file_hash>/', views.load_comments, name='get_comments'),
    path('components/comments/new', views.render_new_thread, name='new_comment_bubble'),

    path('comments/thread/resolve/', views.resolve_thread, name='resolve_comments'),
    path('get_csrf_token', views.get_csrf_token, name='get_csrf_token'),

]