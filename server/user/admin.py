from django.contrib import admin
from .models import User, Emails, Feedback

admin.site.register(User)
admin.site.register(Emails)
admin.site.register(Feedback)

# admin.site.register(Profile)
